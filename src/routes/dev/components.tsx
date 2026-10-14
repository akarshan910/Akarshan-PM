import "~/styles/studio.css";

import type { Route } from "./+types/components";
import MediaSpecimens from "./catalogue/media";
import PublicASpecimens from "./catalogue/publicA";
import PublicBSpecimens from "./catalogue/publicB";
import StudioSpecimens from "./catalogue/studio";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Components · dev" }, { name: "robots", content: "noindex, nofollow" }];
}

export function clientLoader(_: Route.ClientLoaderArgs) {
  return null;
}

/** /dev/components: every component in every state, for comparison with its board (M1). */
export default function Catalogue() {
  return (
    <main className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <h1 style={{ font: "800 40px/1 var(--fd)", fontStretch: "68%", textTransform: "uppercase" }}>
        Components
      </h1>
      <p className="mono">Development only. Compare each specimen with the board named beside it.</p>
      <PublicASpecimens />
      <PublicBSpecimens />
      <MediaSpecimens />
      <StudioSpecimens />
    </main>
  );
}
