// @vitest-environment jsdom
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { must } from "~/lib/studio/test-helpers";
import { fill, renderEditor } from "./test-editor";
import { OutcomesTab } from "./editor/OutcomesTab";
import { SettingsTab } from "./editor/SettingsTab";
import { StoryTab } from "./editor/StoryTab";
import { VisualsTab } from "./editor/VisualsTab";

const live = (rows: { id: string; published: unknown }[]) => must(rows.find((r) => r.published)).id;
const puja = (rows: { id: string }[]) => must(rows.find((r) => r.id === "puja-engagement-platform")).id;
const draft = (rows: { id: string; published: unknown }[]) => must(rows.find((r) => !r.published)).id;
const saved = async <T,>(fn: () => Promise<T>, check: (v: T) => void) => {
  await waitFor(
    async () => {
      check(await fn());
    },
    { timeout: 3000 },
  );
};

describe("Visuals", { timeout: 20_000 }, () => {
  it("switches the hero, checks video and prototype links, and keeps what was typed", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "visuals", <VisualsTab />);
    expect(screen.getByText("Uses the cover image below, cropped to 16:10.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Video" }));
    const video = screen.getByRole("textbox", { name: "Video link" });
    await fill(user, video, "https://example.com/v");
    expect(screen.getByText(/That link isn’t from YouTube, Vimeo, Loom or Google Drive/)).toBeInTheDocument();
    await user.clear(video);
    await fill(user, video, "https://drive.google.com/file/d/abc/view");
    expect(screen.getByText("Google Drive video")).toBeInTheDocument();
    expect(screen.getByText(/Anyone with the link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Prototype" }));
    const proto = screen.getByRole("textbox", { name: "Prototype link" });
    await fill(user, proto, "http://x");
    expect(screen.getByText("Use an https:// address.")).toBeInTheDocument();
    await user.clear(proto);
    await fill(user, proto, "https://app-git-main-me.vercel.app");
    expect(screen.getByText(/This is a Vercel preview link/)).toBeInTheDocument();
    await user.clear(proto);
    await fill(user, proto, "https://www.figma.com/proto/abc");
    expect(
      await screen.findByText("Figma prototype: it plays in Figma’s embed.", {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Opens without a login.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desktop" }));
    await user.click(screen.getByRole("button", { name: "When scrolled into view" }));
    expect(
      screen.getByText("Loads as it scrolls into view. Heavier, but it feels instant."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getByRole("textbox", { name: "Video link" })).toHaveValue(
      "https://drive.google.com/file/d/abc/view",
    );
    await saved(
      () => repo.projects.get(id),
      (r) => {
        expect(r?.draft.visuals.hero).toEqual({
          type: "video",
          url: "https://drive.google.com/file/d/abc/view",
        });
      },
    );
  });

  it("picks an accent, moves the focal point and requires cover alt text", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "visuals", <VisualsTab />);
    await user.click(screen.getByRole("radio", { name: /^Amber/ }));
    expect(screen.getByRole("radio", { name: /^Amber/ })).toHaveAttribute("aria-checked", "true");
    const focal = screen.getByRole("button", { name: /Focal point at 50% across, 50% down/ });
    focal.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
    expect(screen.getByRole("button", { name: /Focal point at 60% across, 55% down/ })).toBeInTheDocument();
    const alt = screen.getByRole("textbox", { name: /Cover alt text/ });
    await user.clear(alt);
    expect(
      screen.getByText("Add alt text so screen reader users get the same information."),
    ).toBeInTheDocument();
    await fill(user, alt, "A cover");
    await saved(
      () => repo.projects.get(id),
      (r) => {
        expect(r?.draft.visuals.cover?.alt).toBe("A cover");
        expect(r?.draft.visuals.accent).toBe("amber");
      },
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
    });
    expect((await repo.media.list()).find((m) => m.id === `cover-${id}`)?.focal).toEqual({ x: 0.6, y: 0.55 });
    // The cover's link-preview crop exists, and follows the focal point.
    await waitFor(async () => {
      expect((await repo.media.list()).find((m) => m.id === `cover-${id}`)?.hasOg).toBe(true);
    });
  });

  it("opens the upload sheet for the gallery on phones", async () => {
    const user = userEvent.setup({ applyAccept: false });
    await renderEditor(live, "visuals", <VisualsTab />);
    await user.click(screen.getByRole("button", { name: "Add images" }));
    const sheet = await screen.findByRole("dialog", { name: /^Add to the .+ gallery$/ });
    expect(within(sheet).getByText("Photo library")).toBeInTheDocument();
    expect(within(sheet).getByText("Files · images")).toBeInTheDocument();
    await user.upload(
      within(sheet).getByLabelText("Files · images"),
      new File(["x"], "s.png", { type: "image/png" }),
    );
    const alt = await within(sheet).findByLabelText(/Alt text for s\.png/);
    await user.type(alt, "A screen");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(within(sheet).queryByLabelText(/Alt text for s\.png/)).not.toBeInTheDocument();
    });
  });

  it("uploads gallery images, edits the selected one, and refuses files that are too large", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo, id } = await renderEditor(live, "visuals", <VisualsTab />);
    expect(screen.getByText("Select a gallery image to edit its alt text and caption.")).toBeInTheDocument();
    const input = screen.getByLabelText(/^Add images/, { selector: "input" });
    const big = new File(["x"], "flow.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 14.2 * 1024 * 1024 });
    await user.upload(input, [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
      big,
    ]);
    expect(await screen.findByText("Too large")).toBeInTheDocument();
    expect(await screen.findByText("Image 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("2 need alt text")).toBeInTheDocument();
    await fill(user, screen.getByRole("textbox", { name: /^Alt text/ }), "First screen");
    await user.type(screen.getByRole("textbox", { name: "Caption" }), "Home");
    await user.click(screen.getByRole("button", { name: "Move later" }));
    expect(screen.getByText("Image 2 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Decorative: screen readers skip it" }));
    expect(screen.getByText(/Marked decorative, so no alt text is needed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^b\.png/ }));
    await user.click(screen.getByRole("button", { name: "Remove from gallery" }));
    expect(
      await screen.findByText("Removed from the gallery. The file stays in your media library.", {
        selector: "span",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Remove flow.png" }));
    await saved(
      () => repo.projects.get(id),
      (r) => {
        expect(r?.draft.visuals.gallery).toHaveLength(2);
        expect(r?.draft.visuals.gallery[1]).toMatchObject({
          alt: "First screen",
          caption: "Home",
          decorative: true,
        });
      },
    );
  });

  it("adds a cover to a draft without one", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo, id } = await renderEditor(draft, "visuals", <VisualsTab />);
    await user.upload(
      screen.getByLabelText(/Add a cover image/),
      new File(["c"], "cover.png", { type: "image/png" }),
    );
    expect(await screen.findByRole("button", { name: /Focal point/ })).toBeInTheDocument();
    await saved(
      () => repo.projects.get(id),
      (r) => {
        expect(r?.draft.visuals.cover?.mediaId).toBeTruthy();
      },
    );
  });
});

describe("Story", { timeout: 20_000 }, () => {
  it("reorders chapters by keyboard, hides one, and adds a chapter", async () => {
    const user = userEvent.setup();
    const { announce } = await renderEditor(puja, "story", <StoryTab />);
    const nav = screen.getByRole("navigation", { name: "Chapters" });
    const handles = within(nav).getAllByRole("button", { name: /^Move / });
    must(handles[1]).focus();
    await user.keyboard("{ArrowUp}");
    expect(announce).toHaveBeenLastCalledWith(expect.stringMatching(/ is now chapter 1 of \d+\.$/));
    await user.click(within(nav).getAllByRole("button", { name: /^Hide / })[0] as HTMLElement);
    expect(within(nav).getByText("Hidden by you")).toBeInTheDocument();
    await user.click(within(nav).getByRole("button", { name: "Add chapter" }));
    expect(screen.getByRole("textbox", { name: "Chapter title" })).toHaveValue("New chapter");
    expect(
      screen.getByText("Nothing here yet, so this chapter is hidden on the live page."),
    ).toBeInTheDocument();
    expect(screen.getByText("What should a reader take from this chapter?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ownership" }));
    expect(screen.getByRole("textbox", { name: "My ownership" })).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Chapter title" }));
    expect(
      screen.getByText("Give this chapter a title. It’s shown on the page and in the contents."),
    ).toBeInTheDocument();
  });

  it("adds, duplicates, moves and deletes blocks, with Undo", async () => {
    const user = userEvent.setup();
    const { announce } = await renderEditor(puja, "story", <StoryTab />);
    await user.click(screen.getByRole("button", { name: "Add block" }));
    const palette = screen.getByRole("group", { name: "Block types" });
    expect(within(palette).getAllByRole("button")).toHaveLength(17);
    await user.click(within(palette).getByRole("button", { name: /^Callout/ }));
    expect(announce).toHaveBeenLastCalledWith("Callout block added.");
    expect(screen.getByText("Callout settings")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accent" }));
    await user.click(screen.getByRole("button", { name: "Chapter settings" }));
    expect(screen.getByText("Link to this chapter")).toBeInTheDocument();
    const blocks = () => screen.getAllByRole("article");
    const last = () => must(blocks().at(-1));
    await user.click(within(last()).getByRole("button", { name: "Duplicate block" }));
    expect(await screen.findByText("Block duplicated.", { selector: "span" })).toBeInTheDocument();
    const count = blocks().length;
    await user.click(within(last()).getByRole("button", { name: "Move block up" }));
    await user.click(within(last()).getByRole("button", { name: "Delete block" }));
    expect(blocks()).toHaveLength(count - 1);
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(blocks()).toHaveLength(count);
  });

  it("fixes a flagged RICE row three ways, with undo", async () => {
    const user = userEvent.setup();
    const { repo, id, announce } = await renderEditor(puja, "story", <StoryTab />);
    const nav = screen.getByRole("navigation", { name: "Chapters" });
    await user.click(within(nav).getByText("RICE Prioritisation"));
    expect(screen.getByText("1 row needs a look")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use 11.3 and re-rank" }));
    expect(announce).toHaveBeenLastCalledWith("Score set to 11.3. Subscription Packages now ranks first.");
    expect(screen.getByText(/Subscription Packages now ranks first\./)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Set effort to 3 mo" }));
    expect(
      screen.getByText("Effort set to 3 months, so the score of 5.7 now matches its inputs."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Keep as is" }));
    expect(announce).toHaveBeenLastCalledWith("Marked as reviewed. The score stays 5.7.");
    await user.click(screen.getByRole("button", { name: /^Table · RICE/ }));
    expect(screen.getByRole("switch", { name: "Check scores against inputs" })).toBeChecked();
    await user.click(screen.getByRole("switch", { name: "Sort rows by score" }));
    await saved(
      () => repo.projects.get(id),
      (r) => {
        const table = r?.draft.story.flatMap((c) => c.blocks).find((b) => b.type === "table");
        expect(table).toMatchObject({ reviewed: ["Subscription Packages"], sortByScore: true });
      },
    );
  });
});

describe("Outcomes", { timeout: 20_000 }, () => {
  it("adds a result once it has a type, flags achieved without evidence, sets the headline and deletes with Undo", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "outcomes", <OutcomesTab />);
    const before = screen.getAllByRole("article").length;
    await user.click(screen.getByRole("button", { name: "Add result" }));
    const card = must(screen.getAllByRole("article").at(-1));
    expect(within(card).getByText("Pick one. Unlabelled numbers can’t be published.")).toBeInTheDocument();
    await user.type(within(card).getByPlaceholderText("e.g. 52%"), "52%");
    await fill(user, within(card).getByPlaceholderText("e.g. renewal rate"), "renewal rate");
    await user.click(within(card).getByRole("button", { name: "Achieved" }));
    const added = must(screen.getAllByRole("article").at(-1));
    expect(
      within(added).getByText(/Achieved results need a note on where the number comes from/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Result ${before + 1} is marked achieved with no evidence note.`),
    ).toBeInTheDocument();
    await fill(user, within(added).getByRole("textbox", { name: /Evidence/ }), "Dashboard");
    await user.click(within(added).getByRole("button", { name: "Business outcome" }));
    await user.click(within(added).getByRole("button", { name: "Make card headline" }));
    expect(within(added).getByRole("button", { name: "Card headline" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(within(added).getByRole("switch", { name: "Show in the page’s results strip" }));
    await user.click(within(added).getByRole("button", { name: `Move result ${before + 1} up` }));
    await saved(
      () => repo.projects.get(id),
      (r) => {
        const o = r?.draft.outcomes.find((x) => x.value === "52%");
        expect(o).toMatchObject({
          type: "achieved",
          evidence: "Dashboard",
          credit: "business",
          inStrip: false,
        });
        expect(r?.draft.headlineOutcomeId).toBe(o?.id);
      },
    );
    const first = must(screen.getAllByRole("article")[0]);
    await user.click(within(first).getByRole("button", { name: "Delete result 1" }));
    expect(screen.getAllByRole("article")).toHaveLength(before);
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(screen.getAllByRole("article")).toHaveLength(before + 1);
  });

  it("shows the empty state", async () => {
    const user = userEvent.setup();
    await renderEditor(draft, "outcomes", <OutcomesTab />);
    expect(screen.getByText("No results yet")).toBeInTheDocument();
    expect(screen.getByText("Nothing in the strip. The page skips this section.")).toBeInTheDocument();
    expect(screen.getByText("No headline: the card shows its summary only.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add a result" }));
    await user.click(screen.getByRole("button", { name: "Delete result 1" }));
    expect(screen.getByText("No results yet")).toBeInTheDocument();
  });
});

describe("URL & SEO", { timeout: 20_000 }, () => {
  it("checks the address, suggests a free one, and offers the redirect", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "settings", <SettingsTab ownerName="Test Owner" />);
    const slug = screen.getByRole("textbox", { name: "Address" });
    expect(screen.getByText("This is the current address")).toBeInTheDocument();
    await user.clear(slug);
    expect(screen.getByText("Add an address.")).toBeInTheDocument();
    await fill(user, slug, "Bad Slug");
    expect(screen.getByText("Use only lowercase letters, numbers and single hyphens.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use bad-slug" }));
    expect(await screen.findByText("Available", {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Redirect the old address here" })).toBeInTheDocument();
    expect((await repo.projects.get(id))?.slug).toBe("bad-slug");
    const other = must((await repo.projects.list()).find((r) => r.published && r.id !== id));
    await user.clear(slug);
    await user.type(slug, other.slug);
    expect(
      await screen.findByText(`Already used by “${other.draft.overview.title}”.`, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Use ${other.slug}-2` })).toBeInTheDocument();
  });

  it("edits search text, visibility and indexing, and creates and revokes a preview link", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { repo, id } = await renderEditor(live, "settings", <SettingsTab ownerName="Test Owner" />);
    expect(screen.getByText("Using the project title and your name.")).toBeInTheDocument();
    await fill(user, screen.getByRole("textbox", { name: "Search title" }), "x".repeat(61));
    expect(
      screen.getByText("Search engines may cut this off after about 60 characters."),
    ).toBeInTheDocument();
    await fill(user, screen.getByRole("textbox", { name: "Search description" }), "A description.");
    expect(screen.getByText("Custom description.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Unlisted/ }));
    expect(screen.getByText("Off: unlisted pages are always noindex.")).toBeInTheDocument();
    expect(screen.getByText("Unlisted: this result won’t appear in search engines.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /^Public/ }));
    await user.click(screen.getByRole("switch", { name: "Let search engines index this page" }));
    expect(screen.getByText("Hidden from search results, but still on your homepage.")).toBeInTheDocument();
    await saved(
      () => repo.projects.get(id),
      (r) => {
        expect(r).toMatchObject({ visibility: "public", indexAllowed: false });
        expect(r?.draft.seo.description).toBe("A description.");
      },
    );
    await user.click(screen.getByRole("button", { name: "Create preview link" }));
    expect(
      await screen.findByText("Preview link created. It expires in 7 days.", { selector: "span" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/preview\//));
    await user.click(screen.getByRole("button", { name: "Revoke link" }));
    expect(
      await screen.findByText("Preview link revoked. It stops working now.", { selector: "span" }),
    ).toBeInTheDocument();
    expect(await repo.previews.list("project", id)).toHaveLength(0);
  });

  it("unpublishes after confirming, and deletes only once the address is typed", async () => {
    const user = userEvent.setup();
    const { repo, id } = await renderEditor(live, "settings", <SettingsTab ownerName="Test Owner" />);
    await user.click(screen.getByRole("button", { name: "Unpublish…" }));
    expect(screen.getByText(/It disappears from your homepage now/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unpublish" }));
    expect(
      await screen.findByText("Unpublished. It’s a draft again, and its address shows your work index.", {
        selector: "span",
      }),
    ).toBeInTheDocument();
    expect((await repo.projects.get(id))?.published).toBeNull();
    await user.click(screen.getByRole("button", { name: "Delete…" }));
    const confirm = screen.getByRole("button", { name: "Delete forever" });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    await user.type(screen.getByLabelText(/This can’t be undone/), id);
    expect(confirm).toHaveAttribute("aria-disabled", "false");
    await user.click(confirm);
    expect(await screen.findByText("Elsewhere")).toBeInTheDocument();
    expect(await repo.projects.get(id)).toBeNull();
  });
});
