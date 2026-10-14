/**
 * `useAutosave(doc)` (05 · Shell › Data layer, 06 · Autosave): every edit goes through it.
 *
 * - Saves 800ms after the last edit, with the version Studio last saw.
 * - A stale version is a conflict: the dialog offers "Keep mine" (save over the latest version)
 *   and "Load latest" (drop this tab's edits).
 * - Offline, the edit waits in the offline queue and Studio retries every few seconds and on
 *   `online`; a failed save retries too. Save status never hides.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { dropPending, putPending } from "~/lib/studio/offline";
import { markUnsynced } from "./unsynced";
import type { SaveResult } from "~/lib/studio/repo";
import type { SaveState } from "./SaveStatus";

export const AUTOSAVE_DELAY = 800;
export const RETRY_DELAY = 4000;

interface Versioned<D> {
  draft: D;
  version: number;
}

export interface Autosave<D, R> {
  draft: D;
  /** The row as last saved (or loaded). */
  row: R;
  update: (fn: (draft: D) => D) => void;
  state: SaveState;
  /** "Saved just now" once this session has saved, otherwise "All changes saved". */
  savedLabel: string;
  /** True while there are edits not yet saved. */
  dirty: boolean;
  retry: () => void;
  /** The newer row another tab saved, while the conflict dialog is open. */
  conflict: R | null;
  keepMine: () => void;
  loadLatest: () => void;
  /** Saves now, skipping the debounce (before publishing or leaving). */
  flush: () => Promise<boolean>;
  /** Replaces the local row (after a publish or a slug change elsewhere). */
  reset: (row: R) => void;
}

export function useAutosave<D, R extends Versioned<D>>(options: {
  /** The offline-queue key, such as "project:<id>". */
  key: string;
  row: R;
  save: (draft: D, version: number) => Promise<SaveResult<R>>;
  onSaved?: (row: R) => void;
  delay?: number;
}): Autosave<D, R> {
  const { key, delay = AUTOSAVE_DELAY } = options;
  const [row, setRow] = useState(options.row);
  const [draft, setDraft] = useState(options.row.draft);
  const [state, setState] = useState<SaveState>("saved");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState<R | null>(null);

  const latest = useRef({ draft, version: options.row.version, dirty: false, inFlight: false, again: false });
  const saveRef = useRef(options.save);
  const onSavedRef = useRef(options.onSaved);
  useEffect(() => {
    saveRef.current = options.save;
    onSavedRef.current = options.onSaved;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // `run` calls itself again (a newer edit, or a retry), so it reaches itself through a ref.
  const runRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));
  const run = useCallback(async (): Promise<boolean> => {
    const l = latest.current;
    if (!l.dirty) return true;
    if (l.inFlight) {
      l.again = true;
      return false;
    }
    l.inFlight = true;
    setState("saving");
    const sending = l.draft;
    let result: SaveResult<R>;
    try {
      result = await saveRef.current(sending, l.version);
    } catch (e) {
      result = { ok: false, reason: "error", message: e instanceof Error ? e.message : "" };
    }
    l.inFlight = false;
    if (result.ok) {
      l.version = result.row.version;
      if (l.draft === sending) l.dirty = false;
      setRow(result.row);
      setSaved(true);
      setDirty(l.dirty);
      setState(l.dirty ? "saving" : "saved");
      void dropPending(key);
      onSavedRef.current?.(result.row);
      if (l.dirty || l.again) {
        l.again = false;
        return runRef.current();
      }
      return true;
    }
    if (result.reason === "conflict") {
      setState("saved");
      setConflict(result.latest);
      return false;
    }
    await putPending({ key, draft: l.draft, version: l.version, at: Date.now() });
    setState(result.reason === "offline" ? "offline" : "failed");
    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => {
      void runRef.current();
    }, RETRY_DELAY);
    return false;
  }, [key]);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    const online = () => {
      void run();
    };
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("online", online);
      clearTimeout(timer.current);
      clearTimeout(retryTimer.current);
      // Leaving within the debounce still saves the last edit (or queues it offline).
      if (latest.current.dirty && !latest.current.inFlight) void run();
    };
  }, [run]);

  // The leave guard: what hasn't reached the database yet.
  useEffect(() => {
    markUnsynced(key, state === "offline" ? "offline" : dirty || state === "failed" ? "pending" : null);
  }, [key, dirty, state]);
  useEffect(
    () => () => {
      markUnsynced(key, null);
    },
    [key],
  );

  const update = useCallback(
    (fn: (d: D) => D) => {
      const next = fn(latest.current.draft);
      latest.current.draft = next;
      latest.current.dirty = true;
      setDraft(next);
      setDirty(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void run();
      }, delay);
    },
    [delay, run],
  );

  const retry = useCallback(() => {
    clearTimeout(retryTimer.current);
    void run();
  }, [run]);

  const keepMine = useCallback(() => {
    if (!conflict) return;
    latest.current.version = conflict.version;
    latest.current.dirty = true;
    setConflict(null);
    void run();
  }, [conflict, run]);

  const loadLatest = useCallback(() => {
    if (!conflict) return;
    latest.current = {
      draft: conflict.draft,
      version: conflict.version,
      dirty: false,
      inFlight: false,
      again: false,
    };
    setRow(conflict);
    setDraft(conflict.draft);
    setDirty(false);
    setConflict(null);
    void dropPending(key);
  }, [conflict, key]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    return run();
  }, [run]);

  const reset = useCallback((next: R) => {
    latest.current = {
      draft: next.draft,
      version: next.version,
      dirty: false,
      inFlight: false,
      again: false,
    };
    setRow(next);
    setDraft(next.draft);
    setDirty(false);
  }, []);

  return {
    draft,
    row,
    update,
    state,
    savedLabel: saved ? "Saved just now" : "All changes saved",
    dirty,
    retry,
    conflict,
    keepMine,
    loadLatest,
    flush,
    reset,
  };
}
