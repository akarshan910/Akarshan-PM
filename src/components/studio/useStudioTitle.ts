/** Sets the document title once a screen's data (a project or post title) is known. */
import { useEffect } from "react";

import { studioTitle } from "~/lib/studio/paths";

export function useStudioTitle(...parts: (string | undefined)[]) {
  const title = studioTitle(...parts);
  useEffect(() => {
    document.title = title;
  }, [title]);
}
