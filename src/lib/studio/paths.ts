/**
 * Studio's paths: the sign-in redirect's `next` rule (06 · Client code › Deep links) and the page
 * names the sign-in screen and dialogs use ("After you sign in, you'll go straight back to …").
 */

const NEXT = /^\/studio(\/[A-Za-z0-9\-_/]*)?$/;

/** `next` if it's a Studio path, otherwise the dashboard. Query strings and other hosts never pass. */
export function safeNext(next: string | null | undefined): string {
  return next && NEXT.test(next) ? next : "/studio";
}

export function loginPath(next: string, reason?: "signed-out"): string {
  const params = new URLSearchParams();
  if (next !== "/studio") params.set("next", next);
  if (reason) params.set("reason", reason);
  const q = params.toString();
  return `/studio/login${q ? `?${q}` : ""}`;
}

export const EDITOR_TABS = ["overview", "visuals", "story", "outcomes", "settings"] as const;
export type EditorTabSlug = (typeof EDITOR_TABS)[number];

export const TAB_LABELS: Record<EditorTabSlug, string> = {
  overview: "Overview",
  visuals: "Visuals",
  story: "Story",
  outcomes: "Outcomes",
  settings: "URL & SEO",
};

/**
 * A readable name for a Studio path. Project and post names need their titles, so the caller can
 * pass a lookup; without one they read "a project" and "a post".
 */
export function pageName(
  path: string,
  title?: (kind: "project" | "post", id: string) => string | undefined,
): string {
  const parts = path
    .replace(/^\/studio\/?/, "")
    .split("/")
    .filter(Boolean);
  const [first, second, third] = parts;
  switch (first) {
    case undefined:
      return "the dashboard";
    case "website":
      return second === "profile" ? "Profile & facts" : "Website";
    case "projects": {
      if (!second) return "Projects";
      const name = title?.("project", second) ?? "a project";
      const tab =
        third && (EDITOR_TABS as readonly string[]).includes(third)
          ? TAB_LABELS[third as EditorTabSlug]
          : undefined;
      return tab ? `${name} · ${tab}` : name;
    }
    case "writing":
      return second ? (title?.("post", second) ?? "a post") : "Writing";
    case "media":
      return "Media";
    case "preview":
      return "the draft preview";
    default:
      return "Studio";
  }
}

/** "Dashboard · Studio": each screen's document title names it (08 · Screen readers; WCAG 2.4.2). */
export function studioTitle(...parts: (string | undefined)[]): string {
  return [...parts.filter((p): p is string => Boolean(p)), "Studio"].join(" · ");
}

/** A route's `meta`: the leaf route's list replaces the shell's, so each one keeps `noindex`. */
export function studioMeta(...parts: (string | undefined)[]) {
  return [{ title: studioTitle(...parts) }, { name: "robots", content: "noindex, nofollow" }];
}
