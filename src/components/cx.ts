/** Joins class names, dropping empty ones. CSS-module lookups can be undefined under strict indexing. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
