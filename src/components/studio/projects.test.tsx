// @vitest-environment jsdom
import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { MEMORY_OWNER } from "~/lib/studio/memory";
import type { DocRow, SaveResult } from "~/lib/studio/repo";
import { must, testRepo } from "~/lib/studio/test-helpers";
import { StudioDataProvider } from "./data";
import { ProjectsSkeleton } from "./projects/ProjectsList";
import { ProjectsScreen } from "./projects/ProjectsScreen";
import { ShellContext } from "./shell/ShellContext";
import { ToastProvider } from "./Toast";
import { useAutosave } from "./useAutosave";

async function renderScreen() {
  const { repo } = testRepo();
  const announce = vi.fn();
  const rows = await repo.projects.list();
  const layout = await repo.layout.get();
  render(
    <MemoryRouter>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <ProjectsScreen rows={rows} layout={layout} />
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  return { repo, announce };
}

const shelf = (name: string) => screen.getByRole("list", { name: `${name} projects, in homepage order` });

describe("Projects", () => {
  it("lists shelves in homepage order and reorders by keyboard, then publishes the layout", async () => {
    const user = userEvent.setup();
    const { repo, announce } = await renderScreen();
    const strategy = shelf("Strategy & prototypes");
    const items = within(strategy).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const third = must(items[2]);
    const title = within(third).getAllByRole("link")[0]?.textContent ?? "";
    const handle = within(third).getByRole("button", { name: /^Move / });
    handle.focus();
    await user.keyboard("{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith(
      expect.stringMatching(/, position 2 of 5 on Strategy & prototypes\.$/),
    );
    expect(within(shelf("Strategy & prototypes")).getAllByRole("listitem")[1]).toHaveTextContent(
      title.slice(0, 10),
    );
    expect(screen.getByText("Homepage layout changed, not live yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publish layout" }));
    const dialog = await screen.findByRole("dialog", { name: /Publish with \d+ unconfirmed\?/ });
    expect(within(dialog).getByRole("button", { name: "Keep editing" })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Publish" }));
    expect(await screen.findByText("Homepage layout is live.", { selector: "span" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Homepage layout changed, not live yet")).not.toBeInTheDocument();
    });
    const live = await repo.layout.get();
    expect(live.published).toEqual(live.draft);
  });

  it("stars a project to the top, and says when it's already the lead", async () => {
    const user = userEvent.setup();
    const { announce } = await renderScreen();
    const stars = within(shelf("Strategy & prototypes")).getAllByRole("button", { name: /^Lead card: / });
    expect(stars[0]).toHaveAttribute("aria-pressed", "true");
    await user.click(must(stars[0]));
    expect(announce).toHaveBeenLastCalledWith(
      expect.stringMatching(/is already the lead card\. Star another project to replace it\.$/),
    );
    await user.click(must(stars[3]));
    expect(announce).toHaveBeenLastCalledWith(
      expect.stringMatching(/moved to the top\. It is now the lead card on Strategy & prototypes\.$/),
    );
    expect(
      within(shelf("Strategy & prototypes")).getAllByRole("button", { name: /^Lead card: / })[0],
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("filters, pauses reordering, and shows no results", async () => {
    const user = userEvent.setup();
    const { announce } = await renderScreen();
    await user.click(screen.getByRole("button", { name: "Drafts 4" }));
    expect(screen.getByText("Reordering is paused while a filter or search is on.")).toBeInTheDocument();
    expect(
      within(shelf("Strategy & prototypes")).getByText("Nothing on this shelf matches."),
    ).toBeInTheDocument();
    const handle = within(shelf("Shipped")).getAllByRole("button", { name: /^Move / })[1];
    must(handle).focus();
    await user.keyboard("{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith("Reordering is paused while a filter or search is on.");
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "qqqq");
    expect(screen.getByRole("heading", { name: "No projects match “qqqq”" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
  });

  it("duplicates, unpublishes and deletes with Undo", async () => {
    const user = userEvent.setup();
    const { repo } = await renderScreen();
    const first = () => must(within(shelf("Strategy & prototypes")).getAllByRole("listitem")[0]);
    const text = first().textContent;
    const name = must(
      (await repo.projects.list()).find((r) => r.published && text.includes(r.draft.overview.title)),
    ).draft.overview.title;

    await user.click(within(first()).getByRole("button", { name: `Actions for ${name}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate as draft" }));
    expect(
      await screen.findByText(`Duplicated as a draft: Copy of ${name}.`, { selector: "span" }),
    ).toBeInTheDocument();
    expect(await screen.findByText(`Copy of ${name}`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByText("Copy removed.", { selector: "span" })).toBeInTheDocument();

    await user.click(within(first()).getByRole("button", { name: `Actions for ${name}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Unpublish" }));
    expect(
      await screen.findByText(`“${name}” is off the live site and back to draft.`, { selector: "span" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByText(`“${name}” is live again.`, { selector: "span" })).toBeInTheDocument();

    await user.click(within(first()).getByRole("button", { name: `Actions for ${name}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete…" }));
    const dialog = await screen.findByRole("dialog", { name: `Delete “${name}”?` });
    expect(dialog).toHaveTextContent("stops working");
    await user.click(within(dialog).getByRole("button", { name: "Delete project" }));
    expect(await screen.findByText(`Deleted “${name}”.`, { selector: "span" })).toBeInTheDocument();
    await waitFor(() => {
      expect(within(shelf("Strategy & prototypes")).getAllByRole("listitem")).toHaveLength(4);
    });
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByText(`Restored “${name}”.`, { selector: "span" })).toBeInTheDocument();
  });

  it("disables Publish for a draft with required fields missing, and offers Unpublish instead of delete", async () => {
    const user = userEvent.setup();
    await renderScreen();
    const draft = must(within(shelf("Shipped")).getAllByRole("listitem")[0]);
    await user.click(within(draft).getByRole("button", { name: /^Actions for / }));
    expect(await screen.findByRole("menuitem", { name: /Publish1 required field missing/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.keyboard("{Escape}");
    const live = must(within(shelf("Strategy & prototypes")).getAllByRole("listitem")[0]);
    await user.click(within(live).getByRole("button", { name: /^Actions for / }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete…" }));
    await user.click(await screen.findByRole("button", { name: "Unpublish instead" }));
    expect(
      await screen.findByText(/is off the live site and back to draft\./, { selector: "span" }),
    ).toBeInTheDocument();
  });

  it("switches phones to reorder mode with arrow buttons", async () => {
    const user = userEvent.setup();
    const { announce } = await renderScreen();
    const reorder = screen.getAllByRole("button", { name: "Reorder" })[1];
    await user.click(must(reorder));
    const strategy = shelf("Strategy & prototypes");
    expect(within(strategy).getAllByRole("button", { name: /up$/ })[0]).toBeDisabled();
    await user.click(must(within(strategy).getAllByRole("button", { name: /down$/ })[0]));
    expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/position 2 of 5/));
    await user.click(screen.getByRole("button", { name: "Done" }));
  });

  it("has a loading skeleton", () => {
    render(<ProjectsSkeleton />);
    expect(screen.getByLabelText("Loading projects")).toHaveAttribute("aria-busy", "true");
  });
});

describe("useAutosave", () => {
  type Row = DocRow<{ n: number }>;
  const row: Row = { draft: { n: 0 }, published: null, publishedAt: null, version: 1, updatedAt: "" };
  const wrap = ({ children }: { children: ReactNode }) => <>{children}</>;

  it("debounces saves, tracks versions, and resolves conflicts", async () => {
    vi.useFakeTimers();
    let version = 1;
    let mode: "ok" | "conflict" | "offline" | "throw" = "ok";
    const save = vi.fn(async (draft: { n: number }, v: number): Promise<SaveResult<Row>> => {
      await Promise.resolve();
      if (mode === "throw") throw new Error("boom");
      if (mode === "offline") return { ok: false, reason: "offline" };
      if (mode === "conflict" || v !== version)
        return { ok: false, reason: "conflict", latest: { ...row, draft: { n: 99 }, version: version + 5 } };
      version += 1;
      return { ok: true, row: { ...row, draft, version } };
    });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useAutosave({ key: "t", row, save, onSaved }), { wrapper: wrap });
    expect(result.current.state).toBe("saved");
    expect(result.current.savedLabel).toBe("All changes saved");
    act(() => {
      result.current.update((d) => ({ n: d.n + 1 }));
      result.current.update((d) => ({ n: d.n + 1 }));
    });
    expect(result.current.dirty).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith({ n: 2 }, 1);
    expect(result.current.state).toBe("saved");
    expect(result.current.savedLabel).toBe("Saved just now");
    expect(onSaved).toHaveBeenCalled();

    mode = "offline";
    act(() => {
      result.current.update((d) => ({ n: d.n + 1 }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(result.current.state).toBe("offline");
    mode = "ok";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(result.current.state).toBe("saved");

    mode = "throw";
    act(() => {
      result.current.update((d) => ({ n: d.n + 1 }));
    });
    await act(async () => {
      await result.current.flush();
    });
    expect(result.current.state).toBe("failed");
    mode = "conflict";
    await act(async () => {
      result.current.retry();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.conflict?.draft).toEqual({ n: 99 });
    mode = "ok";
    version = must(result.current.conflict).version;
    await act(async () => {
      result.current.keepMine();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.conflict).toBeNull();
    expect(result.current.state).toBe("saved");

    mode = "conflict";
    act(() => {
      result.current.update((d) => ({ n: d.n + 1 }));
    });
    await act(async () => {
      await result.current.flush();
    });
    act(() => {
      result.current.loadLatest();
    });
    expect(result.current.draft).toEqual({ n: 99 });
    expect(result.current.dirty).toBe(false);
    act(() => {
      result.current.reset({ ...row, draft: { n: 5 }, version: 50 });
    });
    expect(result.current.draft).toEqual({ n: 5 });
    vi.useRealTimers();
  });
});
