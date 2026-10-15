/**
 * Responses, CORS and caller checks shared by every `pm-` function (06 · Edge Functions,
 * 10 · Security gates › Edge Functions):
 *
 * - CORS allows only `PM_ALLOWED_ORIGINS`. A browser request from any other origin gets no CORS
 *   headers, so the browser blocks it; a preflight from one gets 403.
 * - Owner calls carry `Authorization: Bearer <jwt>`; the user must be in `pm.owners`. Otherwise
 *   401 or 403, with no detail.
 * - Cron calls carry the service-role key as their bearer token.
 * - Every response is `no-store`. Errors never include stack traces or database messages, and
 *   nothing logs request bodies, tokens or email addresses.
 */
import type { Deps } from "./deps.ts";

export const MAX_BODY_BYTES = 256 * 1024;

export function corsHeaders(req: Request, deps: Deps): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin || !deps.env.allowedOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function json(
  req: Request,
  deps: Deps,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      ...(status === 204 ? {} : { "Content-Type": "application/json; charset=utf-8" }),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(req, deps),
      ...headers,
    },
  });
}

/** The preflight answer, or null when `req` isn't a preflight. */
export function preflight(req: Request, deps: Deps): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = corsHeaders(req, deps);
  if (!headers["Access-Control-Allow-Origin"]) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export function bearer(req: Request): string | null {
  const value = req.headers.get("authorization") ?? "";
  const m = /^Bearer ([A-Za-z0-9._~+/=-]+)$/.exec(value);
  return m?.[1] ?? null;
}

/** Constant-time string comparison, for the service-role key. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** The owner's user id, or an HttpError: 401 without a valid session, 403 when it isn't the owner. */
export async function requireOwner(req: Request, deps: Deps): Promise<string> {
  const token = bearer(req);
  if (!token) throw new HttpError(401, "unauthorized");
  const userId = await deps.auth.userId(token).catch(() => null);
  if (!userId) throw new HttpError(401, "unauthorized");
  const rows = await deps.sql.query<{ ok: boolean }>(
    "select exists (select 1 from pm.owners where user_id = $1) as ok",
    [userId],
  );
  if (!rows[0]?.ok) throw new HttpError(403, "forbidden");
  return userId;
}

export function isService(req: Request, deps: Deps): boolean {
  const token = bearer(req);
  return token !== null && deps.env.serviceRoleKey !== "" && safeEqual(token, deps.env.serviceRoleKey);
}

export function requireService(req: Request, deps: Deps): void {
  if (!isService(req, deps)) throw new HttpError(401, "unauthorized");
}

/** Reads a JSON body, refusing anything that isn't JSON or is larger than `MAX_BODY_BYTES`. */
export async function readJson(req: Request): Promise<unknown> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "json-only");
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new HttpError(413, "too-large");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "bad-json");
  }
}

/**
 * Wraps a function's logic: preflight, then the handler, with every failure turned into a
 * plain JSON error. Unexpected errors are logged by name only and answered with 500.
 */
export function handle(
  name: string,
  fn: (req: Request, deps: Deps) => Promise<Response>,
): (req: Request, deps: Deps) => Promise<Response> {
  return async (req, deps) => {
    const pre = preflight(req, deps);
    if (pre) return pre;
    try {
      return await fn(req, deps);
    } catch (error) {
      if (error instanceof HttpError)
        return json(req, deps, error.status, { error: error.code, ...error.extra });
      console.error(`${name}: unexpected ${error instanceof Error ? error.name : "error"}`);
      deps.onUnexpected?.(error);
      return json(req, deps, 500, { error: "server" });
    }
  };
}
