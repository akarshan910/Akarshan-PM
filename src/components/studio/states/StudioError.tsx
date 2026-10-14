/**
 * The error page for a Studio route that couldn't start: the repo isn't connected yet (a build
 * without the database), or the session check failed. It stays inside Studio's look, never the
 * public error page.
 */
import "~/styles/studio.css";
import { RepoUnavailable } from "~/lib/studio/client";
import { LoadError } from "./LoadError";

export function StudioError({ error }: { error: unknown }) {
  const unavailable = error instanceof RepoUnavailable;
  return (
    <div className="st" style={{ minHeight: "100vh", padding: "48px clamp(20px, 4vw, 56px)" }}>
      <main style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>Studio</h1>
        <LoadError
          title={unavailable ? "Studio isn’t connected yet" : "Studio couldn’t start"}
          text={
            unavailable
              ? "This build has no database connection, so there’s nothing to edit yet. Your published site isn’t affected."
              : undefined
          }
          onRetry={() => {
            window.location.reload();
          }}
        />
      </main>
    </div>
  );
}
