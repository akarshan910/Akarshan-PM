/**
 * pm-check-link's logic (06 · pm-check-link). Fetches a link from the function with no cookies,
 * a 10-second budget and at most 5 redirects, and classifies it.
 *
 * Because the function fetches addresses the owner pastes, every hop is checked first: `https:`
 * only, port 443, no credentials, and no host that is an IP literal, `localhost`, or a private or
 * internal name. Redirects are followed by hand so each new address is checked the same way. The
 * response body is never read beyond what the classification needs, and never returned.
 */
import { videoHost } from "./lib/links.ts";

export type LinkKind = "video" | "prototype" | "prd";
export type LinkStatus = "ok" | "login" | "no-frame" | "not-shared" | "gone" | "error";
export interface LinkResult {
  status: LinkStatus;
  detail?: string;
}

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const LOGIN_HOSTS = ["accounts.google.com", "vercel.com/login", "figma.com/login", "www.figma.com/login"];

/** Whether the function may fetch this address at all. */
export function isFetchable(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (url.port !== "" && url.port !== "443") return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "" || host === "localhost" || host.endsWith(".localhost")) return false;
  if (/^\[.*\]$/.test(host) || host.includes(":")) return false; // IPv6 literal
  if (/^[0-9.]+$/.test(host) || /^0x[0-9a-f]+$/i.test(host) || /^\d+$/.test(host)) return false; // IPv4, any form
  if (!host.includes(".")) return false; // single-label names resolve inside networks
  if (/\.(internal|local|lan|home|corp|intranet|test|invalid|example)$/.test(host)) return false;
  if (host === "metadata.google.internal" || host.endsWith(".supabase.internal")) return false;
  return true;
}

function isLoginUrl(url: URL): boolean {
  const hp = `${url.hostname.toLowerCase()}${url.pathname}`;
  return LOGIN_HOSTS.some((h) => hp === h || hp.startsWith(`${h}/`) || url.hostname.toLowerCase() === h);
}

/** Whether a page's headers forbid framing from `siteOrigin`. */
export function blocksFraming(headers: Headers, siteOrigin: string): boolean {
  const xfo = (headers.get("x-frame-options") ?? "").trim().toLowerCase();
  if (xfo === "deny" || xfo === "sameorigin") return true;
  const csp = headers.get("content-security-policy") ?? "";
  const directive = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith("frame-ancestors"));
  if (!directive) return false;
  const sources = directive.split(/\s+/).slice(1);
  if (sources.includes("*")) return false;
  const site = new URL(siteOrigin);
  return !sources.some((s) => {
    const src = s.replace(/^'|'$/g, "").toLowerCase();
    if (src === "https:") return true;
    if (src === site.origin || src === site.host) return true;
    const wild = /^(?:https:\/\/)?\*\.(.+)$/.exec(src)?.[1];
    return wild !== undefined && site.hostname.endsWith(`.${wild}`);
  });
}

/** The Drive address to check for "Anyone with the link": its /preview page. */
function drivePreview(url: URL): string | null {
  const id = /^\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1];
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

export async function checkLink(
  value: string,
  kind: LinkKind,
  options: { fetch: typeof fetch; siteOrigin: string },
): Promise<LinkResult> {
  if (!isFetchable(value)) return { status: "error", detail: "Use a public https:// link." };
  let url = new URL(value);
  if (kind === "video") {
    const host = videoHost(value);
    if (!host) return { status: "error", detail: "Use a YouTube, Vimeo, Loom or Google Drive link." };
    if (host === "drive") {
      const preview = drivePreview(url);
      if (!preview) return { status: "error", detail: "Use the link from Drive's Share button." };
      url = new URL(preview);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isFetchable(url.toString()))
        return { status: "error", detail: "Redirects to an address that can't be checked." };
      if (isLoginUrl(url)) {
        return url.hostname === "accounts.google.com" && kind === "video"
          ? { status: "not-shared", detail: "Set sharing to “Anyone with the link”." }
          : { status: "login", detail: "Asks visitors to sign in." };
      }
      const res = await options.fetch(url.toString(), {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        signal: controller.signal,
        headers: { "User-Agent": "pm-check-link (+portfolio link check)", Accept: "text/html,*/*" },
      });
      await res.body?.cancel();
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get("location");
        if (!next) return { status: "error", detail: `Redirect without a location (${res.status}).` };
        url = new URL(next, url);
        continue;
      }
      if (res.status === 401 || res.status === 403)
        return { status: "login", detail: "Asks visitors to sign in." };
      if (res.status === 404 || res.status === 410)
        return { status: "gone", detail: "The page isn't there any more." };
      if (res.status < 200 || res.status >= 300)
        return { status: "error", detail: `The host answered ${res.status}.` };
      if (kind === "prototype" && blocksFraming(res.headers, options.siteOrigin)) {
        return { status: "no-frame", detail: "Doesn't allow embedding; visitors get “Open prototype ↗”." };
      }
      return { status: "ok" };
    }
    return { status: "error", detail: "Too many redirects." };
  } catch {
    return { status: "error", detail: "Couldn't reach it in 10 seconds." };
  } finally {
    clearTimeout(timer);
  }
}

/** Every external link in a published document, with the kind of check it needs. */
export function publishedLinks(doc: unknown): { url: string; kind: LinkKind }[] {
  const out = new Map<string, LinkKind>();
  const walk = (v: unknown, parentType?: string) => {
    if (Array.isArray(v)) {
      v.forEach((x) => {
        walk(x, parentType);
      });
      return;
    }
    if (!v || typeof v !== "object") return;
    const obj = v as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type : parentType;
    for (const [k, x] of Object.entries(obj)) {
      if (typeof x === "string" && x.startsWith("https://")) {
        if (k === "prdUrl") out.set(x, "prd");
        else if (k === "url" && type === "prototype") out.set(x, "prototype");
        else if (k === "url" && type === "video") out.set(x, "video");
        else if (k === "url" && type === "embed") out.set(x, videoHost(x) ? "video" : "prototype");
      } else walk(x, type);
    }
  };
  walk(doc);
  return [...out].map(([url, kind]) => ({ url, kind }));
}
