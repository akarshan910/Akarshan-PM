// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { must } from "~/lib/studio/test-helpers";
import { OverviewTab } from "./editor/OverviewTab";
import { fill, renderEditor } from "./test-editor";

const live = (rows: { id: string; published: unknown }[]) => must(rows.find((r) => r.published)).id;
const draft = (rows: { id: string; published: unknown }[]) => must(rows.find((r) => !r.published)).id;

describe("Project editor · frame", { timeout: 20_000 }, () => {
  it("shows the breadcrumb, status, tabs and the publish button state", async () => {
    await renderEditor(live, "overview", <OverviewTab />);
    expect(screen.getByText("Projects · Strategy & prototypes · 01")).toBeInTheDocument();
    const tabs = screen.getByRole("navigation", { name: "Project sections" });
    expect(
      within(tabs)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Overview", "Visuals", "Story", "Outcomes", "URL & SEO"]);
    expect(within(tabs).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("button", { name: /Published/ })[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("autosaves an edit, dots the tab and offers to publish changes, then publishes", async () => {
    const user = userEvent.setup();
    const { repo, id, clock } = await renderEditor(live, "overview", <OverviewTab />);
    const title = screen.getByRole("textbox", { name: /^Title/ });
    clock.now += 60_000;
    await user.clear(title);
    await fill(user, title, "A new title");
    await waitFor(
      () => {
        expect(screen.getAllByText("Saved just now").length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    expect((await repo.projects.get(id))?.draft.overview.title).toBe("A new title");
    expect(screen.getByRole("link", { name: "Overview, has unpublished edits" })).toBeInTheDocument();
    expect(screen.getAllByText("Edits not live").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: /Publish changes/ })[0] as HTMLElement);
    const dialog = await screen.findByRole("dialog", { name: "Update the live page for “A new title”?" });
    expect(within(dialog).getByText("Overview · title")).toBeInTheDocument();
    expect(
      within(dialog).getByText("My role is empty, so that chapter stays hidden. You can publish anyway."),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Publish now" }));
    expect(
      await screen.findByText("Published. The live page updates within a minute.", { selector: "span" }),
    ).toBeInTheDocument();
    expect((await repo.projects.get(id))?.published?.overview.title).toBe("A new title");
  });

  it("keeps the redirect a first publish turns on when an edit lands while it publishes", async () => {
    const user = userEvent.setup();
    const { repo, id, clock } = await renderEditor(live, "overview", <OverviewTab />);
    clock.now += 60_000;
    const before = must(await repo.projects.get(id));
    expect(before.draft.settings.redirectOldSlug).toBe(false);
    // Stand in for pm-publish's first publish: it writes the redirect into the draft (D40).
    const original = repo.publish.bind(repo);
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    repo.publish = async (req) => {
      await gate;
      const r = await original(req);
      const row = must(await repo.projects.get(id));
      const saved = await repo.projects.save(
        id,
        { ...row.draft, settings: { ...row.draft.settings, redirectOldSlug: true } },
        row.version,
      );
      return r.ok && saved.ok ? { ...r, version: saved.row.version } : r;
    };
    const title = screen.getByRole("textbox", { name: /^Title/ });
    await fill(user, title, " edited");
    await waitFor(
      () => {
        expect(screen.getAllByText("Saved just now").length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await user.click(screen.getAllByRole("button", { name: /Publish changes/ })[0] as HTMLElement);
    const dialog = await screen.findByRole("dialog", { name: /^Update the live page/ });
    await user.click(within(dialog).getByRole("button", { name: "Publish now" }));
    // An edit while pm-publish runs (the dialog covers the form, so not by pointer): reset keeps
    // it, so it must carry the redirect too.
    fireEvent.change(title, { target: { value: `${(title as HTMLInputElement).value} again` } });
    await act(async () => {
      release();
      await gate;
    });
    await waitFor(
      async () => {
        const now = must(await repo.projects.get(id));
        expect(now.draft.overview.title).toMatch(/ again$/);
        expect(now.draft.settings.redirectOldSlug).toBe(true);
      },
      { timeout: 4000 },
    );
    expect(screen.queryByRole("dialog", { name: /changed somewhere else/i })).not.toBeInTheDocument();
    // And the next edit saves on the new version, without a conflict.
    await fill(user, title, " once more");
    await waitFor(
      async () => {
        const now = must(await repo.projects.get(id));
        expect(now.draft.overview.title).toMatch(/ once more$/);
        expect(now.draft.settings.redirectOldSlug).toBe(true);
      },
      { timeout: 4000 },
    );
  });

  it("scrolls a focused tab into view in the sideways tab strip (320px and narrower)", async () => {
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy;
    try {
      await renderEditor(live, "overview", <OverviewTab />);
      const tabs = screen.getByRole("navigation", { name: "Project sections" });
      act(() => {
        within(tabs).getByRole("link", { name: "URL & SEO" }).focus();
      });
      expect(spy).toHaveBeenCalledWith({ inline: "nearest", block: "nearest" });
      expect(spy.mock.contexts.at(-1)).toBe(within(tabs).getByRole("link", { name: "URL & SEO" }));
    } finally {
      delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    }
  });

  it("blocks publishing with each problem linked to its tab", async () => {
    const user = userEvent.setup();
    await renderEditor(draft, "overview", <OverviewTab />);
    await user.click(screen.getAllByRole("button", { name: /^Publish$/ })[0] as HTMLElement);
    const dialog = await screen.findByRole("dialog", { name: /^Publish “/ });
    expect(within(dialog).getByText("Summary is required.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Fix \d to publish/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Add a summary. The card and search results need it.")).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole("button", { name: "Overview →" })[0] as HTMLElement);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens the checklist from ?publish=1 and shows offline and failed saves", async () => {
    const { repo } = await renderEditor(live, "overview", <OverviewTab />, "?publish=1");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    repo.offline = true;
    await userEvent.type(screen.getByRole("textbox", { name: /^Title/ }), "!");
    expect(await screen.findByText("You’re offline.", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Reconnect to publish/ })[0]).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    repo.offline = false;
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => {
      expect(screen.queryByText("You’re offline.")).not.toBeInTheDocument();
    });
    repo.failNextSave = true;
    await userEvent.type(screen.getByRole("textbox", { name: /^Title/ }), "?");
    expect(
      await screen.findByText("Your last change didn’t save.", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry now" }));
    await waitFor(() => {
      expect(screen.queryByText("Your last change didn’t save.")).not.toBeInTheDocument();
    });
  });
});

describe("Overview tab", { timeout: 20_000 }, () => {
  it("warns at the limits", async () => {
    const user = userEvent.setup();
    await renderEditor(live, "overview", <OverviewTab />);
    const summary = screen.getByRole("textbox", { name: /One-line summary/ });
    await user.clear(summary);
    await fill(user, summary, "x".repeat(141));
    expect(screen.getByText("Trim to 140 characters so it fits on the card.")).toBeInTheDocument();
    await fill(user, screen.getByRole("textbox", { name: "PRD or document" }), "ftp://x");
    expect(screen.getByText("Use a full link that starts with https://")).toBeInTheDocument();
  });

  it("edits every field and saves it", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "overview", <OverviewTab />);
    await fill(user, screen.getByRole("textbox", { name: "Card label" }), "Consumer");
    await fill(user, screen.getByRole("textbox", { name: "The problem" }), "Broken");
    await user.type(screen.getByRole("textbox", { name: /My role/ }), "PM");
    expect(screen.getByText("Shown under the title and in “My role and decisions”.")).toBeInTheDocument();
    expect(screen.getByText("2 of 3 empty")).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("group", { name: "Homepage shelf" })).getByRole("button", { name: "Shipped" }),
    );
    await user.click(
      within(screen.getByRole("group", { name: "Kind of work" })).getByRole("button", { name: "Prototype" }),
    );
    await waitFor(
      async () => {
        const row = await repo.projects.get(id);
        expect(row?.draft.overview).toMatchObject({
          cardLabel: "Consumer",
          problem: "Broken",
          role: "PM",
          kind: "prototype",
        });
      },
      { timeout: 3000 },
    );
    await waitFor(
      async () => {
        const layout = await repo.layout.get();
        expect(layout.draft.sections.find((s) => s.id === "shipped")?.items.some((i) => i.id === id)).toBe(
          true,
        );
      },
      { timeout: 3000 },
    );
    await user.clear(screen.getByRole("textbox", { name: "Card label" }));
    await waitFor(
      async () => {
        expect((await repo.projects.get(id))?.draft.overview.cardLabel).toBeUndefined();
      },
      { timeout: 3000 },
    );
  });

  it("focuses the field named in ?field=", async () => {
    await renderEditor(draft, "overview", <OverviewTab />, "?field=summary");
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /One-line summary/ })).toHaveFocus();
    });
  });
});
