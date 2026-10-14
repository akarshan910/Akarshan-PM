// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SaveResult } from "~/lib/studio/repo";
import { allPending, putPending } from "~/lib/studio/offline";
import { useAutosave } from "./useAutosave";

interface Row {
  draft: { n: number };
  version: number;
}

function server() {
  const saved: Row[] = [];
  let gate: (() => void) | null = null;
  let mode: "ok" | "offline" | "hold" = "ok";
  const row: Row = { draft: { n: 0 }, version: 1 };
  const save = async (draft: { n: number }, version: number): Promise<SaveResult<Row>> => {
    if (mode === "hold")
      await new Promise<void>((r) => {
        gate = r;
      });
    if (mode === "offline") return { ok: false, reason: "offline" };
    if (version !== row.version) return { ok: false, reason: "conflict", latest: { ...row } };
    row.draft = draft;
    row.version++;
    saved.push({ ...row });
    return { ok: true, row: { ...row } };
  };
  return {
    row,
    saved,
    save,
    set: (m: typeof mode) => {
      mode = m;
    },
    release: () => {
      mode = "ok";
      gate?.();
    },
  };
}

let count = 0;
const setup = (s: ReturnType<typeof server>) => {
  const key = `t:${String(++count)}`;
  const row = { ...s.row };
  return renderHook(() => useAutosave<{ n: number }, Row>({ key, row, save: s.save, delay: 10_000 }));
};

describe("autosave flush and reset", () => {
  it("waits for a save in flight, and includes an edit typed meanwhile", async () => {
    const s = server();
    const { result } = setup(s);
    s.set("hold");
    act(() => {
      result.current.update(() => ({ n: 1 }));
    });
    let first!: Promise<boolean>;
    act(() => {
      first = result.current.flush();
    });
    // A second edit while the first save is still in flight.
    act(() => {
      result.current.update(() => ({ n: 2 }));
    });
    let second!: Promise<boolean>;
    act(() => {
      second = result.current.flush();
    });
    expect(second).toBe(first);
    await act(async () => {
      s.release();
      expect(await second).toBe(true);
    });
    expect(s.saved.map((r) => r.draft.n)).toEqual([1, 2]);
    expect(result.current.dirty).toBe(false);
  });

  it("says false when the save can't go through (offline), so publish stops", async () => {
    const s = server();
    const { result, unmount } = setup(s);
    s.set("offline");
    act(() => {
      result.current.update(() => ({ n: 5 }));
    });
    let ok = true;
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(false);
    expect(result.current.state).toBe("offline");
    expect(result.current.dirty).toBe(true);
    unmount();
  });

  it("keeps an edit typed after the flush when a newer row arrives", async () => {
    const s = server();
    const { result } = setup(s);
    act(() => {
      result.current.update(() => ({ n: 1 }));
    });
    await act(async () => {
      await result.current.flush();
    });
    // Publishing: an edit lands before the fresh row comes back.
    act(() => {
      result.current.update(() => ({ n: 9 }));
    });
    s.row.version += 1; // the publish bumped the row
    act(() => {
      result.current.reset({ draft: { n: 1 }, version: s.row.version });
    });
    expect(result.current.draft).toEqual({ n: 9 });
    await act(async () => {
      expect(await result.current.flush()).toBe(true);
    });
    expect(s.saved.at(-1)?.draft.n).toBe(9);
    // With nothing typed, reset takes the new row.
    act(() => {
      result.current.reset({ draft: { n: 42 }, version: s.row.version });
    });
    expect(result.current.draft).toEqual({ n: 42 });
  });

  it("brings back a queued edit: saves it on the same version, asks on an older one", async () => {
    const s = server();
    await putPending({ key: "q:same", draft: { n: 7 }, version: 1, at: 1 });
    renderHook(() =>
      useAutosave<{ n: number }, Row>({ key: "q:same", row: { draft: { n: 0 }, version: 1 }, save: s.save }),
    );
    await waitFor(() => {
      expect(s.saved.at(-1)?.draft.n).toBe(7);
    });

    const t = server();
    t.row.version = 5;
    await putPending({ key: "q:old", draft: { n: 8 }, version: 2, at: 1 });
    const { result } = renderHook(() =>
      useAutosave<{ n: number }, Row>({ key: "q:old", row: { draft: { n: 3 }, version: 5 }, save: t.save }),
    );
    await waitFor(() => {
      expect(result.current.conflict?.version).toBe(5);
    });
    expect(result.current.draft).toEqual({ n: 8 });
    await act(async () => {
      result.current.keepMine();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(t.saved.at(-1)?.draft.n).toBe(8);
    });
  });

  it("stops saving a document that's gone", async () => {
    const save = (): Promise<SaveResult<Row>> =>
      Promise.resolve({ ok: false, reason: "error", message: "Not found." });
    const { result } = renderHook(() =>
      useAutosave<{ n: number }, Row>({
        key: "gone",
        row: { draft: { n: 0 }, version: 1 },
        save,
        delay: 10_000,
      }),
    );
    act(() => {
      result.current.update(() => ({ n: 1 }));
    });
    await act(async () => {
      expect(await result.current.flush()).toBe(false);
    });
    expect(result.current.dirty).toBe(false);
    expect((await allPending()).some((p) => p.key === "gone")).toBe(false);
  });
});
