/** The editor's tabs other than Overview, by slug. */
import type { EditorTabSlug } from "~/lib/studio/paths";
import { OutcomesTab } from "./OutcomesTab";
import { useEditor } from "./ProjectEditor";
import { SettingsTab } from "./SettingsTab";
import { StoryTab } from "./StoryTab";
import { VisualsTab } from "./VisualsTab";

export function EditorTabs({ tab }: { tab: EditorTabSlug }) {
  switch (tab) {
    case "visuals":
      return <VisualsTab />;
    case "story":
      return <StoryTab />;
    case "outcomes":
      return <OutcomesTab />;
    default:
      return <Settings />;
  }
}

function Settings() {
  return <SettingsTab ownerName={useEditor().ownerName} />;
}
