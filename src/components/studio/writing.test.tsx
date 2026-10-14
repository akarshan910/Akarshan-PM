// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { newPost } from "~/lib/defaults";
import { MEMORY_OWNER } from "~/lib/studio/memory";
import type { MemoryRepo } from "~/lib/studio/memory";
import { must, testRepo } from "~/lib/studio/test-helpers";
import {
  citableFacts,
  followsTitle,
  fromLocalInput,
  resumeIdeas,
  scheduleLabel,
  toLocalInput,
} from "~/lib/studio/writing";
import StudioPost from "~/routes/studio/post";
import StudioWriting from "~/routes/studio/writing";
import { StudioDataProvider } from "./data";
import { fill } from "./test-editor";
import { ShellContext } from "./shell/ShellContext";
import { ToastProvider } from "./Toast";

function renderAt(repo: MemoryRepo, path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce: vi.fn() }}
          >
            <Routes>
              <Route path="/studio/writing" element={<StudioWriting />} />
              <Route path="/studio/writing/:id" element={<StudioPost />} />
            </Routes>
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
}

describe("writing model", () => {
  it("offers résumé highlights as ideas, finds citable facts, follows the title and words the schedule", async () => {
    const { repo } = testRepo();
    const profile = (await repo.profile.get()).draft;
    const ideas = resumeIdeas(profile, []);
    expect(ideas.length).toBeGreaterThan(5);
    expect(ideas[0]?.from).toBe("SugarFit");
    expect(resumeIdeas(profile, [must(ideas[0]).title])).toHaveLength(ideas.length - 1);
    expect(citableFacts(profile)).toEqual([]);
    const typed = {
      ...profile,
      proof: profile.proof.map((p) => (p.id === "p-tenure" ? { ...p, type: "output" as const } : p)),
    };
    expect(citableFacts(typed)).toEqual([
      {
        id: "p-tenure",
        text: "8yr Product Experience",
        value: "8yr",
        label: "Product Experience",
        type: "output",
      },
    ]);
    expect(followsTitle("untitled-3", "Anything")).toBe(true);
    expect(followsTitle("my-post", "My post")).toBe(true);
    expect(followsTitle("custom", "My post")).toBe(false);
    const at = new Date(2026, 9, 19, 9, 0).toISOString();
    expect(scheduleLabel(at)).toEqual({ short: "Mon 19 Oct", long: "Monday 19 October, 09:00" });
    expect(fromLocalInput(toLocalInput(at))).toBe(at);
    expect(fromLocalInput("nope")).toBeNull();
  });
});

describe("Writing", { timeout: 20_000 }, () => {
  it("shows the first-post state, then starts a draft from an idea", async () => {
    const user = userEvent.setup();
    const { repo } = testRepo();
    renderAt(repo, "/studio/writing");
    expect(await screen.findByText("Write your first post")).toBeInTheDocument();
    await user.click(must(screen.getAllByRole("button", { name: "Start a draft" })[0]));
    expect(await screen.findByRole("textbox", { name: "Title" })).toHaveValue(
      must((await repo.posts.list())[0]).draft.title,
    );
    expect(await repo.posts.list()).toHaveLength(1);
  });

  it("writes, schedules, unschedules and publishes a post", async () => {
    const user = userEvent.setup();
    const { repo } = testRepo();
    const row = await repo.posts.create(newPost(), "untitled-1");
    renderAt(repo, `/studio/writing/${row.id}`);
    const title = await screen.findByRole("textbox", { name: "Title" });
    await fill(user, title, "Hello world");
    await waitFor(
      async () => {
        expect((await repo.posts.get(row.id))?.slug).toBe("hello-world");
      },
      { timeout: 3000 },
    );
    await fill(user, screen.getByRole("textbox", { name: "Subtitle" }), "A dek");
    await user.click(screen.getByRole("button", { name: "Heading" }));
    await fill(user, screen.getByRole("textbox", { name: "Heading" }), "Part one");
    await user.click(screen.getByRole("button", { name: "Code" }));
    await fill(user, screen.getByRole("textbox", { name: "Code" }), "x = 1");
    await user.click(screen.getByRole("button", { name: "Embed" }));
    await fill(user, screen.getByRole("textbox", { name: "Embed link" }), "https://youtu.be/abc");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await fill(user, screen.getByRole("textbox", { name: "Excerpt" }), "Short.");
    await user.click(screen.getByRole("switch", { name: "Show on my homepage" }));
    expect(screen.getByText(/words · 1 min read/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Schedule" }));
    expect(screen.getByLabelText("Publish date and time")).toBeInTheDocument();
    await user.click(must(screen.getAllByRole("button", { name: "Schedule" })[0]));
    const dlg = await screen.findByRole("dialog", { name: /^Schedule for / });
    expect(within(dlg).getByText("Only on /writing and in RSS.")).toBeInTheDocument();
    await user.click(within(dlg).getByRole("button", { name: "Schedule" }));
    expect(await screen.findByText(/^Scheduled for /, { selector: "span" })).toBeInTheDocument();
    expect((await repo.posts.get(row.id))?.scheduledFor).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Unschedule" }));
    expect(
      await screen.findByText("Unscheduled. It’s back in Drafts.", { selector: "span" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish now" }));
    await user.click(must(screen.getAllByRole("button", { name: "Publish" })[0]));
    const pub = await screen.findByRole("dialog", { name: "Publish to /writing/hello-world?" });
    expect(within(pub).getByText("Title is set.")).toBeInTheDocument();
    expect(within(pub).getByText("Excerpt is set.")).toBeInTheDocument();
    await user.click(within(pub).getByRole("button", { name: "Publish now" }));
    expect(
      await screen.findByText("Published at /writing/hello-world and added to your RSS feed.", {
        selector: "span",
      }),
    ).toBeInTheDocument();
    const live = await repo.posts.get(row.id);
    expect(live?.published?.title).toBe("Hello world");
    expect(live?.draft.blocks.map((b) => b.type)).toEqual(["heading", "code", "embed"]);
    expect(screen.getAllByRole("button", { name: "Update post" }).length).toBeGreaterThan(0);
  });

  it("blocks publishing without a title", async () => {
    const user = userEvent.setup();
    const { repo } = testRepo();
    const row = await repo.posts.create(newPost(), "untitled-1");
    renderAt(repo, `/studio/writing/${row.id}`);
    await user.click(await screen.findByRole("button", { name: "Publish" }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).getByText("Add a title.")).toBeInTheDocument();
    expect(within(dlg).getByRole("button", { name: "Fix to continue" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.click(within(dlg).getByRole("button", { name: "Keep writing" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("lists posts by tab and shows a schedule failure", async () => {
    const user = userEvent.setup();
    const { repo } = testRepo();
    const a = await repo.posts.create(
      { ...newPost(), title: "Live one", blocks: [{ id: "b", type: "text", body: "<p>x</p>" }] },
      "live-one",
    );
    await repo.publish({ action: "publish", kind: "post", id: a.id });
    const b = await repo.posts.create({ ...newPost(), title: "Later" }, "later");
    await repo.publish({
      action: "publish",
      kind: "post",
      id: b.id,
      scheduleFor: new Date(2026, 9, 19, 9).toISOString(),
    });
    const c = await repo.posts.create({ ...newPost(), title: "Broken" }, "broken");
    must(
      (repo as unknown as { postRows: Map<string, { scheduleError: string }> }).postRows.get(c.id),
    ).scheduleError = "The cover needs alt text.";
    renderAt(repo, "/studio/writing");
    expect(await screen.findByText("Broken")).toBeInTheDocument();
    expect(screen.getByText("Couldn’t publish: The cover needs alt text.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Scheduled 1" }));
    expect(screen.getByText("Scheduled · Mon 19 Oct")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Published 1" }));
    expect(screen.getByText("Live one")).toBeInTheDocument();
  });
});
