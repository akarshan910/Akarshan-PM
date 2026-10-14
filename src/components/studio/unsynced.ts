/**
 * Which documents have edits that haven't reached the database (StudioStates › Leaving with
 * unsynced changes): every autosave reports here, and the shell's leave guard reads it.
 */
import { useSyncExternalStore } from "react";

export type Unsynced = "pending" | "offline";

const entries = new Map<string, Unsynced>();
const listeners = new Set<() => void>();
let snapshot: { any: boolean; offline: boolean } = { any: false, offline: false };

function emit() {
  const values = [...entries.values()];
  snapshot = { any: values.length > 0, offline: values.includes("offline") };
  for (const l of listeners) l();
}

export function markUnsynced(key: string, state: Unsynced | null) {
  if ((entries.get(key) ?? null) === state) return;
  if (state) entries.set(key, state);
  else entries.delete(key);
  emit();
}

export function unsyncedNow() {
  return snapshot;
}

export function useUnsynced() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    unsyncedNow,
    unsyncedNow,
  );
}
