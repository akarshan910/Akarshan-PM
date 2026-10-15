import { describe, expect, it, vi } from "vitest";

import type { PublishResult, StudioRepo } from "~/lib/studio/repo";
import { testRepo } from "~/lib/studio/test-helpers";
import type { ToastOptions } from "./Toast";
import { deployToast } from "./deployToast";

describe("deployToast", () => {
  it("shows the message when the site rebuilt, and offers Try again when it didn't", async () => {
    const shown: ToastOptions[] = [];
    const toast = { show: (o: ToastOptions) => shown.push(o) };
    const { repo } = testRepo();
    deployToast(toast, repo, true, { message: "Published." });
    expect(shown).toEqual([{ message: "Published." }]);

    deployToast(toast, repo, false, { message: "Published." });
    expect(shown[1]?.message).toMatch(/didn’t rebuild yet/);
    const publish = vi.spyOn(repo, "publish");
    shown[1]?.action?.onAction();
    await vi.waitFor(() => {
      expect(shown[2]?.message).toBe("Rebuilding the site. It updates within a minute.");
    });
    expect(publish).toHaveBeenCalledWith({ action: "deploy", kind: "site" });

    // Still failing: says so, and offers it again.
    const failing = {
      publish: () => Promise.resolve<PublishResult>({ ok: true, publishedAt: "now", deployed: false }),
    } as unknown as StudioRepo;
    deployToast(toast, failing, false, { message: "Published." });
    shown[3]?.action?.onAction();
    await vi.waitFor(() => {
      expect(shown[4]?.tone).toBe("error");
    });
    expect(shown[4]?.action?.label).toBe("Try again");
    expect(await repo.publish({ action: "deploy", kind: "project", id: "x" })).toMatchObject({ ok: false });
  });
});
