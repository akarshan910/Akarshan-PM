// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadLocalV0 } from "~/lib/sources/local-v0";
import { unlistedUrl, unlistedView } from "~/lib/unlisted";

import { UnlistedProject } from "./UnlistedProject";

const content = loadLocalV0(new Date("2026-10-13T18:00:00Z"));
const project = content.projects[0]?.project;
if (!project) throw new Error("no project");
const footer = { name: "Akarshan Kumar", updatedAt: "2026-10-13T18:00:00Z" };

describe("unlisted helpers", () => {
  it("builds the pm-project address only for a valid slug and a configured project", () => {
    expect(unlistedUrl("https://abc.supabase.co/", "my-page")).toBe(
      "https://abc.supabase.co/functions/v1/pm-project?slug=my-page",
    );
    expect(unlistedUrl(undefined, "my-page")).toBeNull();
    expect(unlistedUrl("https://abc.supabase.co", "../x")).toBeNull();
    expect(unlistedUrl("https://abc.supabase.co", "a".repeat(81))).toBeNull();
  });

  it("accepts only this slug's project, with no volume or neighbours", () => {
    const view = unlistedView({ slug: "a", project, listed: false }, "a", footer);
    expect(view).toMatchObject({ slug: "a", volumes: 0, name: "Akarshan Kumar" });
    expect(view).not.toHaveProperty("volume");
    expect(view).not.toHaveProperty("next");
    expect(unlistedView({ slug: "b", project }, "a", footer)).toBeNull();
    expect(unlistedView({ slug: "a", project: { overview: {} } }, "a", footer)).toBeNull();
    expect(
      unlistedView({ slug: "a", project: { ...project, visuals: { accent: "pink" } } }, "a", footer),
    ).toBeNull();
    expect(unlistedView(null, "a", footer)).toBeNull();
  });
});

function renderShell(fetcher: typeof fetch, slug = "hidden-page") {
  const router = createMemoryRouter(
    [{ path: "/work/:slug", element: <UnlistedProject slug={slug} fetcher={fetcher} /> }],
    {
      initialEntries: [`/work/${slug}`],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("UnlistedProject", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the 404 page without a configured project, fetching nothing", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const fetcher = vi.fn();
    renderShell(fetcher);
    expect(screen.getByRole("heading", { level: 1, name: "This page doesn’t exist." })).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("asks pm-project for the slug and shows the project", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abc.supabase.co");
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ slug: "hidden-page", project, listed: false }))),
    );
    renderShell(fetcher);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the project");
    expect(
      await screen.findByRole("heading", { level: 1, name: project.overview.title }),
    ).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      "https://abc.supabase.co/functions/v1/pm-project?slug=hidden-page",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(screen.queryByText(/^VOL\./)).toBeNull();
  });

  it("shows the 404 page when the function says no, or fails", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abc.supabase.co");
    renderShell(() => Promise.resolve(new Response("{}", { status: 404 })));
    expect(await screen.findByRole("heading", { name: "This page doesn’t exist." })).toBeInTheDocument();
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderShell(() => Promise.reject(new Error("offline")), "other");
    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "This page doesn’t exist." })).toHaveLength(2);
    });
    quiet.mockRestore();
  });
});
