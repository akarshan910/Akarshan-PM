/**
 * Picks the `StudioRepo` for this build. A production build talks to Supabase with the public
 * URL and anon key (the only values the browser gets, besides the Turnstile site key); without
 * them Studio shows its error state rather than editing anything fake. Development uses the
 * in-memory repo seeded from the V0 content, which a production build never includes: its
 * dynamic import sits behind `import.meta.env.DEV`, so Vite drops it.
 */
import type { StudioRepo } from "./repo";

let pending: Promise<StudioRepo> | undefined;

export class RepoUnavailable extends Error {
  constructor() {
    super("Studio isn’t connected to its database yet.");
  }
}

export function loadRepo(): Promise<StudioRepo> {
  pending ??= create();
  return pending;
}

async function create(): Promise<StudioRepo> {
  if (import.meta.env.DEV) {
    const [{ MemoryRepo }, legacy, { buildV0Documents }] = await Promise.all([
      import("./memory"),
      import("../../legacy/content"),
      import("../v0"),
    ]);
    // The in-memory session survives a reload in development, so editing doesn't mean signing in
    // again after every hot update. Its content doesn't: each reload starts from the V0 seed.
    const KEY = "studio.dev.session";
    let signedIn = false;
    try {
      signedIn = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage blocked */
    }
    const repo = new MemoryRepo(buildV0Documents(legacy), { latency: 250, signedIn });
    repo.auth.onChange((s) => {
      try {
        if (s) sessionStorage.setItem(KEY, "1");
        else sessionStorage.removeItem(KEY);
      } catch {
        /* storage blocked */
      }
    });
    // The dev toolbar and e2e tests reach the repo here, to go offline or end the session.
    (globalThis as { __studioRepo?: unknown }).__studioRepo = repo;
    return repo;
  }
  // Named one by one, so Vite inlines just these two public values (scripts/check-env.ts).
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) throw new RepoUnavailable();
  const { supabaseRepo } = await import("./supabase");
  return supabaseRepo(url, key);
}
