// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { buildDashboard } from "~/lib/studio/dashboard";
import { MEMORY_CODE, MEMORY_OWNER } from "~/lib/studio/memory";
import { must, testRepo } from "~/lib/studio/test-helpers";
import { Dashboard, DashboardSkeleton } from "./dashboard/Dashboard";
import { QueryCache, StudioDataProvider, useQuery } from "./data";
import { Login } from "./login/Login";
import { SessionExpired } from "./shell/SessionExpired";
import { Shell } from "./shell/Shell";
import { LoadError } from "./states/LoadError";

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe("Shell", () => {
  it("marks the current item in the sidebar, rail and tab bar, with the project count", () => {
    render(
      <MemoryRouter initialEntries={["/studio/projects/abc/story"]}>
        <Shell email={MEMORY_OWNER} projectCount={9} onSignOut={() => undefined}>
          <p>Body</p>
        </Shell>
      </MemoryRouter>,
    );
    const navs = screen.getAllByRole("navigation", { name: "Studio" });
    expect(navs).toHaveLength(3);
    for (const nav of navs) {
      const current = within(nav)
        .getAllByRole("link")
        .filter((a) => a.getAttribute("aria-current") === "page");
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAccessibleName(/Projects/);
    }
    expect(screen.getByText("9")).toBeInTheDocument();
    for (const live of screen.getAllByRole("link", { name: /View live site/ }))
      expect(live).toHaveAttribute("target", "_blank");
    expect(screen.getAllByText("Home")).toHaveLength(1);
  });

  it("opens the account menu and signs out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <MemoryRouter initialEntries={["/studio"]}>
        <Shell email={MEMORY_OWNER} onSignOut={onSignOut} nav="rail">
          <p>Body</p>
        </Shell>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: /Owner · Sign out/ }));
    expect(await screen.findByText("Signed in with an email code")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Sign out on all devices" }));
    expect(onSignOut).toHaveBeenCalledWith("global");
    await user.click(screen.getByRole("button", { name: `Account: ${MEMORY_OWNER}` }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenLastCalledWith("local");
  });
});

describe("SessionExpired and LoadError", () => {
  it("can't be dismissed, and offers a code", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<SessionExpired open email={MEMORY_OWNER} onSignIn={onSignIn} />);
    expect(screen.getByRole("dialog", { name: "You’ve been signed out" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(onSignIn).toHaveBeenCalled();
  });

  it("explains a failed load", async () => {
    const onRetry = vi.fn();
    render(<LoadError title="Couldn’t load your projects" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing on your live site has changed.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("Dashboard", () => {
  async function model() {
    const { repo } = testRepo();
    return buildDashboard({
      projects: await repo.projects.list(),
      posts: [],
      profile: await repo.profile.get(),
      layout: await repo.layout.get(),
      linkChecks: [],
    });
  }

  it("greets, counts and lists what needs input", async () => {
    const onNew = vi.fn();
    render(
      <MemoryRouter>
        <Dashboard
          model={await model()}
          name="Akarshan Kumar"
          now={new Date(2026, 9, 13, 19, 0)}
          email={MEMORY_OWNER}
          onNewProject={onNew}
          onSignOut={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Good evening, Akarshan");
    expect(screen.getByText("Tuesday, 13 Oct")).toBeInTheDocument();
    expect(screen.getByText("Four drafts need your input before they can go live.")).toBeInTheDocument();
    const needs = screen.getByRole("region", { name: "Needs your input" });
    expect(within(needs).getAllByText("Continue →")).toHaveLength(4);
    expect(within(needs).getByText("Review in case study →")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Recently edited" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /New project/ }));
    expect(onNew).toHaveBeenCalled();
  });

  it("shows the first-run state and the skeleton", async () => {
    const m = { ...(await model()), empty: true };
    const onNew = vi.fn();
    const { unmount } = render(
      <MemoryRouter>
        <Dashboard
          model={m}
          name=""
          now={new Date()}
          email={MEMORY_OWNER}
          onNewProject={onNew}
          onSignOut={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Welcome to Studio" })).toBeInTheDocument();
    expect(screen.getByText("Your first volume starts here")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "New project" }));
    expect(onNew).toHaveBeenCalled();
    unmount();
    render(<DashboardSkeleton />);
    expect(screen.getByLabelText("Loading the dashboard")).toHaveAttribute("aria-busy", "true");
  });

  it("says when nothing needs input", async () => {
    const m = { ...(await model()), needs: [] };
    render(
      <MemoryRouter>
        <Dashboard
          model={m}
          name="A"
          now={new Date()}
          email={MEMORY_OWNER}
          onNewProject={() => undefined}
          onSignOut={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Nothing needs your input right now.").length).toBeGreaterThan(0);
  });
});

describe("data layer", () => {
  function Probe({ id }: { id: string }) {
    const q = useQuery(`project:${id}`, (r) => r.projects.get(id));
    if (q.status === "loading") return <p>Loading</p>;
    if (q.status === "error") return <button onClick={q.refetch}>Retry</button>;
    return <p>{q.data?.draft.overview.title ?? "none"}</p>;
  }

  it("fetches, caches, invalidates and reports errors", async () => {
    const { repo } = testRepo();
    const cache = new QueryCache();
    const first = must((await repo.projects.list())[0]);
    render(
      <StudioDataProvider repo={repo} cache={cache}>
        <Probe id={first.id} />
      </StudioDataProvider>,
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText(first.draft.overview.title)).toBeInTheDocument();
    act(() => {
      cache.set(`project:${first.id}`, {
        ...first,
        draft: { ...first.draft, overview: { ...first.draft.overview, title: "Set" } },
      });
    });
    expect(screen.getByText("Set")).toBeInTheDocument();
    act(() => {
      cache.invalidate("project");
    });
    expect(await screen.findByText(first.draft.overview.title)).toBeInTheDocument();
    const spy = vi.spyOn(repo.projects, "get").mockRejectedValueOnce(new Error("down"));
    act(() => {
      cache.clear();
    });
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByText(first.draft.overview.title)).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  it("needs a provider", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe id="x" />)).toThrow(/StudioDataProvider/);
    err.mockRestore();
  });
});

describe("Login", () => {
  function setup(props: Partial<Parameters<typeof Login>[0]> = {}) {
    const { repo, clock } = testRepo({ signedIn: false });
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    const onSignedIn = vi.fn();
    const utils = render(
      <Login
        auth={repo.auth}
        next="/studio/projects"
        onSignedIn={onSignedIn}
        now={() => clock.now}
        local={local}
        session={session}
        {...props}
      />,
    );
    return { repo, clock, local, session, onSignedIn, ...utils };
  }

  it("checks the address, sends a code and signs the owner in", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const { onSignedIn, local } = setup({ nextName: "Projects" });
    expect(screen.getByText(/you’ll go straight back to/)).toHaveTextContent("Projects");
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an email address, like name@example.com.");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), MEMORY_OWNER);
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("o•••r@example.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code in 1:00|Resend code in 0:5/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.type(screen.getByRole("textbox", { name: "6-digit code" }), MEMORY_CODE);
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(onSignedIn).toHaveBeenCalledWith("/studio/projects");
    expect(local.getItem("studio.email")).toBe(MEMORY_OWNER);
    vi.useRealTimers();
  });

  it("shows a wrong code, the resend wait and the lock after five tries", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("Email"), MEMORY_OWNER);
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByRole("heading", { name: "Check your email" });
    await user.click(screen.getByRole("button", { name: /Resend code in/ }));
    expect(screen.getByRole("status")).toHaveTextContent("A code was sent moments ago.");
    for (let i = 0; i < 4; i++) {
      await user.type(screen.getByRole("textbox", { name: "6-digit code" }), "000000");
      expect(await screen.findByText("That code didn’t work.", { selector: "b" })).toBeInTheDocument();
      await user.clear(screen.getByRole("textbox", { name: "6-digit code" }));
    }
    await user.type(screen.getByRole("textbox", { name: "6-digit code" }), "000000");
    expect(await screen.findByText("Too many tries.", { selector: "b" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Send a new code" })).toHaveAttribute("aria-disabled", "false");
    await user.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.getByRole("heading", { name: "Sign in to Studio" })).toBeInTheDocument();
  });

  it("calls an old code expired, then sends a new one", async () => {
    const user = userEvent.setup();
    const { clock } = setup();
    await user.type(screen.getByLabelText("Email"), MEMORY_OWNER);
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByRole("heading", { name: "Check your email" });
    clock.now += 11 * 60_000;
    await user.type(screen.getByRole("textbox", { name: "6-digit code" }), MEMORY_CODE);
    expect(await screen.findByText("That code has expired.", { selector: "b" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send a new code" }));
    await waitFor(() => {
      expect(screen.queryByText("That code has expired.", { selector: "b" })).not.toBeInTheDocument();
    });
  });

  it("refuses an account that isn't the owner without saying why", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("Email"), "someone@example.test");
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByRole("heading", { name: "Check your email" });
    await user.type(screen.getByRole("textbox", { name: "6-digit code" }), MEMORY_CODE);
    expect(
      await screen.findByRole("heading", { name: "This account can’t open Studio" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the portfolio" })).toHaveAttribute("href", "/");
    await user.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.getByLabelText("Email")).toHaveValue("someone@example.test");
  });

  it("shows the signed-out note, the offline alert, and sends at once from the session dialog", async () => {
    const user = userEvent.setup();
    const { repo, local } = (() => {
      const r = testRepo({ signedIn: false });
      return { repo: r.repo, local: new MemoryStorage() };
    })();
    local.setItem("studio.email", MEMORY_OWNER);
    repo.offline = true;
    const { unmount } = render(
      <Login
        auth={repo.auth}
        next="/studio"
        signedOut
        onSignedIn={() => undefined}
        local={local}
        session={new MemoryStorage()}
      />,
    );
    expect(screen.getByText("You’ve been signed out.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue(MEMORY_OWNER);
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("You’re offline.")).toBeInTheDocument();
    repo.offline = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByText("You’re offline.")).not.toBeInTheDocument();
    unmount();
    render(
      <Login
        auth={repo.auth}
        next="/studio"
        sendNow
        onSignedIn={() => undefined}
        local={local}
        session={new MemoryStorage()}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
  });

  it("shows the bot check when Turnstile asks", async () => {
    const user = userEvent.setup();
    const { repo } = testRepo({ signedIn: false });
    vi.spyOn(repo.auth, "sendCode").mockResolvedValue("captcha");
    render(
      <Login
        auth={repo.auth}
        next="/studio"
        onSignedIn={() => undefined}
        local={new MemoryStorage()}
        session={new MemoryStorage()}
      />,
    );
    await user.type(screen.getByLabelText("Email"), MEMORY_OWNER);
    await user.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("Verify you are human")).toBeInTheDocument();
  });
});
