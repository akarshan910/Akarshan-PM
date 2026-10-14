/** Normalises the old App.tsx source so its text can be searched like rendered copy. */
const ENTITIES: Record<string, string> = {
  "&mdash;": "—",
  "&amp;": "&",
  "&rarr;": "→",
  "&diams;": "♦",
  "&ldquo;": "“",
  "&nbsp;": " ",
  "&#9650;": "▲",
  "&#8599;": "↗",
};

export function normaliseSource(src: string): string {
  let s = src
    .replace(/>\s*\n\s*/g, ">")
    .replace(/\s*\n\s*</g, "<")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\{" "\}/g, " ")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\(["'])/g, "$1");
  for (const [k, v] of Object.entries(ENTITIES)) s = s.split(k).join(v);
  return s.replace(/ {2,}/g, " ");
}

/** Every string leaf in a value, depth first. */
export function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) strings(v, out);
  return out;
}
