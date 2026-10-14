import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, redirect, useMatches, useNavigate, useLocation } from "react-router";

import "~/styles/studio.css";
import { StudioError } from "~/components/studio/states/StudioError";
import { StudioDataProvider, useQuery, useStudio } from "~/components/studio/data";
import { SessionExpired } from "~/components/studio/shell/SessionExpired";
import { Inert } from "~/components/studio/Inert";
import { LeaveGuard } from "~/components/studio/states/LeaveGuard";
import { useToast } from "~/components/studio/Toast";
import { ShellContext } from "~/components/studio/shell/ShellContext";
import { Shell } from "~/components/studio/shell/Shell";
import { ToastProvider } from "~/components/studio/Toast";
import { loadRepo } from "~/lib/studio/client";
import { loginPath } from "~/lib/studio/paths";
import { syncPending } from "~/lib/studio/sync";
import type { Session, StudioRepo } from "~/lib/studio/repo";
import type { Route } from "./+types/shell";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Studio" }, { name: "robots", content: "noindex, nofollow" }];
}

/** Every Studio route but sign-in needs a session and the owner check (05 · Routes). */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const repo = await loadRepo();
  const session = await repo.auth.session();
  if (!session) {
    const url = new URL(request.url);
    return redirect(loginPath(url.pathname));
  }
  return { repo, session };
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <StudioError error={error} />;
}

export function HydrateFallback() {
  return <div className="st" style={{ minHeight: "100vh" }} />;
}

/**
 * A route's `handle.studioNav` picks the rail on laptops (Website builder); `studioTabbar: false`
 * hides the phone tab bar (editors); `studioChrome: false` drops the Studio nav altogether (Draft
 * preview, which has its own bar).
 */
function useNavMode(): { nav: "auto" | "rail"; tabbar: boolean; chrome: boolean } {
  const matches = useMatches();
  const handles = matches.map(
    (m) => (m.handle ?? {}) as { studioNav?: string; studioTabbar?: boolean; studioChrome?: boolean },
  );
  return {
    nav: handles.some((h) => h.studioNav === "rail") ? "rail" : "auto",
    tabbar: !handles.some((h) => h.studioTabbar === false),
    chrome: !handles.some((h) => h.studioChrome === false),
  };
}

function Frame({ repo, session }: { repo: StudioRepo; session: Session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { nav, tabbar, chrome } = useNavMode();
  const toast = useToast();
  const { cache } = useStudio();
  // Edits queued offline (or before a session ended) sync before the page loads, so it opens on
  // the saved versions. "✓ Signed in. 3 changes synced." after a sign-in (05 · Session expiry).
  const [synced, setSynced] = useState(false);
  const signedIn = Boolean((location.state as { signedIn?: boolean } | null)?.signedIn);
  useEffect(() => {
    let alive = true;
    void syncPending(repo)
      .then(({ synced: n }) => {
        if (!alive) return;
        if (n > 0) {
          cache.clear();
          const what = `${String(n)} ${n === 1 ? "change" : "changes"} synced.`;
          toast.show({ message: signedIn ? `Signed in. ${what}` : what });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setSynced(true);
      });
    return () => {
      alive = false;
    };
    // Once per arrival in Studio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);
  const projects = useQuery("projects", (r) => r.projects.list());
  const signingOut = useRef(false);
  const [expired, setExpired] = useState(false);
  const [spoken, setSpoken] = useState({ text: "", n: 0 });

  useEffect(
    () =>
      repo.auth.onChange((next) => {
        // A session that ends here without "Sign out" was revoked or expired elsewhere: keep the
        // page visible, read-only, behind the dialog (05 · Session expiry while editing).
        if (!next && !signingOut.current) setExpired(true);
        if (next) setExpired(false);
      }),
    [repo],
  );

  // Back/forward cache: a page restored after sign-out must never show content (06 · Client code).
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  const api = useMemo(
    () => ({
      session,
      signOut: (scope: "local" | "global") => {
        signingOut.current = true;
        void repo.auth.signOut(scope).then(() => navigate("/studio/signed-out", { replace: true }));
      },
      // A trailing space alternates so the same message twice is still announced.
      announce: (text: string) => {
        setSpoken((s) => ({ text: s.n % 2 ? text : `${text}\u00a0`, n: s.n + 1 }));
      },
    }),
    [repo, session, navigate],
  );
  const signOut = api.signOut;

  const body = (
    <>
      <Inert when={expired}>{synced ? <Outlet /> : <div aria-busy="true" style={{ flex: 1 }} />}</Inert>
      <LeaveGuard />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {spoken.text}
      </div>
      <SessionExpired
        open={expired}
        email={session.email}
        onSignIn={() => {
          void navigate(loginPath(pathname, "signed-out"));
        }}
      />
    </>
  );
  return (
    <ShellContext.Provider value={api}>
      {chrome ? (
        <Shell
          email={session.email}
          projectCount={projects.data?.length}
          nav={nav}
          tabbar={tabbar}
          onSignOut={signOut}
        >
          {body}
        </Shell>
      ) : (
        <div className="st">{body}</div>
      )}
    </ShellContext.Provider>
  );
}

export default function StudioShell({ loaderData }: Route.ComponentProps) {
  const { repo, session } = loaderData;
  return (
    <StudioDataProvider repo={repo}>
      <ToastProvider>
        <Frame repo={repo} session={session} />
      </ToastProvider>
    </StudioDataProvider>
  );
}
