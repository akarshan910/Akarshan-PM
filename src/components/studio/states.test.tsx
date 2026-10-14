// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { createMemoryRouter, Link, Outlet, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { must, testRepo } from "~/lib/studio/test-helpers";
import type { ProjectRow } from "~/lib/studio/repo";
import type { Project } from "~/lib/types";
import { LeaveGuard } from "./states/LeaveGuard";
import { ScreenSkeleton } from "./states/ScreenSkeleton";
import { markUnsynced, unsyncedNow } from "./unsynced";
import { useAutosave } from "./useAutosave";

// jsdom's AbortSignal isn't the one Node's Request accepts; data-router navigations need one that is.
const NodeRequest = globalThis.Request;
class TestRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...rest } = init ?? {};
    super(input, rest);
  }
}

describe("leaving with unsynced changes", { timeout: 20_000 }, () => {
  afterEach(() => {
    markUnsynced("project:x", null);
    globalThis.Request = NodeRequest;
  });

  it("asks before leaving while offline, and the browser prompts while anything is unsynced", async () => {
    const user = userEvent.setup();
    globalThis.Request = TestRequest;
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <>
              <LeaveGuard />
              <Link to="/other">Other</Link>
              <Outlet />
            </>
          ),
          children: [
            { index: true, element: <p>Here</p> },
            { path: "other", element: <p>There</p> },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    act(() => {
      markUnsynced("project:x", "offline");
    });
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);

    await user.click(screen.getByRole("link", { name: "Other" }));
    const dialog = await screen.findByRole("dialog", { name: "Some changes haven’t synced yet" });
    expect(dialog).toHaveTextContent(
      "They’re saved on this device and will sync the next time you open Studio here.",
    );
    await user.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.getByText("Here")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Other" }));
    await user.click(await screen.findByRole("button", { name: "Leave anyway" }));
    expect(await screen.findByText("There")).toBeInTheDocument();

    act(() => {
      markUnsynced("project:x", "pending");
    });
    expect(unsyncedNow()).toEqual({ any: true, offline: false });
    act(() => {
      markUnsynced("project:x", null);
    });
    const quiet = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(quiet);
    expect(quiet.defaultPrevented).toBe(false);
  });

  it("saves an edit made just before leaving the page", async () => {
    const { repo } = testRepo();
    const row = must(await repo.projects.get("arcana-workspace"));
    function Editor({ initial }: { initial: ProjectRow }) {
      const a = useAutosave<Project, ProjectRow>({
        key: `project:${initial.id}`,
        row: initial,
        save: (d, v) => repo.projects.save(initial.id, d, v),
      });
      const { update } = a;
      useEffect(() => {
        update((d) => ({ ...d, overview: { ...d.overview, title: "Edited and left" } }));
      }, [update]);
      return <p>{a.draft.overview.title}</p>;
    }
    const { unmount } = render(<Editor initial={row} />);
    await screen.findByText("Edited and left");
    expect(unsyncedNow().any).toBe(true);
    unmount();
    expect(unsyncedNow().any).toBe(false);
    await waitFor(async () => {
      expect((await repo.projects.get(row.id))?.draft.overview.title).toBe("Edited and left");
    });
  });
});

describe("loading skeletons", () => {
  it("is busy, labelled, and shaped like the screen", () => {
    for (const variant of ["page", "editor", "builder", "preview"] as const) {
      const { unmount, container } = render(
        <ScreenSkeleton label={`Loading ${variant}`} variant={variant} />,
      );
      expect(screen.getByRole("main", { name: `Loading ${variant}` })).toHaveAttribute("aria-busy", "true");
      expect(container.querySelectorAll(".shim").length > 0 || variant === "preview").toBe(true);
      unmount();
    }
    render(<ScreenSkeleton label="Loading" />);
    expect(screen.getByRole("main", { name: "Loading" })).toBeInTheDocument();
  });
});
