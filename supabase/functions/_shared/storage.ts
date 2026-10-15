/**
 * Copying a draft file into pm-media-public, shared by the deployed functions (runtime.ts) and the
 * Node seeds (scripts/seed-v0-core.ts), so both behave the same. Storage refuses to copy onto an
 * existing object, and a republish copies the same files again, so an existing copy is replaced.
 */
interface StorageBucket {
  copy(from: string, to: string, options: { destinationBucket: string }): Promise<{ error: unknown }>;
  remove(paths: string[]): Promise<{ error: unknown }>;
}
export interface StorageAdmin {
  storage: { from(bucket: string): StorageBucket };
}

export async function copyToPublic(admin: StorageAdmin, name: string): Promise<void> {
  const draft = admin.storage.from("pm-media-draft");
  let { error } = await draft.copy(name, name, { destinationBucket: "pm-media-public" });
  if (error) {
    await admin.storage.from("pm-media-public").remove([name]);
    ({ error } = await draft.copy(name, name, { destinationBucket: "pm-media-public" }));
  }
  if (error) throw new Error("Couldn't copy a file to pm-media-public.");
}
