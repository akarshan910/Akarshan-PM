/** The editor tabs other than Overview. */
import type { EditorTabSlug } from "~/lib/studio/paths";

export function EditorTabs({ tab }: { tab: EditorTabSlug }) {
  return <div data-tab={tab} />;
}
