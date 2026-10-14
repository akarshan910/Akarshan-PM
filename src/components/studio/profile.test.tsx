// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { MEMORY_OWNER } from "~/lib/studio/memory";
import { pickFact, removeItem } from "~/lib/studio/profile";
import { must, testRepo } from "~/lib/studio/test-helpers";
import StudioProfile from "~/routes/studio/profile";
import { StudioDataProvider } from "./data";
import { ShellContext } from "./shell/ShellContext";
import { fill } from "./test-editor";
import { ToastProvider } from "./Toast";

async function renderProfile(prepare?: (repo: ReturnType<typeof testRepo>["repo"]) => Promise<void>) {
  const { repo } = testRepo();
  await prepare?.(repo);
  const announce = vi.fn();
  render(
    <MemoryRouter>
      <StudioDataProvider repo={repo}>
        <ToastProvider>
          <ShellContext.Provider
            value={{ session: { email: MEMORY_OWNER, userId: "owner" }, signOut: vi.fn(), announce }}
          >
            <StudioProfile />
          </ShellContext.Provider>
        </ToastProvider>
      </StudioDataProvider>
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { level: 1, name: "Profile & facts" });
  return { repo, announce };
}

const saved = async (
  repo: ReturnType<typeof testRepo>["repo"],
  check: (p: Awaited<ReturnType<typeof repo.profile.get>>["draft"]) => void,
) => {
  await waitFor(
    async () => {
      check((await repo.profile.get()).draft);
    },
    { timeout: 3000 },
  );
};

describe("Profile & facts", { timeout: 20_000 }, () => {
  it("confirms the job title, availability and a site figure, and removes the placeholder", async () => {
    const user = userEvent.setup();
    const { repo, announce } = await renderProfile();
    expect(screen.getByText("Your call")).toBeInTheDocument();
    const cards = screen.getByRole("radiogroup", { name: "Job title" });
    await user.click(
      within(cards).getByRole("radio", {
        name: /^Product Manager\s*As on your résumé \(SugarFit, since May 2025\)/,
      }),
    );
    expect(screen.queryByText("Your call")).not.toBeInTheDocument();
    expect(announce).toHaveBeenLastCalledWith("Job title confirmed.");
    expect(screen.getByText("Job title: Product Manager")).toBeInTheDocument();

    await user.click(must(screen.getAllByRole("button", { name: "Still true" })[0]));
    expect(screen.getByText("Availability confirmed")).toBeInTheDocument();

    const proof = screen.getByRole("region", { name: "Proof strip" });
    expect(within(proof).getByText("3 to confirm")).toBeInTheDocument();
    await user.click(must(within(proof).getAllByRole("button", { name: "Keep the site figure" })[0]));
    expect(within(proof).getByText("2 to confirm")).toBeInTheDocument();
    expect(within(proof).getByText("Site figure")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove the placeholder" }));
    expect(announce).toHaveBeenLastCalledWith("Placeholder removed.");
    expect(screen.getByText("No placeholders left")).toBeInTheDocument();

    await saved(repo, (d) => {
      expect(d.title).toBe("Product Manager");
      expect(d.unconfirmed).not.toContain("title");
      expect(d.unconfirmed).not.toContain("availability");
      expect(d.unconfirmed).not.toContain("proof.p-users.value");
      expect(JSON.stringify(d.experience)).not.toContain("XXX");
    });
  });

  it("uses the résumé figure by editing the stat and the highlight", async () => {
    const user = userEvent.setup();
    const { repo } = await renderProfile();
    const proof = screen.getByRole("region", { name: "Proof strip" });
    await user.click(must(within(proof).getAllByRole("button", { name: "Use the résumé figure" })[0]));
    expect(within(proof).getByText(/Your résumé says “230M\+ lockscreen users”/)).toBeInTheDocument();
    const number = within(proof).getByRole("textbox", { name: "Number" });
    await user.clear(number);
    await user.type(number, "230");
    const label = within(proof).getByRole("textbox", { name: "Label" });
    await user.clear(label);
    await fill(user, label, "Lockscreen users");
    await user.click(within(proof).getByRole("button", { name: "Save and confirm" }));
    expect(within(proof).getByText("Résumé figure")).toBeInTheDocument();
    expect(within(proof).getAllByText("230M+").length).toBeGreaterThan(0);

    const exp = screen.getByRole("region", { name: "Experience" });
    await user.click(must(within(exp).getAllByRole("button", { name: "Use the résumé figure" })[0]));
    const text = within(exp).getByRole("textbox", { name: "Highlight text" });
    text.innerHTML = "Launched a GLP-1 app: ₹3.6 Cr in month one, 52% renewal";
    text.dispatchEvent(new Event("input", { bubbles: true }));
    await user.click(within(exp).getByRole("button", { name: "Save and confirm" }));

    await saved(repo, (d) => {
      expect(d.proof.find((p) => p.id === "p-users")).toMatchObject({
        value: "230",
        unit: "M+",
        label: "Lockscreen users",
      });
      expect(d.facts["proof.p-users.value"]?.source).toBe("resume");
      expect(d.unconfirmed).not.toContain("proof.p-users.value");
      const i4 = d.experience[0]?.highlights[0]?.items.find((i) => i.id === "i4");
      expect(i4?.text).toBe("Launched a GLP-1 app: ₹3.6 Cr in month one, 52% renewal");
      expect(d.facts["experience.e-sugarfit.highlights.h1.items.i4.text"]?.source).toBe("resume");
    });

    // Cancel leaves the flag; an unsourced stat only offers "Still true".
    await user.click(must(within(exp).getAllByRole("button", { name: "Use the résumé figure" })[0]));
    await user.click(within(exp).getByRole("button", { name: "Cancel" }));
    expect(within(exp).getAllByRole("button", { name: "Use the résumé figure" })).toHaveLength(2);
    await user.click(within(proof).getByRole("button", { name: "Still true" }));
    await user.click(within(proof).getByRole("button", { name: "Edit 30Cr+ Annual Revenue Driven" }));
    await user.click(within(proof).getByRole("button", { name: "Done" }));
  });

  it("switches roles and testimonials, moves them, and edits the More fields", async () => {
    const user = userEvent.setup();
    const { repo, announce } = await renderProfile();
    await user.click(
      screen.getByRole("switch", { name: "Show Senior Analyst at Wipro Analytics on the site" }),
    );
    const tst = screen.getByRole("region", { name: "Testimonials" });
    expect(within(tst).getByText("7 on the homepage")).toBeInTheDocument();
    await user.click(within(tst).getByRole("switch", { name: "Show Vishal Gopal on the homepage" }));
    expect(within(tst).getByText("6 on the homepage")).toBeInTheDocument();
    await user.click(within(tst).getByRole("button", { name: "Move Vishal Gopal up" }));
    expect(announce).toHaveBeenLastCalledWith("Vishal Gopal moved up.");
    await waitFor(
      async () => {
        const l = (await repo.layout.get()).draft;
        const items = l.sections.find((s) => s.kind === "testimonials")?.items ?? [];
        expect(items[0]).toEqual({ id: "t-vishal-gopal", visible: false });
        expect(
          l.sections.find((s) => s.kind === "experience")?.items.find((i) => i.id === "e-wipro")?.visible,
        ).toBe(false);
      },
      { timeout: 3000 },
    );

    // A testimonial opens from its row.
    await user.click(within(tst).getByRole("button", { name: "Joseph Werede" }));
    await user.click(within(tst).getByRole("radio", { name: "Teal" }));
    const li = within(tst).getByRole("textbox", { name: "LinkedIn" });
    await fill(user, li, "http://x");
    expect(within(tst).getByText("Use a full link that starts with https://")).toBeInTheDocument();
    await user.click(within(tst).getByRole("button", { name: "Done" }));

    // Add a role, an education entry, a point and a problem space.
    const exp = screen.getByRole("region", { name: "Experience" });
    await user.click(within(exp).getByRole("button", { name: "Add role" }));
    expect(announce).toHaveBeenLastCalledWith("Role added. Fill in its details.");
    await fill(user, within(exp).getByRole("textbox", { name: "Role" }), "Advisor");
    await fill(user, within(exp).getByRole("textbox", { name: "Company" }), "Acme");
    await user.click(within(exp).getByRole("button", { name: "Done" }));
    expect(within(exp).getByRole("switch", { name: "Show Advisor at Acme on the site" })).toBeChecked();
    await user.click(within(exp).getByRole("button", { name: "Add education" }));
    await fill(user, within(exp).getByRole("textbox", { name: "School" }), "B.I.T. Mesra");
    const about = screen.getByRole("region", { name: "About" });
    await user.click(within(about).getByRole("button", { name: "Add point" }));
    await user.click(within(about).getByRole("button", { name: "Move Currently building down" }));
    await user.click(within(about).getByRole("button", { name: "Remove Currently building" }));
    const proof = screen.getByRole("region", { name: "Proof strip" });
    await fill(user, within(proof).getByRole("textbox", { name: "New problem space" }), "Health");
    await user.click(within(proof).getByRole("button", { name: "Add" }));
    expect(announce).toHaveBeenLastCalledWith("Health added.");

    await saved(repo, (d) => {
      expect(d.testimonials.find((t) => t.id === "t-joseph-werede")?.tone).toBe("teal");
      expect(d.experience[0]).toMatchObject({ role: "Advisor", company: "Acme" });
      expect(d.education?.[0]?.school).toBe("B.I.T. Mesra");
      expect(d.about.points?.map((p) => p.title)).toEqual([""]);
      expect(d.spaces?.items).toContain("Health");
    });

    // Remove the new role, with Undo.
    await user.click(within(exp).getByRole("button", { name: /^Advisor/ }));
    await user.click(within(exp).getByRole("button", { name: "Remove role" }));
    expect(await screen.findByText("Removed Advisor.", { selector: "span" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(within(exp).getByRole("button", { name: /^Advisor/ })).toBeInTheDocument();
  });

  it("edits the hero and contact fields", async () => {
    const user = userEvent.setup();
    const { repo } = await renderProfile();
    const name = screen.getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await fill(user, name, "A. Kumar");
    expect(screen.getByText("A. Kumar")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Show availability in the hero" }));
    expect(screen.getByText("Off. Turn it on only if you want to say it publicly.")).toBeInTheDocument();
    expect(screen.getByText("Availability hidden")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Show availability in the hero" }));
    expect(screen.getByRole("textbox", { name: "Availability text" })).toHaveValue(
      "Open to work · Seeking Senior / Lead PM Roles",
    );
    const label = screen.getByRole("textbox", { name: "Hero button" });
    await user.clear(label);
    await fill(user, label, "See the work");
    await user.click(screen.getByRole("switch", { name: "Show the Résumé (PDF) button" }));
    await fill(user, screen.getByRole("textbox", { name: "GitHub" }), "github.com/x");
    expect(screen.getByText("Use a full link that starts with https://")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Show my phone number on the site" }));
    expect(screen.getByText("Phone number shown on the site")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "A booking link" }));
    expect(screen.getByText("Opens your booking page in a new tab.")).toBeInTheDocument();
    await fill(user, screen.getByRole("textbox", { name: "Booking link" }), "https://cal.example/me");
    await saved(repo, (d) => {
      expect(d.name).toBe("A. Kumar");
      expect(d.heroButtons).toMatchObject({ primary: { label: "See the work" }, resume: false });
      expect(d.contact).toMatchObject({
        showPhone: true,
        letsTalk: "booking",
        booking: "https://cal.example/me",
      });
    });
  });

  it("asks before publishing with open items, then publishes", async () => {
    const user = userEvent.setup();
    const { repo } = await renderProfile();
    await user.click(screen.getByRole("button", { name: "Publish profile" }));
    const dialog = await screen
      .findByRole("alertdialog", { name: /Publish with \d+ unconfirmed\?/ })
      .catch(() => screen.findByRole("dialog", { name: /Publish with \d+ unconfirmed\?/ }));
    expect(within(dialog).getByText(/the live value stays until you pick one/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Publish" }));
    expect(
      await screen.findByText("Profile published. The homepage updates within a minute.", {
        selector: "span",
      }),
    ).toBeInTheDocument();
    expect((await repo.profile.get()).publishedAt).not.toBeNull();
  });

  it("publishes straight away when everything is confirmed", async () => {
    const user = userEvent.setup();
    await renderProfile(async (repo) => {
      const row = await repo.profile.get();
      let d = removeItem(row.draft, "e-wipro", "i2");
      for (const k of d.unconfirmed) d = pickFact(d, k, "live");
      await repo.profile.save(d, row.version);
    });
    expect(screen.getByText("All confirmed. Ready to publish.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publish profile" }));
    expect(
      await screen.findByText("Profile published. The homepage updates within a minute.", {
        selector: "span",
      }),
    ).toBeInTheDocument();
  });

  it("says so when publishing fails offline", async () => {
    const user = userEvent.setup();
    const { repo } = await renderProfile();
    repo.offline = true;
    await user.click(screen.getByRole("button", { name: "Publish profile" }));
    expect(
      await screen.findByText("You’re offline. Publish once you’re back online.", { selector: "span" }),
    ).toBeInTheDocument();
  });
});
