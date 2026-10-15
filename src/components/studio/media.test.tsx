// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { MEMORY_OWNER } from "~/lib/studio/memory";
import { must, testRepo } from "~/lib/studio/test-helpers";
import StudioMedia from "~/routes/studio/media";
import { StudioDataProvider } from "./data";
import { fill } from "./test-editor";
import { ShellContext } from "./shell/ShellContext";
import { ToastProvider } from "./Toast";

async function renderMedia() {
  const { repo } = testRepo();
  const announce = vi.fn();
  render(
    <MemoryRouter>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <StudioMedia />
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  await screen.findByText(/Every file you’ve uploaded/);
  return { repo, announce };
}

const file = (name: string, type: string, size = 10) => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("Media", { timeout: 20_000 }, () => {
  it("uploads files, names the refused ones, and asks for alt text", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo, announce } = await renderMedia();
    const input = document.querySelector<HTMLInputElement>('input[type="file"][multiple]');
    await user.upload(must(input), [
      file("screen-08.png", "image/png"),
      file("walkthrough.mp4", "video/mp4"),
      file("big.pdf", "application/pdf", 18.4 * 1024 * 1024),
    ]);
    expect(await screen.findByText(/Video files aren’t uploaded/)).toBeInTheDocument();
    expect(screen.getByText(/Too large: 18\.4 MB\. PDFs can be up to 10 MB\./)).toBeInTheDocument();
    await waitFor(() => {
      expect(announce).toHaveBeenLastCalledWith("Uploading 1 file. 2 files couldn’t be uploaded.");
    });
    expect(screen.getByRole("textbox", { name: "File name" })).toHaveValue("screen-08.png");
    await user.click(screen.getByRole("button", { name: /^Needs alt text · 1/ }));
    expect(screen.getAllByRole("button", { name: /needs alt text$/ })).toHaveLength(1);
    const alt = screen.getByRole("textbox", { name: /Alt text/ });
    await fill(user, alt, "A screen");
    await user.tab();
    await waitFor(async () => {
      expect((await repo.media.list()).find((m) => m.filename === "screen-08.png")?.alt).toBe("A screen");
    });
    await user.click(screen.getAllByRole("button", { name: "Dismiss" })[0] as HTMLElement);
  });

  it("filters, searches and shows the empty filter state", async () => {
    const user = userEvent.setup();
    await renderMedia();
    await user.click(screen.getByRole("button", { name: /^Documents 0/ }));
    expect(screen.getByText("Nothing here with these filters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all files" }));
    await user.type(screen.getByRole("searchbox", { name: "Search files" }), "zzz");
    expect(screen.getByText("No files match “zzz”")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "Search files" }));
    await user.click(screen.getByRole("button", { name: /^Not used anywhere · 0/ }));
    expect(screen.getByText("Nothing here with these filters")).toBeInTheDocument();
  });

  it("blocks deleting a file in use, and deletes an unused one", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo } = await renderMedia();
    const tile = must(screen.getAllByRole("button", { name: /used in 1/ })[0]);
    await user.click(tile);
    const details = screen.getByRole("complementary", { name: "File details" });
    expect(within(details).getByText("Used in")).toBeInTheDocument();
    expect(within(details).getByText("Cover →")).toBeInTheDocument();
    await user.click(within(details).getByRole("button", { name: "Delete…" }));
    expect(
      within(details).getByText(/This file is used in 1 place\. Remove it from there first/),
    ).toBeInTheDocument();
    await user.click(within(details).getByRole("button", { name: "OK" }));
    const input = document.querySelector<HTMLInputElement>('input[type="file"][multiple]');
    await user.upload(must(input), [file("loose.png", "image/png")]);
    await user.upload(must(input), [file("cv.pdf", "application/pdf")]);
    expect(
      await screen.findByText(/PDFs go up as they are, so they keep their own details/),
    ).toBeInTheDocument();
    await user.click(must(screen.getAllByRole("button", { name: /loose\.png/ })[0]));
    await screen.findByDisplayValue("loose.png");
    await user.click(within(details).getByRole("button", { name: "Delete…" }));
    expect(
      within(details).getByText("Delete loose.png? It isn’t used anywhere. This can’t be undone."),
    ).toBeInTheDocument();
    await user.click(within(details).getByRole("button", { name: "Delete file" }));
    expect(await screen.findByText("Deleted loose.png.", { selector: "span" })).toBeInTheDocument();
    expect((await repo.media.list()).some((m) => m.filename === "loose.png")).toBe(false);
  });

  it("replaces a file and renames it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo } = await renderMedia();
    await user.click(must(screen.getAllByRole("button", { name: /used in 1/ })[0]));
    const details = screen.getByRole("complementary", { name: "File details" });
    const replace = within(details).getByRole("button", { name: "Replace file" });
    await user.click(replace);
    const input = must(details.querySelector<HTMLInputElement>('input[type="file"]'));
    await user.upload(input, file("new-cover.png", "image/png"));
    expect(
      await screen.findByText(/File replaced\. 1 page shows it after the next publish\./, {
        selector: "span",
      }),
    ).toBeInTheDocument();
    const name = within(details).getByRole("textbox", { name: "File name" });
    await user.clear(name);
    await fill(user, name, "renamed.png");
    await user.tab();
    await waitFor(async () => {
      expect((await repo.media.list()).some((m) => m.filename === "renamed.png" && m.rev === 2)).toBe(true);
    });
  });

  it("offers the phone upload sheet", async () => {
    const user = userEvent.setup({ applyAccept: false });
    await renderMedia();
    const opener = must(screen.getAllByRole("button", { name: "Upload" })[0]);
    // Esc closes it and puts focus back on Upload (QA-S8).
    await user.click(opener);
    await screen.findByRole("dialog", { name: "Add to your media" });
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
    await user.click(opener);
    const sheet = await screen.findByRole("dialog", { name: "Add to your media" });
    expect(within(sheet).getByText("Photo library")).toBeInTheDocument();
    expect(within(sheet).getByText("Take a photo")).toBeInTheDocument();
    const files = within(sheet).getByLabelText(/Files · images and PDFs/);
    await user.upload(files, file("screen-09.png", "image/png"));
    const altBox = await within(sheet).findByLabelText(/Alt text for screen-09\.png/);
    await fill(user, altBox, "Ninth screen");
    await user.click(within(sheet).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(within(sheet).queryByLabelText(/Alt text for screen-09\.png/)).not.toBeInTheDocument();
    });
  });

  it("says why an upload failed, and retries it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repo } = await renderMedia();
    repo.offline = true;
    const input = document.querySelector<HTMLInputElement>('input[type="file"][multiple]');
    await user.upload(must(input), [file("retry-me.png", "image/png")]);
    expect(await screen.findByText(/^offline$|Retry once you’re back|offline/)).toBeInTheDocument();
    repo.offline = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByDisplayValue("retry-me.png")).toBeInTheDocument();
    expect((await repo.media.list()).some((m) => m.filename === "retry-me.png")).toBe(true);
  });
});
