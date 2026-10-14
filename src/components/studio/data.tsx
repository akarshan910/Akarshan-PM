/**
 * Studio's data layer (05 · Shell › Data layer): the repo in context, and a small query cache
 * keyed by table and id, so a save in one screen refreshes every view of the same row.
 * Keys are strings such as "projects", "project:<id>", "profile", "layout".
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { StudioRepo } from "~/lib/studio/repo";

interface Entry {
  data?: unknown;
  error?: unknown;
  promise?: Promise<unknown>;
  stale: boolean;
}

export class QueryCache {
  private readonly entries = new Map<string, Entry>();
  private readonly listeners = new Set<() => void>();
  private version = 0;

  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  snapshot = (): number => this.version;

  private emit(): void {
    this.version += 1;
    for (const l of this.listeners) l();
  }

  get(key: string): Entry | undefined {
    return this.entries.get(key);
  }

  fetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key) ?? { stale: true };
    if (entry.promise) return entry.promise as Promise<T>;
    const promise = fn().then(
      (data) => {
        this.entries.set(key, { data, stale: false });
        this.emit();
        return data;
      },
      (error: unknown) => {
        this.entries.set(key, { error, stale: false });
        this.emit();
        throw error;
      },
    );
    this.entries.set(key, { ...entry, promise });
    return promise;
  }

  /** Writes a row the caller already has (a save's result), so views update without a refetch. */
  set(key: string, data: unknown): void {
    this.entries.set(key, { data, stale: false });
    this.emit();
  }

  /** Marks every key starting with `prefix` stale; mounted queries refetch. */
  invalidate(prefix: string): void {
    for (const [k, e] of this.entries) if (k === prefix || k.startsWith(`${prefix}:`)) e.stale = true;
    this.emit();
  }

  clear(): void {
    this.entries.clear();
    this.emit();
  }
}

interface StudioData {
  repo: StudioRepo;
  cache: QueryCache;
}

const Ctx = createContext<StudioData | null>(null);

export function StudioDataProvider({
  repo,
  cache,
  children,
}: {
  repo: StudioRepo;
  cache?: QueryCache;
  children: ReactNode;
}) {
  const [own] = useState(() => cache ?? new QueryCache());
  const value = useMemo(() => ({ repo, cache: own }), [repo, own]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio(): StudioData {
  const v = useContext(Ctx);
  if (!v) throw new Error("Studio screens need a <StudioDataProvider> above them.");
  return v;
}

export function useRepo(): StudioRepo {
  return useStudio().repo;
}

export type QueryState<T> =
  | { status: "loading"; data?: undefined; error?: undefined; refetch: () => void }
  | { status: "error"; data?: undefined; error: unknown; refetch: () => void }
  | { status: "ready"; data: T; error?: undefined; refetch: () => void };

/** Reads `key` through the cache, fetching with `fn` when it's missing or stale. */
export function useQuery<T>(
  key: string,
  fn: (repo: StudioRepo) => Promise<T>,
  options: { fresh?: boolean } = {},
): QueryState<T> {
  const { repo, cache } = useStudio();
  const fresh = options.fresh ?? false;
  // A summary view (the dashboard) refetches every time it mounts, showing what it has meanwhile.
  useEffect(() => {
    if (fresh) cache.invalidate(key);
  }, [cache, key, fresh]);
  useSyncExternalStore(cache.subscribe, cache.snapshot, cache.snapshot);
  const entry = cache.get(key);
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const needs = !entry || (entry.stale && !entry.promise);
  useEffect(() => {
    if (needs) cache.fetch(key, () => fnRef.current(repo)).catch(() => undefined);
  }, [cache, key, needs, repo]);

  const refetch = useCallback(() => {
    cache.invalidate(key);
  }, [cache, key]);

  if (entry && "data" in entry && entry.data !== undefined)
    return { status: "ready", data: entry.data as T, refetch };
  if (entry?.error !== undefined && !entry.promise) return { status: "error", error: entry.error, refetch };
  return { status: "loading", refetch };
}
