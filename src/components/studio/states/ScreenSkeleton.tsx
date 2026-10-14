/**
 * Loading skeletons (StudioStates › Loading): the board's card of `.shim` lines, laid out like the
 * screen that's loading. The shimmer stops under reduced motion (studio.css). Announced as busy.
 */
import type { CSSProperties } from "react";

const card: CSSProperties = { padding: 18, display: "grid", gap: 12 };

function Card({ tall = 90 }: { tall?: number }) {
  return (
    <div className="card" style={card}>
      <div className="shim" style={{ height: 18, width: "60%" }} />
      <div className="shim" style={{ height: tall }} />
      <div className="shim" style={{ height: 14, width: "80%" }} />
      <div className="shim" style={{ height: 14, width: "45%" }} />
    </div>
  );
}

export function ScreenSkeleton({
  label,
  variant = "page",
}: {
  label: string;
  /** page: a title and cards; editor: a bar over a form and a side panel; builder: three columns; preview: the dark bar. */
  variant?: "page" | "editor" | "builder" | "preview";
}) {
  if (variant === "preview")
    return (
      <main aria-busy="true" aria-label={label} style={{ minHeight: "100vh", background: "#26262C" }}>
        <div style={{ height: 64, background: "#141416", borderBottom: "1px solid #2A2A31" }} />
      </main>
    );
  if (variant === "editor" || variant === "builder")
    return (
      <main aria-busy="true" aria-label={label} style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 68,
            background: "#fff",
            borderBottom: "1px solid var(--ln)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 24px",
          }}
        >
          <div className="shim" style={{ width: 180, height: 22 }} />
          <span style={{ flex: 1 }} />
          <div className="shim" style={{ width: 120, height: 36 }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "18px 20px" }}>
          {variant === "builder" ? (
            <div style={{ flex: "0 1 336px" }}>
              <Card tall={420} />
            </div>
          ) : null}
          <div style={{ flex: "999 1 480px", display: "grid", gap: 16 }}>
            <Card />
            <Card tall={160} />
          </div>
          <div style={{ flex: "1 1 300px", maxWidth: 380 }}>
            <Card tall={120} />
          </div>
        </div>
      </main>
    );
  return (
    <main
      aria-busy="true"
      aria-label={label}
      style={{ flex: 1, minWidth: 0, padding: "28px clamp(20px, 3vw, 40px) 64px" }}
    >
      <div className="shim" style={{ width: 120, height: 12 }} />
      <div className="shim" style={{ width: 220, height: 30, marginTop: 12 }} />
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <Card />
        <Card />
      </div>
    </main>
  );
}
