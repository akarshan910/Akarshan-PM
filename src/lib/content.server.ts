/**
 * The only module the prerender loaders use for content (06 · Build-time data). It picks the
 * source from CONTENT_SOURCE. In production there is no fallback: a failed read fails the build.
 */
import { contentSourceName, type ContentSource, type PublicContent } from "./content-source";
import { localV0 } from "./sources/local-v0";

async function source(): Promise<ContentSource> {
  switch (contentSourceName(process.env)) {
    case "local-v0":
      return localV0;
    case "fixture:boards": {
      const { boardsFixture } = await import("../../tests/fixtures/board-content");
      return boardsFixture;
    }
    case "supabase": {
      // The build reads with the public URL and anon key, the same two values the browser gets.
      const url = process.env.VITE_SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key)
        throw new Error("CONTENT_SOURCE=supabase needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      const [{ publicReader }, { supabaseSource }] = await Promise.all([
        import("./supabase"),
        import("./sources/supabase"),
      ]);
      return supabaseSource(publicReader(url, key));
    }
  }
}

let cached: Promise<PublicContent> | undefined;

/** Loads once per build, so every prerendered page sees the same content. */
export function loadPublicContent(): Promise<PublicContent> {
  cached ??= source().then((s) => s.load());
  return cached;
}
