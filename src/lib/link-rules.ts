/**
 * The link rules (06 · Rich text, 03 · Media) as plain predicates with no zod, so public pages can
 * check a link without loading the schemas (01 · Performance budget). `schemas.ts` refines with
 * these and re-exports them.
 */
/** An absolute https URL with a host and no credentials, written exactly as https://… */
export function isHttpsUrl(value: string): boolean {
  if (!value.startsWith("https://")) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname !== "" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

/**
 * The link rule in 06 · Rich text: https:, mailto:, a site path starting with one "/", or an
 * in-page anchor such as "#strategy". Anything else (javascript:, data:, "//host") is rejected.
 */
export function isSafeLink(value: string): boolean {
  if (/[\s\\]/.test(value)) return false;
  return (
    /^#[A-Za-z0-9_-]+$/.test(value) ||
    /^\/(?!\/)/.test(value) ||
    /^mailto:[^@]+@[^@]+$/.test(value) ||
    isHttpsUrl(value)
  );
}

/** A path inside a prototype: relative, with no scheme and no host. */
export function isRelativePath(value: string): boolean {
  return !/[\s\\:]/.test(value) && !value.startsWith("//");
}
