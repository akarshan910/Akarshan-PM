import { useNavigate, useSearchParams } from "react-router";

import "~/styles/studio.css";
import { StudioError } from "~/components/studio/states/StudioError";
import { Login } from "~/components/studio/login/Login";
import { loadRepo } from "~/lib/studio/client";
import { pageName, safeNext } from "~/lib/studio/paths";
import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Sign in · Studio" }, { name: "robots", content: "noindex, nofollow" }];
}

/** Studio is client-only: no server loader, and nothing here is prerendered. */
export async function clientLoader() {
  const repo = await loadRepo();
  return { auth: repo.auth };
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <StudioError error={error} />;
}

export function HydrateFallback() {
  return <div className="st" style={{ minHeight: "100vh" }} />;
}

export default function StudioLogin({ loaderData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const signedOut = params.get("reason") === "signed-out";
  return (
    <Login
      auth={loaderData.auth}
      next={next}
      nextName={next === "/studio" ? undefined : pageName(next)}
      signedOut={signedOut}
      sendNow={params.get("send") === "1"}
      onSignedIn={(to) => {
        // The shell says "Signed in. N changes synced." when queued edits sync on arrival.
        void navigate(to, { replace: true, state: { signedIn: true } });
      }}
    />
  );
}
