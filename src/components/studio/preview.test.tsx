// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { MEMORY_OWNER } from "~/lib/studio/memory";
import { testRepo } from "~/lib/studio/test-helpers";
import StudioPreview from "~/routes/studio/preview";
import { StudioDataProvider } from "./data";
import { ShellContext } from "./shell/ShellContext";
import { ToastProvider } from "./Toast";

Object.defineProperty(document, "fonts", { value: { ready: Promise.resolve() }, configurable: true });

function renderPreview(path: string) {
  const { repo } = testRepo();
  const announce = vi.fn();
  render(
    <MemoryRouter initialEntries={[path]}>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <Routes>
              <Route path="/studio/preview/:kind/:id" element={<StudioPreview />} />
            </Routes>
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  return { repo, announce };
}

describe("Draft preview", { timeout: 20_000 }, () => {
  it("switches devices, compares with live and shares a link", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { announce } = renderPreview("/studio/preview/project/puja-engagement-platform");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Draft preview · not public · noindex" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to editor" })).toHaveAttribute(
      "href",
      "/studio/projects/puja-engagement-platform/overview",
    );
    expect(screen.getByRole("link", { name: "Publish changes" })).toHaveAttribute(
      "href",
      "/studio/projects/puja-engagement-platform/overview?publish=1",
    );
    expect(screen.getByTitle("Draft page, desktop")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Phone" }));
    expect(announce).toHaveBeenLastCalledWith("Phone preview.");
    expect(screen.getByTitle("Draft page, phone")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Highlight changes" }));
    expect(screen.getByRole("switch", { name: "Highlight changes" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await user.click(screen.getByRole("switch", { name: "Compare with live" }));
    expect(announce).toHaveBeenLastCalledWith("Comparing live and draft side by side.");
    expect(screen.getByText("Live · what visitors see now")).toBeInTheDocument();
    expect(screen.getByText("Draft · what you’ll publish")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Compare with live" }));
    expect(announce).toHaveBeenLastCalledWith("Draft only.");

    await user.click(screen.getByRole("button", { name: "Share preview" }));
    const pop = await screen.findByRole("dialog", { name: "Share preview link" });
    expect(pop).toHaveTextContent("Anyone with this link can view the draft");
    expect(pop).toHaveTextContent("Expires in 7 days. Never indexed. Revoke it from URL & SEO.");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(announce).toHaveBeenLastCalledWith("Link copied.");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Share preview link" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Share preview" }));
    expect(screen.getByRole("dialog", { name: "Share preview link" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Share preview" }));
    expect(screen.queryByRole("dialog", { name: "Share preview link" })).not.toBeInTheDocument();
  });

  it("has nothing to compare for a draft that was never published", async () => {
    const user = userEvent.setup();
    const { announce } = renderPreview("/studio/preview/project/3d-body-scan-for-glp-1-users");
    await screen.findByRole("heading", { level: 1, name: /Draft preview/ });
    await user.click(screen.getByRole("switch", { name: "Compare with live" }));
    expect(announce).toHaveBeenLastCalledWith("Not published yet, so there’s no live version to compare.");
  });

  it("previews the homepage, and says when there's nothing to preview", async () => {
    renderPreview("/studio/preview/site/home");
    expect(await screen.findByRole("link", { name: "Back to editor" })).toHaveAttribute(
      "href",
      "/studio/website",
    );
  });

  it("refuses an unknown kind or document", async () => {
    renderPreview("/studio/preview/thing/x");
    expect(await screen.findByText("There’s nothing to preview here")).toBeInTheDocument();
  });

  it("refuses a missing project", async () => {
    renderPreview("/studio/preview/project/nope");
    await waitFor(() => {
      expect(screen.getByText("There’s nothing to preview here")).toBeInTheDocument();
    });
  });
});
