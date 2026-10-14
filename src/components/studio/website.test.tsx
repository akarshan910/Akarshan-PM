// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { MEMORY_OWNER } from "~/lib/studio/memory";
import { must, testRepo } from "~/lib/studio/test-helpers";
import { previewContent } from "~/lib/studio/website";
import StudioWebsite from "~/routes/studio/website";
import { StudioDataProvider } from "./data";
import { SitePreview } from "./preview/SitePreview";
import { ShellContext } from "./shell/ShellContext";
import { fill } from "./test-editor";
import { ToastProvider } from "./Toast";

async function renderBuilder() {
  const { repo } = testRepo();
  const announce = vi.fn();
  render(
    <MemoryRouter>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <StudioWebsite />
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { level: 1, name: "Website" });
  const outline = screen.getByRole("region", { name: "Homepage" });
  return { repo, announce, outline };
}
const inspector = () => screen.getByLabelText("Edit selection");

// jsdom has no FontFaceSet; the hero waits for fonts before measuring.
Object.defineProperty(document, "fonts", { value: { ready: Promise.resolve() }, configurable: true });

describe("Website builder", { timeout: 20_000 }, () => {
  it("switches sections on and off, reorders them, and lists the changes", async () => {
    const user = userEvent.setup();
    const { repo, announce, outline } = await renderBuilder();
    expect(within(outline).getByText("11 of 12 sections on")).toBeInTheDocument();
    expect(within(outline).getByText("5 links")).toBeInTheDocument();
    expect(within(outline).getByText("Nothing live yet")).toBeInTheDocument();
    expect(within(outline).getByText("No posts yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish website" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Publish website" }));
    expect(announce).toHaveBeenLastCalledWith("Nothing to publish. The homepage is up to date.");

    await user.click(within(outline).getByRole("switch", { name: "Show Hero on the site" }));
    expect(announce).toHaveBeenLastCalledWith("The hero always shows. Hide its parts instead.");
    await user.click(within(outline).getByRole("switch", { name: "Show Off duty on the site" }));
    expect(announce).toHaveBeenLastCalledWith("Off duty hidden.");
    expect(screen.getByText("1 change not live")).toBeInTheDocument();

    const handle = within(outline).getByRole("button", { name: "Move section Testimonials" });
    handle.focus();
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith("Testimonials is now section 6.");
    expect(handle).toHaveFocus();
    // The hero and footer stay pinned.
    const proof = within(outline).getByRole("button", { name: "Move section Proof strip" });
    proof.focus();
    await user.keyboard("{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith("Testimonials is now section 6.");

    await user.click(screen.getByRole("button", { name: "Publish website" }));
    const dialog = await screen.findByRole("dialog", { name: "Update the live homepage?" });
    expect(within(dialog).getByText("2 changes")).toBeInTheDocument();
    expect(within(dialog).getByText("Moved Testimonials above About")).toBeInTheDocument();
    expect(within(dialog).getByText("Hid Off duty")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Publish now" }));
    const confirm = await screen.findByRole("dialog", { name: /Publish with \d+ unconfirmed\?/ });
    await user.click(within(confirm).getByRole("button", { name: "Publish" }));
    expect(
      await screen.findByText("Homepage published. It updates within a minute.", { selector: "span" }),
    ).toBeInTheDocument();
    const live = must((await repo.layout.get()).published);
    expect(live.sections.find((s) => s.id === "offduty")?.visible).toBe(false);
    expect(screen.queryByText(/not live/)).not.toBeInTheDocument();
  });

  it("edits the nav, the shelf and its projects, and discards", async () => {
    const user = userEvent.setup();
    const { announce, outline } = await renderBuilder();
    await user.click(within(outline).getByRole("button", { name: /^Navigation/ }));
    expect(within(inspector()).getByText("Always on, always first.")).toBeInTheDocument();
    expect(within(inspector()).getByText("Let’s Talk →")).toBeInTheDocument();

    await user.click(within(outline).getByRole("button", { name: /^Experience/ }));
    const nav = within(inspector()).getByRole("textbox", { name: "Nav label" });
    await user.clear(nav);
    await user.type(nav, "Experience");
    await user.click(within(inspector()).getByRole("button", { name: "Move up" }));
    expect(announce).toHaveBeenLastCalledWith("Experience is now section 6.");
    await user.click(within(outline).getByRole("button", { name: /^Off duty/ }));
    await user.click(within(inspector()).getByRole("switch", { name: "Link it in the nav" }));
    expect(within(outline).getByText("Nav · Off duty")).toBeInTheDocument();

    await user.click(within(outline).getByRole("button", { name: /^Strategy & prototypes/ }));
    const name = within(inspector()).getByRole("textbox", { name: "Shelf name" });
    await user.clear(name);
    await user.type(name, "Strategy");
    await user.click(within(inspector()).getByRole("button", { name: "1" }));
    await fill(user, within(inspector()).getByRole("textbox", { name: "Shelf title" }), " now");
    await user.click(within(outline).getByRole("button", { name: /^Arcana Workspace/ }));
    expect(
      within(inspector()).getByText("Drag it to the top of the shelf to make it the lead card."),
    ).toBeInTheDocument();
    await user.click(within(inspector()).getByRole("button", { name: "Move to Shipped" }));
    expect(announce).toHaveBeenLastCalledWith("Arcana Workspace moved to Shipped.");

    // Drafts can't be switched on.
    // Moving it opened Shipped in the outline.
    await user.click(within(outline).getByRole("switch", { name: "Show 3D body scan for GLP-1 users" }));
    expect(announce).toHaveBeenLastCalledWith("Drafts stay off the site until you publish them.");
    await user.click(within(outline).getByRole("button", { name: /^3D body scan/ }));
    expect(
      within(inspector()).getByText("It takes this spot as soon as you publish it."),
    ).toBeInTheDocument();
    await user.click(within(inspector()).getByRole("button", { name: "Back to Shipped" }));

    await user.click(screen.getByRole("button", { name: "Publish website" }));
    const dialog = await screen.findByRole("dialog", { name: "Update the live homepage?" });
    for (const t of [
      "Navigation: renamed Exp to Experience",
      "Navigation: added Off duty",
      "Strategy: 1 row on the homepage",
      "Renamed Strategy & prototypes to Strategy",
      "Edited Strategy title",
      "Moved Arcana Workspace to Shipped",
    ])
      expect(within(dialog).getByText(t)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Discard" }));
    const discard = await screen.findByRole("dialog", { name: "Discard your new order?" });
    await user.click(within(discard).getByRole("button", { name: "Discard" }));
    expect(announce).toHaveBeenLastCalledWith("Changes discarded.");
    expect(screen.queryByText(/not live/)).not.toBeInTheDocument();
  });

  it("edits the hero, floating previews, writing, contact and footer", async () => {
    const user = userEvent.setup();
    const { repo, announce, outline } = await renderBuilder();
    const av = within(inspector()).getByRole("textbox", { name: "Availability chip" });
    await user.clear(av);
    await fill(user, av, "Open to PM roles");
    await user.click(within(outline).getByRole("button", { name: "Floating previews" }));
    await user.click(within(inspector()).getByRole("button", { name: "Remove Arcana Workspace" }));
    expect(announce).toHaveBeenLastCalledWith("Arcana Workspace removed from the floating previews.");
    await user.click(within(inspector()).getByRole("button", { name: "Add 3D body scan for GLP-1 users" }));
    expect(announce).toHaveBeenLastCalledWith("3D body scan for GLP-1 users added to the floating previews.");
    await user.click(within(inspector()).getByRole("button", { name: "2" }));
    await user.click(within(outline).getByRole("switch", { name: "Show Speed lines + tilt" }));

    await user.click(within(outline).getByRole("button", { name: /^Writing/ }));
    expect(
      within(inspector()).getByText(/No posts yet, so this section stays off the live site/),
    ).toBeInTheDocument();
    await user.click(within(inspector()).getByRole("button", { name: "Latest 2" }));
    await user.click(within(outline).getByRole("button", { name: /^Contact/ }));
    await fill(user, within(inspector()).getByRole("textbox", { name: "Closing line" }), " together");
    await user.click(within(outline).getByRole("button", { name: /^Footer/ }));
    const credit = within(inspector()).getByRole("textbox", { name: "Credit line" });
    await user.clear(credit);
    await fill(user, credit, "Made by me");
    await user.click(within(outline).getByRole("button", { name: /^About/ }));
    expect(within(inspector()).getByRole("textbox", { name: "About text" })).toBeInTheDocument();

    await waitFor(
      async () => {
        const l = (await repo.layout.get()).draft;
        const hero = l.sections.find((s) => s.kind === "hero")?.hero;
        expect(hero?.motion).toBe(false);
        expect(hero?.floaters.atOnce).toBe(2);
        expect(hero?.floaters.items).toContain("3d-body-scan-for-glp-1-users");
        expect(l.sections.find((s) => s.kind === "writing")?.writing?.latest).toBe(2);
        const p = (await repo.profile.get()).draft;
        expect(p.availability).toBe("Open to PM roles");
        expect(p.footer.credit).toBe("Made by me");
      },
      { timeout: 3000 },
    );
    await user.click(screen.getByRole("button", { name: "Publish website" }));
    const dialog = await screen.findByRole("dialog", { name: "Update the live homepage?" });
    for (const t of [
      "Hero: hid speed lines + tilt",
      "Floating previews: 2 at once",
      "Writing: latest 2 posts",
      "Edited closing line",
      "Edited hero availability",
    ])
      expect(within(dialog).getByText(t)).toBeInTheDocument();
  });

  it("edits a skill group and an off duty item, and adds and deletes a text section", async () => {
    const user = userEvent.setup();
    const { repo, announce, outline } = await renderBuilder();
    await user.click(within(outline).getByRole("button", { name: "Show what’s inside Skills" }));
    await user.click(within(outline).getByRole("button", { name: /^Data/ }));
    const add = within(inspector()).getByRole("textbox", { name: "Add a skill" });
    await user.type(add, "Python{Enter}");
    expect(announce).toHaveBeenLastCalledWith("Python added");
    const sizes = within(inspector()).getAllByRole("combobox");
    await user.selectOptions(must(sizes.at(-1)), "xl");
    const handles = within(inspector()).getAllByRole("button", { name: /^Move (?!up$|down$)/ });
    must(handles.at(-1)).focus();
    await user.keyboard("{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/^Python is now \d+ of \d+\.$/));
    await user.click(within(inspector()).getByRole("button", { name: "Remove SQL" }));
    expect(announce).toHaveBeenLastCalledWith("SQL removed");

    await user.click(within(outline).getByRole("button", { name: /^Off duty/ }));
    expect(within(inspector()).getByText(/manga-style page/)).toBeInTheDocument();
    await user.click(within(outline).getByRole("button", { name: /^Anime/ }));
    await user.click(within(inspector()).getByRole("radio", { name: "Lime" }));
    await user.click(within(inspector()).getByRole("radio", { name: "Camera" }));
    const text = within(inspector()).getByRole("textbox", { name: "Text" });
    fireEvent.change(text, { target: { value: "x".repeat(201) } });
    expect(within(inspector()).getByText("201/200")).toBeInTheDocument();
    await user.click(within(inspector()).getByRole("button", { name: "+ Add a favourite" }));
    await fill(user, within(inspector()).getByRole("textbox", { name: "Favourite" }), "Test favourite");
    await user.click(within(inspector()).getByRole("button", { name: "Add" }));
    expect(within(inspector()).getByText("Test favourite")).toBeInTheDocument();

    await user.click(within(outline).getByRole("button", { name: "Add section" }));
    expect(announce).toHaveBeenLastCalledWith("Text section added before Contact.");
    expect(within(inspector()).getByRole("heading", { name: "Text section 1" })).toBeInTheDocument();
    await user.click(within(inspector()).getByRole("button", { name: "Delete section" }));
    expect(await screen.findByText("Text section 1 deleted.", { selector: "span" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(within(outline).getByRole("button", { name: /^Text section 1/ })).toBeInTheDocument();

    await waitFor(
      async () => {
        const p = (await repo.profile.get()).draft;
        const g = p.skills.find((x) => x.id === "g-data");
        expect(g?.items.some((i) => i.text === "Python" && i.size === "xl")).toBe(true);
        expect(g?.items.some((i) => i.text === "SQL")).toBe(false);
        const o = p.offDuty.find((x) => x.id === "o-anime");
        expect(o).toMatchObject({ accent: "lime", art: "camera" });
        expect(o?.picks?.some((x) => x.title === "Test favourite")).toBe(true);
      },
      { timeout: 3000 },
    );
  });
});

describe("SitePreview", () => {
  it("draws the draft with placeholders and selects a section on click", async () => {
    const { repo } = testRepo();
    const [p, l, projects] = await Promise.all([repo.profile.get(), repo.layout.get(), repo.projects.list()]);
    const { content, draftSlugs } = previewContent({
      profile: p.draft,
      layout: l.draft,
      projects,
      posts: [],
      resolve: () => undefined,
      drafts: true,
      phone: true,
      updatedAt: "2026-10-15T00:00:00Z",
    });
    expect(draftSlugs).toHaveLength(4);
    expect(content.layout.sections[0]?.hero?.floaters.items).toEqual([]);
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <MemoryRouter>
        <SitePreview
          content={content}
          layout={content.layout}
          draftSlugs={draftSlugs}
          ghost
          selected="about"
          onSelect={onSelect}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Shipped is hidden")).toBeInTheDocument();
    expect(screen.getByText("Writing appears with your first post")).toBeInTheDocument();
    expect(container.querySelector("style")?.textContent).toContain("DRAFT · NOT LIVE");
    fireEvent.click(screen.getByRole("button", { name: "Edit Skills" }));
    expect(onSelect).toHaveBeenCalledWith("skills");
    expect(screen.getByRole("button", { name: "Edit About" })).toHaveAttribute("aria-pressed", "true");
    rerender(
      <MemoryRouter>
        <SitePreview
          content={content}
          layout={content.layout}
          draftSlugs={[]}
          ghost={false}
          selected={null}
          onSelect={onSelect}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Shipped is hidden")).not.toBeInTheDocument();
  });
});
