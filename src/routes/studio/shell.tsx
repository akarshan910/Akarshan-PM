import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Outlet, redirect, useMatches, useNavigate, useLocation } from "react-router";

import "~/styles/studio.css";
import { StudioDataProvider, useQuery } from "~/components/studio/data";
import { SessionExpired } from "~/components/studio/shell/SessionExpired";
import { ShellContext } from "~/components/studio/shell/ShellContext";
import { Shell } from "~/components/studio/shell/Shell";
import { ToastProvider } from "~/components/studio/Toast";
import { loadRepo } from "~/lib/studio/client";
import { loginPath } from "~/lib/studio/paths";
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

export function HydrateFallback() {
  return <div className="st" style={{ minHeight: "100vh" }} />;
}

/** Makes the page read-only behind a dialog (React 18 has no `inert` prop). */
function Inert({ when, children }: { when: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.toggleAttribute("inert", when);
  }, [when]);
  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/** A route's `handle.studioNav` picks the rail on laptops (Website builder). */
function useNavMode(): "auto" | "rail" {
  const matches = useMatches();
  const rail = matches.some((m) => (m.handle as { studioNav?: string } | undefined)?.studioNav === "rail");
  return rail ? "rail" : "auto";
}

function Frame({ repo, session }: { repo: StudioRepo; session: Session }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = useNavMode();
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

  return (
    <ShellContext.Provider value={api}>
      <Shell email={session.email} projectCount={projects.data?.length} nav={nav} onSignOut={signOut}>
        <Inert when={expired}>
          <Outlet />
        </Inert>
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
      </Shell>
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
