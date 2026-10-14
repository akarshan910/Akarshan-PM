import { Link } from "react-router";

import "~/styles/studio.css";
import buttons from "~/components/studio/Button.module.css";
import type { Route } from "./+types/signed-out";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Signed out · Studio" }, { name: "robots", content: "noindex, nofollow" }];
}

/**
 * After "Sign out" or "Sign out on all devices" (StudioAuthFlow › Path 7): a calm confirmation.
 * It isn't the sign-in page's "signed out" state, which is for a session that ended mid-edit.
 */
export default function SignedOut() {
  return (
    <div
      className="st"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <main style={{ width: "100%", maxWidth: 440 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
          You’re signed out
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.55, color: "var(--tx2)" }}>
          Studio is closed on this device. Your published site isn’t affected.
        </p>
        <div
          style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center" }}
        >
          <Link to="/studio/login" className={buttons.btn2Dark}>
            Sign in again
          </Link>
          <a href="/" className={buttons.link}>
            Go to the portfolio
          </a>
        </div>
      </main>
    </div>
  );
}
