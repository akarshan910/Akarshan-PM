/**
 * What every `pm-` function needs from its runtime, as small ports (06 · Edge Functions). The Deno
 * runtime (`runtime.ts`) fills them with a Postgres connection, Supabase Auth and Storage; the tests
 * fill them with PGlite and in-memory fakes. No module here reads `Deno` directly.
 */

/** A SQL connection with service-role power (the functions' `SUPABASE_DB_URL`). */
export interface Sql {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs `fn` in one transaction; a throw rolls everything back. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}

export type Bucket = "pm-media-draft" | "pm-media-public";

export interface StoragePort {
  /** Object names under `prefix` (e.g. `<id>/r1/`) in a bucket; with `before`, only older objects. */
  list(bucket: Bucket, prefix: string, before?: Date): Promise<string[]>;
  /** Stores a file the functions made (a video poster) in the draft bucket. */
  upload(name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** Copies one object from the draft bucket into the public one, overwriting. */
  publish(name: string): Promise<void>;
  remove(bucket: Bucket, names: string[]): Promise<void>;
  /** A signed URL for a draft file, valid for `seconds`. */
  signedUrl(name: string, seconds: number): Promise<string>;
}

export interface AuthPort {
  /** The user id for an access token, or null when it isn't a valid session. */
  userId(jwt: string): Promise<string | null>;
}

export interface Env {
  /** `PM_SITE_URL`: the site's origin, for preview links (D53: https://akarshan-pm.vercel.app). */
  siteUrl: string;
  /** `PM_ALLOWED_ORIGINS`: the origins Studio and the site run on. */
  allowedOrigins: string[];
  /** `PM_DEPLOY_HOOK_URL`: the Vercel deploy hook. Never logged or returned. */
  deployHookUrl?: string | undefined;
  /** The service-role key, which cron sends as its bearer token. */
  serviceRoleKey: string;
}

export interface Deps {
  sql: Sql;
  storage: StoragePort;
  auth: AuthPort;
  env: Env;
  /** Outbound requests: the deploy hook and link checks. */
  fetch: typeof fetch;
  /** A and AAAA records for a host, for the link check's private-address guard. */
  resolveHost(host: string): Promise<string[]>;
  now(): Date;
  randomBytes(n: number): Uint8Array;
  /**
   * Local scripts only (the seeds): hears an unexpected error's message. The deployed functions leave
   * it unset and log the error's name alone, so no data reaches a log.
   */
  onUnexpected?: (error: unknown) => void;
}

export type Handler = (req: Request, deps: Deps) => Promise<Response>;
