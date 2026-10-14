/**
 * Picks the `StudioRepo` for this build. Until the Supabase repo exists (M3), development uses
 * the in-memory repo seeded from the V0 content. A production build never includes it: the
 * dynamic import sits behind `import.meta.env.DEV`, so Vite drops it, and Studio shows its
 * error state rather than editing anything fake.
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
  throw new RepoUnavailable();
}
