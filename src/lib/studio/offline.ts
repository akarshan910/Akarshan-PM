/**
 * The offline queue (06 · Autosave): edits that couldn't reach the database wait in IndexedDB,
 * one entry per document, newest wins, and sync on reconnect with the same version check. A tiny
 * wrapper over IndexedDB, so Studio needs no extra dependency. Without IndexedDB (private modes,
 * tests) it keeps the queue in memory for the tab's lifetime.
 */

export interface Pending<D = unknown> {
  /** The document key: "project:<id>", "post:<id>", "profile", "layout". */
  key: string;
  draft: D;
  /** The version the edit was made on. */
  version: number;
  at: number;
}

const DB = "pm-studio";
const STORE = "pending";

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

const fallback = new Map<string, Pending>();

async function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      resolve(undefined);
    };
  });
}

export async function putPending(entry: Pending): Promise<void> {
  fallback.set(entry.key, entry);
  await run("readwrite", (s) => s.put(entry, entry.key));
}

export async function getPending<D>(key: string): Promise<Pending<D> | undefined> {
  const stored = await run<Pending<D> | undefined>(
    "readonly",
    (s) => s.get(key) as IDBRequest<Pending<D> | undefined>,
  );
  return stored ?? (fallback.get(key) as Pending<D> | undefined);
}

export async function dropPending(key: string): Promise<void> {
  fallback.delete(key);
  await run("readwrite", (s) => s.delete(key));
}

export async function allPending(): Promise<Pending[]> {
  const stored = await run<Pending[]>("readonly", (s) => s.getAll() as IDBRequest<Pending[]>);
  const map = new Map<string, Pending>();
  for (const p of stored ?? []) map.set(p.key, p);
  for (const p of fallback.values()) if (!map.has(p.key)) map.set(p.key, p);
  return [...map.values()];
}
