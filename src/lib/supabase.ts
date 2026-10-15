/**
 * The only module that imports supabase-js for the public site (10 · Code architecture). The build
 * reads as a visitor: the anon key, the `pm` schema, no session (06 · Build-time data).
 */
import { createClient } from "@supabase/supabase-js";

import type { PublicReader, ReadResult } from "./sources/supabase";

export function publicReader(url: string, anonKey: string): PublicReader {
  const client = createClient(url, anonKey, {
    db: { schema: "pm" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    async select(table: string, columns: string): Promise<ReadResult> {
      const { data, error } = await client.from(table).select(columns);
      return { data: data as unknown[] | null, error };
    },
    async redirects(): Promise<ReadResult> {
      // Untyped client: the rpc's result type is unknown until it's narrowed here.
      const result: { data: unknown; error: { message: string } | null } =
        await client.rpc("public_redirects");
      return { data: Array.isArray(result.data) ? (result.data as unknown[]) : null, error: result.error };
    },
  };
}
