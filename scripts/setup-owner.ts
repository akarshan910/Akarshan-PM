/**
 * `npm run setup:owner` (06 · The owner), once. Makes the Studio owner: finds the auth user with
 * OWNER_EMAIL, or creates it (confirmed, no password), and adds its id to `pm.owners`.
 *
 * - Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OWNER_EMAIL from the shell only; it never reads
 *   a .env file. The address never appears in code, migrations, seeds or tests (CLAUDE.md › Security).
 * - If the address already belongs to a lumina admin, it reuses that user: being a lumina admin grants
 *   nothing here, and being the Studio owner grants nothing on lumina.
 * - Prints "Owner ready", the user id and the address masked. Never the key.
 * - Needs the `pm` schema exposed in the Data API (supabase/README.md, step 1).
 *
 *   OWNER_EMAIL=… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run setup:owner
 */
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

/** `o•••r@example.test`: the first and last character of the local part. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (local.length <= 2) return `${local.slice(0, 1)}•@${domain}`;
  return `${local.slice(0, 1)}${"•".repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
}

export function normaliseEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = normaliseEmail(process.env.OWNER_EMAIL ?? "");
  if (!url || !key || !email) {
    console.error(
      "Set OWNER_EMAIL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell for this command only.",
    );
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Couldn't list the project's users.");
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (data.users.length < 1000) break;
  }
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) throw new Error("Couldn't create the owner's user.");
    userId = data.user.id;
  }

  const { error } = await admin
    .schema("pm")
    .from("owners")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (error) throw new Error("Couldn't write pm.owners. Is the pm schema exposed in the Data API?");
  console.log(`Owner ready: ${userId} (${maskEmail(email)})`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "setup:owner failed.");
    process.exit(1);
  });
}
