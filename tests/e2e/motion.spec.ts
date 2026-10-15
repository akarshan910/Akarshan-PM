import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

/**
 * 08 · Motion: every M-* animation in 04 · Motion, one element each, against the computed
 * duration, easing and delay, then the reduced-motion variant. Timers are mocked where the motion is
 * scheduled (floaters, testimonial paging); CSS keyframes are read from the computed style.
 *
 * Each describe sets its own viewport and input, so the spec runs once, in the laptop project.
 * The video and lightbox have no V0 content, so they're checked in the component catalogue on the
 * dev server, as studio.spec.ts does.
 */
const DEV = process.env.STUDIO_URL ?? `http://localhost:${Number(process.env.PW_PORT_BASE ?? 4310) + 1}`;

const EO = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const SPRING = "cubic-bezier(0.34, 1.26, 0.64, 1)";
const LAPTOP = { viewport: { width: 1440, height: 900 }, hasTouch: false };
const IPAD = { viewport: { width: 834, height: 1112 }, hasTouch: true };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true };
const CASE = "/work/puja-engagement-platform/";
const PROTO = "/work/arcana-workspace/";

/** A CSS-module class: `_card_x1y2z_12` matches `card`. */
const m = (name: string) => `[class*="_${name}_"]`;

interface Timing {
  duration: string;
  easing: string;
  delay: string;
}

/** The element's transitions, by property. */
async function transitions(loc: Locator, pseudo?: string): Promise<Record<string, Timing>> {
  return loc.evaluate((el, p) => {
    const cs = getComputedStyle(el, p ?? null);
    // Split on commas outside brackets: cubic-bezier(…) has commas of its own.
    const list = (v: string) => v.split(/,(?![^(]*\))/).map((s) => s.trim());
    const props = list(cs.transitionProperty);
    const durations = list(cs.transitionDuration);
    const easings = list(cs.transitionTimingFunction);
    const delays = list(cs.transitionDelay);
    const at = (a: string[], i: number) => a[i % a.length] ?? "";
    return Object.fromEntries(
      props.map((prop, i) => [
        prop,
        { duration: at(durations, i), easing: at(easings, i), delay: at(delays, i) },
      ]),
    );
  }, pseudo);
}

/** The total transition time, in seconds: zero means nothing transitions. */
async function transitionSeconds(loc: Locator, pseudo?: string) {
  const t = await transitions(loc, pseudo);
  return Object.values(t).reduce((s, v) => s + parseFloat(v.duration), 0);
}

interface Anim extends Timing {
  name: string;
  iterations: string;
}

async function animation(loc: Locator, pseudo?: string): Promise<Anim> {
  return loc.evaluate((el, p) => {
    const cs = getComputedStyle(el, p ?? null);
    return {
      name: cs.animationName,
      duration: cs.animationDuration,
      easing: cs.animationTimingFunction,
      delay: cs.animationDelay,
      iterations: cs.animationIterationCount,
    };
  }, pseudo);
}

/** The element's transform as [a, b, c, d, e, f] (2D), or null for none. */
async function matrix(loc: Locator) {
  return loc.evaluate((el) => {
    const t = getComputedStyle(el).transform;
    if (t === "none") return null;
    const d = new DOMMatrix(t);
    return [d.a, d.b, d.c, d.d, d.e, d.f].map((n) => Math.round(n * 1000) / 1000);
  });
}
const IDENTITY = [1, 0, 0, 1, 0, 0];
async function expectStill(loc: Locator) {
  const t = await matrix(loc);
  expect(t === null || t.join() === IDENTITY.join()).toBe(true);
}

async function open(page: Page, path: string, reduced = false) {
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  if (reduced) await expect(page.locator("html")).toHaveClass(/\bstill\b/);
}

/** Lets a hover or focus transition finish (the longest public one is 600ms). */
const settle = (page: Page, ms = 700) => page.waitForTimeout(ms);

/**
 * Scrolls the element in and waits until its section's reveal (M-REVEAL) has finished, so its own
 * transitions are back: the reveal holds them with `!important` for about 920ms.
 */
async function revealed(loc: Locator) {
  await loc.scrollIntoViewIfNeeded();
  await expect
    .poll(() => loc.evaluate((el) => el.closest(".rv-wait, .rv-run, [data-reveal-step]") === null), {
      timeout: 5000,
    })
    .toBe(true);
}

/** Answers every cross-origin document request (prototype and video frames) only when told to. */
async function holdFrames(page: Page) {
  const held: Route[] = [];
  await page.route(
    (url) => !/^(localhost|127\.0\.0\.1)$/.test(url.hostname),
    (route) => {
      if (route.request().resourceType() === "document") held.push(route);
      else void route.abort();
    },
  );
  return {
    seen: () => held.length > 0,
    release: async () => {
      for (const r of held.splice(0))
        await r.fulfill({ contentType: "text/html", body: "<!doctype html><title>stub</title>" });
    },
  };
}

/** Waits until nothing inside the element is animating (an entrance or reveal has landed). */
async function landed(loc: Locator) {
  await expect
    .poll(() =>
      loc.evaluate(
        (root) =>
          document.getAnimations().filter((a) => {
            const target = (a.effect as KeyframeEffect | null)?.target;
            return a.playState === "running" && target instanceof Node && root.contains(target);
          }).length,
      ),
    )
    .toBe(0);
}

/**
 * Moves the mouse onto the element in steps, as a hand would. A one-step jump from the corner leaves
 * the hero's tilt at its rest pose for a frame, which a hover check can catch mid-turn.
 */
async function pointAt(page: Page, loc: Locator) {
  await loc.scrollIntoViewIfNeeded();
  const box = await loc.boundingBox();
  if (!box) throw new Error("not visible");
  // From the corner, so a reload that left the mouse in place still gets a pointerenter.
  await page.mouse.move(1, 1);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
}

const explore = (page: Page) =>
  page
    .getByRole("button", { name: /^(Explore|Try) the prototype$/ })
    .filter({ visible: true })
    .first()
    .click();

// Playwright reads fixtures from a destructuring pattern; this hook needs none.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "laptop", "sets its own viewports; runs once");
});

test.describe("on load and scroll @1440", () => {
  test.use(LAPTOP);

  test("M-HERO-RISE: each line rises over .56s --eo, 80ms apart, once per session", async ({ page }) => {
    await open(page, "/");
    const lines = page.locator(`#hero ${m("rise")}`);
    await expect(lines).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const a = await animation(lines.nth(i));
      expect(a).toMatchObject({ name: "vaRise", duration: "0.56s", easing: EO });
      expect(parseFloat(a.delay)).toBeCloseTo(i * 0.08, 5);
    }
    // The hero sets the session key when it ends; the next view doesn't replay it.
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("va:intro"))).not.toBeNull();
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/\bno-intro\b/);
    expect((await animation(lines.first())).name).toBe("none");
  });

  test("M-HERO-RISE reduced: shown in place", async ({ page }) => {
    await open(page, "/", true);
    for (const el of await page.locator(`#hero ${m("rise")}`).all()) {
      expect((await animation(el)).name).toBe("none");
      await expect(el).toHaveCSS("opacity", "1");
    }
  });

  test("M-HERO-BRUSH: draws over 1.4s --eo after .4s; reduced: drawn from the start", async ({ page }) => {
    await open(page, "/");
    const stroke = page.locator(`#hero ${m("stroke")}`).first();
    expect(await animation(stroke)).toMatchObject({
      name: "vaInkDraw",
      duration: "1.4s",
      easing: EO,
      delay: "0.4s",
    });
    await open(page, "/", true);
    expect((await animation(stroke)).name).toBe("none");
    await expect(stroke).toHaveCSS("stroke-dasharray", "none");
  });

  test("M-REVEAL: below the fold waits 16px down, then rises over .56s --eo with the stagger", async ({
    page,
  }) => {
    await open(page, "/");
    const waiting = page.locator("main section.rv-wait").last();
    await expect(waiting).toHaveCount(1);
    const section = page.locator(`#${(await waiting.getAttribute("id")) ?? ""}`);
    const step1 = section.locator('[data-reveal-step="1"]').first();
    await expect(step1).toHaveCSS("opacity", "0");
    expect(await matrix(step1)).toEqual([1, 0, 0, 1, 0, 16]);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/\brv-run\b/);
    expect(await transitions(step1)).toMatchObject({
      opacity: { duration: "0.56s", easing: EO, delay: "0.08s" },
      transform: { duration: "0.56s", easing: EO, delay: "0.08s" },
    });
    const step0 = section.locator('[data-reveal-step="0"]').first();
    expect((await transitions(step0)).opacity?.delay).toBe("0s");
  });

  test("M-REVEAL reduced: nothing hides and nothing transitions", async ({ page }) => {
    await open(page, "/", true);
    await expect(page.locator(".rv-wait, .rv-run")).toHaveCount(0);
    await expect(page.locator("[data-reveal-step]")).toHaveCount(0);
  });

  test("M-SKILLS-REVEAL: every word rises over .56s --eo in five waves; reduced: in place", async ({
    page,
  }) => {
    await open(page, "/");
    const cloud = page.locator(`#skills ${m("cloud")}`).first();
    await cloud.scrollIntoViewIfNeeded();
    await expect(cloud).toHaveClass(/_go_/);
    const words = cloud.locator(m("cw"));
    const count = await words.count();
    const waves = new Set<number>();
    for (let i = 0; i < count; i++) {
      const word = words.nth(i);
      // --i5 is the word's place in the interleaved visual order, mod 5 (set inline).
      const i5 = Number(await word.evaluate((el) => getComputedStyle(el).getPropertyValue("--i5")));
      expect(i5).toBeGreaterThanOrEqual(0);
      expect(i5).toBeLessThan(5);
      expect(await animation(word)).toMatchObject({ name: "vaRise", duration: "0.56s", easing: EO });
      expect(parseFloat((await animation(word)).delay)).toBeCloseTo(i5 * 0.08, 5);
      waves.add(i5);
    }
    expect(waves.size).toBe(5);
    await open(page, "/", true);
    await cloud.scrollIntoViewIfNeeded();
    for (const word of (await cloud.locator(m("cw")).all()).slice(0, 7))
      expect((await animation(word)).name).toBe("none");
  });
});

test.describe("hero @1440", () => {
  test.use(LAPTOP);

  test("M-HERO-TILT: the panel tilts over .6s and the layers shift over .5s, both --eo", async ({ page }) => {
    await open(page, "/");
    const ink = page.locator(`#hero ${m("ink")}`).first();
    expect(await transitions(ink)).toMatchObject({ transform: { duration: "0.6s", easing: EO } });
    for (const layer of await page.locator(`#hero ${m("px")}`).all())
      expect(await transitions(layer)).toMatchObject({ transform: { duration: "0.5s", easing: EO } });
    const box = await page.locator("#hero").boundingBox();
    if (!box) throw new Error("no hero");
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + 40, box.y + 40);
    await expect
      .poll(() => ink.evaluate((el) => Number(getComputedStyle(el).getPropertyValue("--mx"))))
      .toBeLessThan(-0.5);
  });

  test("M-HERO-TILT reduced: the panel is flat and doesn't follow the pointer", async ({ page }) => {
    await open(page, "/", true);
    const ink = page.locator(`#hero ${m("ink")}`).first();
    const box = await page.locator("#hero").boundingBox();
    if (!box) throw new Error("no hero");
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + 40, box.y + 40);
    await settle(page);
    expect(
      await ink.evaluate((el) => {
        const t = getComputedStyle(el).transform;
        return t === "none" || new DOMMatrix(t).isIdentity;
      }),
    ).toBe(true);
  });

  test("M-HERO-FLOATERS: fade .7s ease, drift 6s linear, shadow .3s --eo; slot 0 leaves at 2.6s", async ({
    page,
  }) => {
    await page.clock.install();
    await open(page, "/");
    const card = page.locator(`#hero ${m("tz")}`).first();
    await expect(card).toHaveCount(1);
    expect(await transitions(card)).toMatchObject({
      opacity: { duration: "0.7s", easing: "ease" },
      transform: { duration: "6s", easing: "linear" },
      "box-shadow": { duration: "0.3s", easing: EO },
    });
    expect(await card.evaluate((el) => el.style.opacity)).toBe("1");
    await page.clock.runFor(2700);
    await expect.poll(() => card.evaluate((el) => el.style.opacity)).toBe("0");
  });

  test("M-HERO-FLOATERS reduced: the cards stand still at rest; nothing is scheduled", async ({ page }) => {
    await page.clock.install();
    await open(page, "/", true);
    // Every item is rendered once; the first three (Studio's default) stand at rest.
    const cards = page.locator(`#hero ${m("tz")}`);
    const shown = async () =>
      cards.evaluateAll(
        (els) =>
          els.filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).opacity === "1").length,
      );
    expect(await shown()).toBe(3);
    const before = await cards.evaluateAll((els) => els.map((el) => (el as HTMLElement).style.cssText));
    await page.clock.runFor(15_000);
    expect(await cards.evaluateAll((els) => els.map((el) => (el as HTMLElement).style.cssText))).toEqual(
      before,
    );
    expect(await shown()).toBe(3);
    for (const card of await cards.all())
      expect(Object.keys(await transitions(card))).toEqual(["box-shadow"]);
  });

  test("M-AVAIL-PULSE: 2.4s ease-in-out, forever; reduced: the dot only", async ({ page }) => {
    await open(page, "/");
    const dot = page.locator(`#hero ${m("live")}`).first();
    expect(await animation(dot)).toMatchObject({
      name: "vaPulse",
      duration: "2.4s",
      easing: "ease-in-out",
      iterations: "infinite",
    });
    await open(page, "/", true);
    expect((await animation(dot)).name).toBe("none");
  });
});

test.describe("hero @834 and @390, touch", () => {
  for (const [name, device] of [
    ["iPad", IPAD],
    ["phone", PHONE],
  ] as const) {
    test.describe(name, () => {
      test.use(device);

      test(`M-HERO-DRIFT: the panel sways over 9s ease-in-out; reduced: still (${name})`, async ({
        page,
      }) => {
        await open(page, "/");
        const ink = page.locator(`#hero ${m("ink")}`).first();
        expect(await animation(ink)).toMatchObject({
          name: "vaInkDrift",
          duration: "9s",
          easing: "ease-in-out",
          iterations: "infinite",
        });
        await open(page, "/", true);
        expect((await animation(ink)).name).toBe("none");
      });
    });
  }
});

test.describe("navigation and controls @1440", () => {
  test.use(LAPTOP);

  test("M-NAV-RING: the ring turns every 3.5s, linear; reduced: it stands still", async ({ page }) => {
    await open(page, "/");
    const nav = page.locator(`nav${m("nav")}`).first();
    for (const pseudo of ["::before", "::after"])
      expect(await animation(nav, pseudo)).toMatchObject({
        name: "navShimmer",
        duration: "3.5s",
        easing: "linear",
        iterations: "infinite",
      });
    expect(await transitions(nav)).toMatchObject({ "box-shadow": { duration: "0.4s", easing: "ease" } });
    await open(page, "/", true);
    for (const pseudo of ["::before", "::after"]) expect((await animation(nav, pseudo)).name).toBe("none");
  });

  test("M-NAV-LINK: all .22s, copied verbatim; the same under reduced motion", async ({ page }) => {
    for (const reduced of [false, true]) {
      await open(page, "/", reduced);
      const link = page.locator(m("nl")).first();
      expect(await transitions(link)).toEqual({ all: { duration: "0.22s", easing: "ease", delay: "0s" } });
      await link.hover();
      await settle(page, 300);
      await expect(link).toHaveCSS("color", "rgb(240, 238, 248)");
    }
  });

  test("M-NAV-PILL: slides left and width over .32s on the spring; reduced: it jumps", async ({ page }) => {
    await open(page, "/");
    const pill = page.locator(m("pill")).first();
    expect(await transitions(pill)).toMatchObject({
      left: { duration: "0.32s", easing: SPRING },
      width: { duration: "0.32s", easing: SPRING },
    });
    await open(page, "/", true);
    expect(await transitionSeconds(pill)).toBe(0);
  });

  test("M-NAV-CONTACT: Let's Talk scales to 1.04 on hover; reduced: colour only", async ({ page }) => {
    await open(page, "/");
    const talk = page.locator(`nav ${m("contact")}`).first();
    expect(await transitions(talk)).toMatchObject({
      background: { duration: "0.22s" },
      transform: { duration: "0.22s" },
      "font-weight": { duration: "0.15s" },
      "box-shadow": { duration: "0.3s" },
    });
    await pointAt(page, talk);
    await settle(page, 400);
    expect((await matrix(talk))?.[0]).toBeCloseTo(1.04, 3);
    await open(page, "/", true);
    await pointAt(page, talk);
    await settle(page, 400);
    await expectStill(talk);
    await expect(talk).toHaveCSS("background-color", "rgb(255, 77, 94)");
  });

  test("M-CTA: lifts 2px over .2s --eo; reduced: colour only", async ({ page }) => {
    await open(page, "/");
    const cta = page.locator(`#hero a${m("cta")}`).first();
    expect(await transitions(cta)).toMatchObject({
      "background-color": { duration: "0.2s", easing: EO },
      transform: { duration: "0.2s", easing: EO },
    });
    await pointAt(page, cta);
    await settle(page, 400);
    expect(await matrix(cta)).toEqual([1, 0, 0, 1, 0, -2]);
    await open(page, "/", true);
    await pointAt(page, cta);
    await settle(page, 400);
    await expectStill(cta);
    await expect(cta).toHaveCSS("background-color", "rgb(228, 42, 63)");
  });

  test("M-BTN2: the border changes over .2s --eo, under reduced motion too", async ({ page }) => {
    for (const reduced of [false, true]) {
      await open(page, "/", reduced);
      const btn = page.locator(`#hero ${m("cta2")}`).first();
      expect(await transitions(btn)).toEqual({
        "border-color": { duration: "0.2s", easing: EO, delay: "0s" },
      });
    }
  });

  test("M-TESTI-PAGE: the cards fade out over 200ms, then in with the 80ms stagger", async ({ page }) => {
    await page.clock.install();
    await open(page, "/");
    const section = page.locator("#testimonials");
    await section.scrollIntoViewIfNeeded();
    // The reveal's clean-up runs on the mocked clock too.
    await expect
      .poll(async () => {
        await page.clock.runFor(200);
        return section.evaluate((el) => el.querySelector("[data-reveal-step]") === null);
      })
      .toBe(true);
    await section.getByRole("button", { name: "Next testimonials" }).click();
    const card = section.locator(`${m("out")} ${m("card")}`).first();
    expect(await transitions(card)).toMatchObject({ opacity: { duration: "0.2s", easing: EO } });
    await page.clock.runFor(250);
    const cards = section.locator(`${m("in")} ${m("card")}`);
    await expect(cards.first()).toHaveCount(1);
    for (let k = 0; k < 3; k++) {
      expect(await animation(cards.nth(k))).toMatchObject({ name: "csFade", duration: "0.2s", easing: EO });
      expect(parseFloat((await animation(cards.nth(k))).delay)).toBeCloseTo(k * 0.08, 5);
    }
  });

  test("M-TESTI-PAGE reduced: the page swaps at once", async ({ page }) => {
    await open(page, "/", true);
    const section = page.locator("#testimonials");
    await section.scrollIntoViewIfNeeded();
    await section.getByRole("button", { name: "Next testimonials" }).click();
    await expect(section.locator(m("out"))).toHaveCount(0);
    for (const card of await section.locator(m("card")).filter({ visible: true }).all()) {
      expect((await animation(card)).name).toBe("none");
      await expect(card).toHaveCSS("opacity", "1");
    }
  });

  test("M-SKILLS-FOCUS: colour and opacity over .2s --eo; the same under reduced motion", async ({
    page,
  }) => {
    for (const reduced of [false, true]) {
      await open(page, "/", reduced);
      const cloud = page.locator(`#skills ${m("cloud")}`).first();
      await cloud.scrollIntoViewIfNeeded();
      await landed(cloud);
      const word = cloud.locator(`li${m("cw")}`).first();
      expect(await transitions(word)).toMatchObject({
        opacity: { duration: "0.2s", easing: EO },
        color: { duration: "0.2s", easing: EO },
      });
      const group = cloud.locator(`${m("g")} button`).first();
      expect(await transitions(group)).toMatchObject({
        color: { duration: "0.2s", easing: EO },
        "-webkit-text-stroke-color": { duration: "0.2s", easing: EO },
      });
      await pointAt(page, group);
      await expect(cloud).toHaveClass(/_lit_/);
      await settle(page, 400);
      const dimmed = cloud.locator(`li${m("cw")}:not([class*="_on_"])`).first();
      await expect(dimmed).toHaveCSS("opacity", "0.16");
    }
  });

  test("M-OFF-PANEL: lifts over .32s, caption shadow .32s, art and lines .5s; reduced: none", async ({
    page,
  }) => {
    await open(page, "/");
    const panel = page.locator(`#offduty article${m("op")}`).first();
    await revealed(panel);
    expect(await transitions(panel)).toMatchObject({ transform: { duration: "0.32s", easing: EO } });
    expect(await transitions(panel.locator(m("cap")).first())).toMatchObject({
      "box-shadow": { duration: "0.32s", easing: EO },
    });
    expect(await transitions(panel.locator(`svg${m("sl")}`).first())).toMatchObject({
      transform: { duration: "0.5s", easing: EO },
    });
    await panel.hover();
    await settle(page);
    expect(await matrix(panel)).toEqual([1, 0, 0, 1, 0, -4]);

    await open(page, "/", true);
    await panel.scrollIntoViewIfNeeded();
    expect(await transitionSeconds(panel)).toBe(0);
    await panel.hover();
    await expectStill(panel);
  });

  test("M-OFF-SPINE: a spine lifts 4px over .32s --eo; reduced: none", async ({ page }) => {
    await open(page, "/");
    const spine = page.locator(`#offduty li${m("sp")}`).first();
    await revealed(spine);
    expect(await transitions(spine)).toMatchObject({ transform: { duration: "0.32s", easing: EO } });
    await spine.hover();
    await settle(page);
    expect(await matrix(spine)).toEqual([1, 0, 0, 1, 0, -4]);
    await open(page, "/", true);
    await spine.scrollIntoViewIfNeeded();
    expect(await transitionSeconds(spine)).toBe(0);
    await spine.hover();
    await expectStill(spine);
  });
});

test.describe("cards and lists @1440", () => {
  test.use(LAPTOP);

  test("M-CARD: lift .32s, cover zoom .6s, arrow .24s, all --eo; reduced: border only", async ({ page }) => {
    await open(page, "/");
    const card = page
      .locator(`a${m("card")}`)
      .filter({ has: page.locator(m("go")) })
      .first();
    await revealed(card);
    expect(await transitions(card)).toMatchObject({
      transform: { duration: "0.32s", easing: EO },
      "border-color": { duration: "0.32s", easing: EO },
    });
    const cover = card.locator(m("cv")).first();
    const arrow = card.locator(m("go")).first();
    expect(await transitions(cover)).toMatchObject({ transform: { duration: "0.6s", easing: EO } });
    expect(await transitions(arrow)).toMatchObject({ transform: { duration: "0.24s", easing: EO } });
    await pointAt(page, card);
    await settle(page);
    expect(await matrix(card)).toEqual([1, 0, 0, 1, 0, -4]);
    expect((await matrix(cover))?.[0]).toBeCloseTo(1.03, 3);
    expect(await matrix(arrow)).toEqual([1, 0, 0, 1, 4, 0]);

    await open(page, "/", true);
    await page.mouse.move(1, 1);
    await card.scrollIntoViewIfNeeded();
    const border = await card.evaluate((el) => getComputedStyle(el).borderColor);
    expect(Object.keys(await transitions(card))).toEqual(["border-color"]);
    await pointAt(page, card);
    await settle(page, 500);
    await expectStill(card);
    await expectStill(cover);
    await expectStill(arrow);
    expect(await card.evaluate((el) => getComputedStyle(el).borderColor)).not.toBe(border);
  });

  test("M-ROW: rows fill over .2s, the All work tile over .32s with no lift; reduced: colour only", async ({
    page,
  }) => {
    for (const reduced of [false, true]) {
      await open(page, "/work/", reduced);
      const row = page.locator(`main a${m("row")}`).first();
      expect(await transitions(row)).toMatchObject({ "background-color": { duration: "0.2s", easing: EO } });
      await open(page, "/", reduced);
      const tile = page.locator(`a${m("tile")}`).first();
      await revealed(tile);
      expect(await transitions(tile)).toEqual({
        "border-color": { duration: "0.32s", easing: EO, delay: "0s" },
        "background-color": { duration: "0.32s", easing: EO, delay: "0s" },
      });
      await tile.hover();
      await settle(page, 500);
      await expectStill(tile);
    }
  });

  test("M-COVER-SCAN isn't built in V0 (D16): nothing animates vaScan", async ({ page }) => {
    await open(page, "/");
    const scanning = await page.evaluate(() =>
      document.getAnimations().filter((a) => a instanceof CSSAnimation && a.animationName === "vaScan"),
    );
    expect(scanning).toHaveLength(0);
  });

  test("M-IMG-FADE: the sheen runs 1.6s linear while loading, then the image fades in over .32s --eo", async ({
    page,
  }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((r) => (release = r));
    await page.route(/\/media\/v0\/.*\.webp$/, async (route: Route) => {
      await held;
      await route.continue();
    });
    await page.goto("/");
    const card = page.locator(`a${m("card")}${m("std")}`).first();
    await card.scrollIntoViewIfNeeded();
    const shim = card.locator(m("shim")).first();
    await expect(shim).toHaveCount(1);
    expect(await animation(shim)).toMatchObject({
      name: "psShim",
      duration: "1.6s",
      easing: "linear",
      iterations: "infinite",
    });
    const img = card.locator("img").first();
    await expect(img).toHaveCSS("opacity", "0");
    expect(await transitions(img)).toMatchObject({ opacity: { duration: "0.32s", easing: EO } });
    release();
    await expect(shim).toHaveCount(0);
    await expect(img).toHaveCSS("opacity", "1");
  });

  test("M-IMG-FADE reduced: no sheen and no fade", async ({ page }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((r) => (release = r));
    await page.route(/\/media\/v0\/.*\.webp$/, async (route: Route) => {
      await held;
      await route.continue();
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page.locator(`a${m("card")}${m("std")}`).first();
    await card.scrollIntoViewIfNeeded();
    const shim = card.locator(m("shim")).first();
    await expect(shim).toHaveCount(1);
    expect((await animation(shim)).name).toBe("none");
    expect(await transitionSeconds(card.locator("img").first())).toBe(0);
    release();
  });

  test("the case study's cover is the LCP image: high priority, never waiting for hydration", async ({
    page,
  }) => {
    await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
    await page.goto(CASE);
    const cover = page.locator("img[data-lcp]");
    await expect(cover).toHaveAttribute("fetchpriority", "high");
    await expect(cover).toHaveAttribute("loading", "eager");
    await expect(cover).toHaveCSS("opacity", "1");
  });
});

test.describe("reading @1440", () => {
  test.use(LAPTOP);

  test("M-READ-PROGRESS: the bar follows the scroll with no easing, under reduced motion too", async ({
    page,
  }) => {
    for (const reduced of [false, true]) {
      await open(page, CASE, reduced);
      const fill = page.locator(`${m("progress")} > span`).first();
      expect(await transitionSeconds(fill)).toBe(0);
      await page.evaluate(() => {
        scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: "instant" });
      });
      await expect.poll(async () => (await matrix(fill))?.[0] ?? 0).toBeGreaterThan(0.1);
    }
  });

  test("M-CHAPTER-RAIL: the marker slides over .24s --eo and the text colour over .2s; reduced: it jumps", async ({
    page,
  }) => {
    await open(page, CASE);
    const rail = page.getByRole("navigation", { name: "Chapters" }).filter({ visible: true });
    const marker = rail.locator(m("marker"));
    expect(await transitions(marker)).toEqual({ transform: { duration: "0.24s", easing: EO, delay: "0s" } });
    const link = rail.locator("a").first();
    expect(await transitions(link)).toMatchObject({ color: { duration: "0.2s", easing: EO } });
    await open(page, CASE, true);
    expect(await transitionSeconds(marker)).toBe(0);
    expect(await transitions(link)).toMatchObject({ color: { duration: "0.2s", easing: EO } });
  });

  test("M-PROTO: the spinner turns every .8s, then the frame fades in over .32s --eo", async ({ page }) => {
    const frames = await holdFrames(page);
    await open(page, PROTO);
    await explore(page);
    const spin = page.locator(m("spin")).filter({ visible: true }).first();
    expect(await animation(spin)).toMatchObject({
      name: "psSpin",
      duration: "0.8s",
      easing: "linear",
      iterations: "infinite",
    });
    await expect.poll(frames.seen).toBe(true);
    await frames.release();
    const iframe = page.locator(`iframe${m("iframe")}`).first();
    await expect(iframe).not.toHaveAttribute("data-state", "loading");
    expect(await animation(iframe)).toMatchObject({ name: "csFade", duration: "0.32s", easing: EO });
  });

  test("M-PROTO reduced: the spinner turns every 2.4s, and there's no fade", async ({ page }) => {
    const frames = await holdFrames(page);
    await open(page, PROTO, true);
    await explore(page);
    const spin = page.locator(m("spin")).filter({ visible: true }).first();
    expect((await animation(spin)).duration).toBe("2.4s");
    await expect.poll(frames.seen).toBe(true);
    await frames.release();
    const iframe = page.locator(`iframe${m("iframe")}`).first();
    await expect(iframe).not.toHaveAttribute("data-state", "loading");
    expect((await animation(iframe)).name).toBe("none");
  });
});

test.describe("phone @390", () => {
  test.use(PHONE);

  test("M-NAV-MENU: the sheet fades in over .24s, the links rise .56s 80ms apart, Let's Talk at .32s", async ({
    page,
  }) => {
    await open(page, "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Site menu" });
    await expect(menu).toBeVisible();
    expect(await animation(menu)).toMatchObject({ name: "mmIn", duration: "0.24s", easing: EO });
    const links = menu.locator(`nav a${m("l")}`);
    const count = Math.min(await links.count(), 5);
    for (let i = 0; i < count; i++) {
      const a = await animation(links.nth(i));
      expect(a).toMatchObject({ name: "mmRise", duration: "0.56s", easing: EO });
      expect(parseFloat(a.delay)).toBeCloseTo(i * 0.08, 5);
    }
    expect(await animation(menu.locator(m("cta")).first())).toMatchObject({
      name: "mmRise",
      duration: "0.56s",
      delay: "0.32s",
    });
  });

  test("M-NAV-MENU reduced: no animation", async ({ page }) => {
    await open(page, "/", true);
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Site menu" });
    expect((await animation(menu)).name).toBe("none");
    for (const a of await menu.locator(`nav a${m("l")}`).all())
      expect((await animation(a)).name).toBe("none");
    expect((await animation(menu.locator(m("cta")).first())).name).toBe("none");
  });

  test("M-ACCORDION: the plus turns 45° over .2s --eo and the content fades in; reduced: neither", async ({
    page,
  }) => {
    await open(page, "/");
    const first = page.locator(`#experience button${m("acc")}[aria-expanded="false"]`).first();
    const row = page.locator(
      `#experience button[aria-controls="${(await first.getAttribute("aria-controls")) ?? ""}"]`,
    );
    await revealed(row);
    const icon = row.locator(m("icon")).first();
    expect(await transitions(icon)).toEqual({ transform: { duration: "0.2s", easing: EO, delay: "0s" } });
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(`[id="${(await row.getAttribute("aria-controls")) ?? ""}"]`);
    expect(await animation(panel)).toMatchObject({ name: "csFade", duration: "0.2s", easing: EO });
    await settle(page, 400);
    const turn = await matrix(icon);
    expect(Math.round((Math.atan2(turn?.[1] ?? 0, turn?.[0] ?? 1) * 180) / Math.PI)).toBe(45);

    await open(page, "/", true);
    await row.scrollIntoViewIfNeeded();
    expect(await transitionSeconds(row.locator(m("icon")).first())).toBe(0);
    await row.click();
    expect(
      (await animation(page.locator(`[id="${(await row.getAttribute("aria-controls")) ?? ""}"]`))).name,
    ).toBe("none");
  });

  test("M-TESTI-PAGE: snap scrolling, and the active dot widens over .2s --eo; reduced: instant", async ({
    page,
  }) => {
    await open(page, "/");
    const section = page.locator("#testimonials");
    await section.scrollIntoViewIfNeeded();
    const rail = section.getByRole("region", { name: "Testimonials" });
    await expect(rail).toHaveCSS("scroll-snap-type", "x mandatory");
    const dot = section.getByRole("button", { name: /Show testimonial 1 of/ });
    expect(await transitions(dot, "::before")).toMatchObject({
      width: { duration: "0.2s", easing: EO },
      "background-color": { duration: "0.2s", easing: EO },
    });
    await open(page, "/", true);
    await section.scrollIntoViewIfNeeded();
    expect(await transitionSeconds(dot, "::before")).toBe(0);
    await expect(rail).toHaveCSS("scroll-behavior", "auto");
  });

  test("M-CHAPTER-SHEET: the sheet drops in over .26s --eo and the chevron turns over .2s", async ({
    page,
  }) => {
    await open(page, CASE);
    const bar = page.getByRole("button", { name: "Jump to chapter" });
    await bar.scrollIntoViewIfNeeded();
    const chev = bar.locator(m("chev"));
    expect(await transitions(chev)).toEqual({ transform: { duration: "0.2s", easing: EO, delay: "0s" } });
    await bar.click();
    const sheet = page.locator(`nav${m("sheet")}`).filter({ visible: true });
    await expect(sheet).toBeVisible();
    const a = await animation(sheet);
    expect(a.name).toMatch(/csDown/);
    expect(a).toMatchObject({ duration: "0.26s", easing: EO });
  });

  test("M-CHAPTER-SHEET reduced: no animation and no chevron transition", async ({ page }) => {
    await open(page, CASE, true);
    const bar = page.getByRole("button", { name: "Jump to chapter" });
    await bar.scrollIntoViewIfNeeded();
    expect(await transitionSeconds(bar.locator(m("chev")))).toBe(0);
    await bar.click();
    const sheet = page.locator(`nav${m("sheet")}`).filter({ visible: true });
    await expect(sheet).toBeVisible();
    expect((await animation(sheet)).name).toBe("none");
  });

  test("M-PROTO on phones: the prototype sheet rises over .3s --eo; reduced: no rise", async ({ page }) => {
    await holdFrames(page);
    for (const reduced of [false, true]) {
      await open(page, PROTO, reduced);
      await explore(page);
      const sheet = page.locator(m("sheet")).filter({ visible: true }).first();
      await expect(sheet).toBeVisible();
      const a = await animation(sheet);
      if (reduced) expect(a.name).toBe("none");
      else expect(a).toMatchObject({ name: "csUp", duration: "0.3s", easing: EO });
    }
  });
});

test.describe("catalogue (dev server) @1440", () => {
  test.use(LAPTOP);

  async function catalogue(page: Page, reduced = false) {
    if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${DEV}/dev/components`);
    await expect(page.getByText("C20 · Lightbox").first()).toBeVisible({ timeout: 30_000 });
  }

  test("M-VIDEO: the spinner shows until the player loads; reduced: the slower spinner", async ({ page }) => {
    await holdFrames(page);
    for (const reduced of [false, true]) {
      await catalogue(page, reduced);
      const play = page.getByRole("button", { name: /^Play the video/ }).first();
      await play.scrollIntoViewIfNeeded();
      await play.click();
      const spin = page.locator(m("spin")).filter({ visible: true }).first();
      await expect(spin).toBeVisible();
      expect(await animation(spin)).toMatchObject({
        name: "psSpin",
        duration: reduced ? "2.4s" : "0.8s",
        easing: "linear",
        iterations: "infinite",
      });
    }
  });

  test("M-LIGHTBOX: the backdrop fades over .2s, the image over .32s from .98; reduced: instant", async ({
    page,
  }) => {
    for (const reduced of [false, true]) {
      await catalogue(page, reduced);
      const thumb = page.getByRole("button", { name: /^Enlarge image 1 of/ });
      await thumb.scrollIntoViewIfNeeded();
      await thumb.click();
      const dialog = page.getByRole("dialog", { name: "Enlarged image" });
      await expect(dialog).toBeVisible();
      const backdrop = page.locator(m("backdrop")).filter({ visible: true }).first();
      const frame = page.locator(m("frame")).filter({ visible: true }).first();
      if (reduced) {
        expect((await animation(backdrop)).name).toBe("none");
        expect((await animation(frame)).name).toBe("none");
      } else {
        expect(await animation(backdrop)).toMatchObject({ name: "csFade", duration: "0.2s", easing: EO });
        expect(await animation(frame)).toMatchObject({ name: "lbIn", duration: "0.32s", easing: EO });
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(thumb).toBeFocused();
    }
  });
});

/**
 * Studio (04 · Studio): the M-ST-* table. Studio runs on the dev server with the memory repo's test
 * owner, as studio.spec.ts does. Transitions are read from live elements. Keyframe motion that only
 * shows for a moment (entrances, spinners, skeletons, flashes, rings) is read from every style rule
 * that uses the keyframe: a probe element with that rule's classes, inside Studio's root, gives the
 * computed values, with and without reduced motion.
 */
test.describe("Studio (dev server) @1440", () => {
  test.use(LAPTOP);
  const OWNER = "owner@example.test";
  const CODE = process.env.STUDIO_CODE ?? "12345678";
  const EDIT = "/studio/projects/puja-engagement-platform";

  async function signIn(page: Page, reduced = false) {
    if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${DEV}/studio/login`);
    await page.getByLabel("Email").fill(OWNER, { timeout: 30_000 });
    await page.getByRole("button", { name: "Email me a code" }).click();
    const code = page.getByRole("group", { name: /digit code/ });
    await expect(code).toBeVisible({ timeout: 15_000 });
    await code.locator("input").first().focus();
    await page.keyboard.type(CODE);
    await page.waitForURL(/\/studio\/?$/, { timeout: 20_000 });
  }

  async function screen(page: Page, path: string) {
    await page.goto(`${DEV}${path}`);
    await expect(page.locator("h1").filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState("load");
  }

  /** Every loaded rule that runs `keyframe`, probed as an element inside `.st`. */
  async function keyframeUsers(page: Page, keyframe: string) {
    return page.evaluate((name) => {
      const root = document.querySelector(".st") ?? document.body;
      const found = new Map<string, Anim & { selector: string }>();
      const visit = (rules: CSSRuleList) => {
        for (const rule of rules) {
          if (!(rule instanceof CSSStyleRule)) continue;
          // A shorthand with var() leaves the longhands empty in the CSSOM, so read the rule's text.
          if (!new RegExp(`animation[^;]*\\b${name}\\b`).test(rule.style.cssText)) continue;
          for (const selector of rule.selectorText.split(",")) {
            const last =
              selector
                .trim()
                .split(/[\s>+~]+/)
                .pop() ?? "";
            if (/[:[]/.test(last)) continue; // states and attributes: covered by their base rule
            const classes = [...last.matchAll(/\.([\w-]+)/g)].map((x) => x[1] ?? "");
            if (classes.length === 0 || found.has(classes.join("."))) continue;
            const probe = document.createElement("div");
            probe.className = classes.join(" ");
            root.append(probe);
            const cs = getComputedStyle(probe);
            found.set(classes.join("."), {
              selector: selector.trim(),
              name: cs.animationName,
              duration: cs.animationDuration,
              easing: cs.animationTimingFunction,
              delay: cs.animationDelay,
              iterations: cs.animationIterationCount,
            });
            probe.remove();
          }
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          visit(sheet.cssRules);
        } catch {
          // A cross-origin sheet (fonts): nothing of ours.
        }
      }
      return [...found.values()];
    }, keyframe);
  }

  test("M-ST-ENTER: every entrance rises over .22s --eo; reduced: none", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      for (const path of ["/studio/projects", `${EDIT}/story`, "/studio/media"]) {
        await screen(page, path);
        const users = await keyframeUsers(page, "stUp");
        expect(users.length).toBeGreaterThan(0);
        for (const u of users)
          expect(u, u.selector).toMatchObject(
            reduced ? { name: "none" } : { name: "stUp", duration: "0.22s", easing: EO },
          );
      }
    }
  });

  test("M-ST-ENTER: Draft preview's share popover enters at .22s --eo; reduced: none", async ({ page }) => {
    // The board draws popovers at .18s; 04 builds every entrance at .22s --eo (D20).
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, "/studio/preview/project/puja-engagement-platform");
      const users = await keyframeUsers(page, "stUp");
      expect(users.length).toBeGreaterThan(0);
      for (const u of users)
        expect(u, u.selector).toMatchObject(
          reduced ? { name: "none" } : { name: "stUp", duration: "0.22s", easing: EO },
        );
    }
  });

  test("M-ST-FLASH: a RICE row a fix changed flashes 1.2s ease-out; reduced: none", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, `${EDIT}/story`);
      // The story tab's own flash classes (a CSS module), beside Studio's global 1s .flashA/.flashB.
      for (const keyframe of ["stFlashA", "stFlashB"]) {
        const block = (await keyframeUsers(page, keyframe)).filter((u) => /\._flash[AB]_/.test(u.selector));
        expect(block.length, keyframe).toBeGreaterThan(0);
        for (const u of block)
          expect(u, u.selector).toMatchObject(
            reduced
              ? { name: "none" }
              : { name: keyframe, duration: "1.2s", easing: "ease-out", iterations: "1" },
          );
      }
    }
  });

  test("M-ST-FLASH and M-ST-RING: a moved row flashes 1s, a keyboard move rings 1.1s, both ease-out", async ({
    page,
  }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, "/studio/projects");
      for (const [keyframe, duration] of [
        ["stFlashA", "1s"],
        ["stFlashB", "1s"],
        ["stRingA", "1.1s"],
        ["stRingB", "1.1s"],
      ] as const) {
        const users = await keyframeUsers(page, keyframe);
        expect(users.length, keyframe).toBeGreaterThan(0);
        for (const u of users)
          expect(u, u.selector).toMatchObject(
            // Nothing flashes under reduced motion (04 · Ground rules 1).
            reduced ? { name: "none" } : { name: keyframe, duration, easing: "ease-out", iterations: "1" },
          );
      }
    }
  });

  test("M-ST-SPIN: spinners turn every .8s, linear; reduced: every 2.4s", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      for (const path of ["/studio/projects", `${EDIT}/settings`]) {
        await screen(page, path);
        const users = await keyframeUsers(page, "stSpin");
        expect(users.length).toBeGreaterThan(0);
        for (const u of users)
          expect(u, u.selector).toMatchObject({
            name: "stSpin",
            duration: reduced ? "2.4s" : "0.8s",
            easing: "linear",
            iterations: "infinite",
          });
      }
    }
  });

  test("M-ST-SHIM: skeletons shimmer 1.3s linear; reduced: static", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, "/studio");
      const users = await keyframeUsers(page, "stShim");
      expect(users.length).toBeGreaterThan(0);
      for (const u of users)
        expect(u, u.selector).toMatchObject(
          reduced
            ? { name: "none" }
            : { name: "stShim", duration: "1.3s", easing: "linear", iterations: "infinite" },
        );
    }
  });

  test("M-ST-PULSE isn't built: nothing runs stPulse", async ({ page }) => {
    await signIn(page);
    for (const path of ["/studio", `${EDIT}/story`, `${EDIT}/overview`]) {
      await screen(page, path);
      expect(await keyframeUsers(page, "stPulse")).toEqual([]);
    }
  });

  test("M-ST-BTN: the primary button fills over .2s --eo; reduced: none", async ({ page }) => {
    for (const reduced of [false, true]) {
      if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${DEV}/studio/login`);
      const btn = page.locator(`button${m("pbtn")}`).first();
      await expect(btn).toBeVisible({ timeout: 30_000 });
      if (reduced) expect(await transitionSeconds(btn)).toBe(0);
      else
        expect(await transitions(btn)).toEqual({
          "background-color": { duration: "0.2s", easing: EO, delay: "0s" },
        });
    }
  });

  test("M-ST-ROW and M-ST-SWITCH: rows fill over .15s; the switch track and knob move over .15s", async ({
    page,
  }) => {
    await signIn(page);
    await screen(page, "/studio");
    // The dashboard's "needs your input" rows.
    const row = page.locator('main a[href^="/studio/projects/"]').first();
    await expect(row).toBeVisible();
    expect(await transitions(row)).toMatchObject({
      "background-color": { duration: "0.15s" },
    });
    await screen(page, "/studio/website");
    expect(await transitions(page.locator(`div${m("tr")}`).first())).toMatchObject({
      "background-color": { duration: "0.15s" },
    });
    expect(await transitions(page.locator(m("trk")).first())).toMatchObject({
      background: { duration: "0.15s" },
    });
    expect(await transitions(page.locator(m("knb")).first())).toMatchObject({ left: { duration: "0.15s" } });
  });

  test("M-ST-DRAG: a project row lifts over .18s", async ({ page }) => {
    await signIn(page);
    await screen(page, "/studio/projects");
    expect(await transitions(page.locator(m("prow")).first())).toMatchObject({
      "box-shadow": { duration: "0.18s" },
      transform: { duration: "0.18s" },
      "background-color": { duration: "0.18s" },
    });
  });

  test("M-ST-BLOCK: chapters and blocks change over .15s and .18s; reduced: none", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, `${EDIT}/story`);
      const chapter = page.locator(m("chr")).first();
      const block = page.locator(`article${m("blk")}`).first();
      if (reduced) {
        expect(await transitionSeconds(chapter)).toBe(0);
        expect(await transitionSeconds(block)).toBe(0);
      } else {
        expect(await transitions(chapter)).toMatchObject({
          "background-color": { duration: "0.15s" },
          "box-shadow": { duration: "0.18s" },
        });
        expect(await transitions(block)).toMatchObject({
          "box-shadow": { duration: "0.18s" },
          "border-color": { duration: "0.18s" },
        });
      }
    }
  });

  /**
   * A CSS-module class's transitions, read from a probe element inside `.st`, or null until the
   * module's stylesheet is loaded. For parts a screen draws only in some states.
   */
  async function ruleTransitions(page: Page, local: string) {
    return page.evaluate((name) => {
      const cls = (() => {
        for (const sheet of document.styleSheets) {
          let rules: CSSRuleList;
          try {
            rules = sheet.cssRules;
          } catch {
            continue;
          }
          for (const rule of rules) {
            if (!(rule instanceof CSSStyleRule)) continue;
            const hit = new RegExp(`\\.(_${name}_[\\w-]+)$`).exec(rule.selectorText.trim());
            if (hit) return hit[1];
          }
        }
        return null;
      })();
      if (!cls) return null;
      const probe = document.createElement("input");
      probe.className = cls;
      (document.querySelector(".st") ?? document.body).append(probe);
      const cs = getComputedStyle(probe);
      const out = {
        property: cs.transitionProperty,
        duration: cs.transitionDuration,
        easing: cs.transitionTimingFunction,
      };
      probe.remove();
      return out;
    }, local);
  }

  test("M-ST-TOPIC-ADD: the + Add field grows over .2s --eo; reduced: none", async ({ page }) => {
    for (const reduced of [false, true]) {
      await signIn(page, reduced);
      await screen(page, `${EDIT}/overview`);
      // The picker draws "+ Add" only while the vocabulary fits as chips (CHIP_LIMIT); a larger one,
      // loaded a moment later, swaps in the search popover. So the field's rule is read once the
      // picker's stylesheet is in, whichever layout shows, and the live field too when it's there.
      await expect.poll(() => ruleTransitions(page, "tpadd"), { timeout: 30_000 }).not.toBeNull();
      const rule = await ruleTransitions(page, "tpadd");
      if (reduced) expect(rule?.duration).toBe("0s");
      else expect(rule).toEqual({ property: "width", duration: "0.2s", easing: EO });
      const field = page.getByRole("textbox", { name: "Add a topic" });
      if ((await field.count()) > 0) {
        if (reduced) expect(await transitionSeconds(field.first())).toBe(0);
        else
          expect(await transitions(field.first())).toEqual({
            width: { duration: "0.2s", easing: EO, delay: "0s" },
          });
      }
    }
  });

  test("M-ST-CROP, M-ST-CARD and M-ST-UPLOAD: the handle .18s, the outcome card .18s, the bar .12s linear", async ({
    page,
  }) => {
    await signIn(page);
    await screen(page, `${EDIT}/visuals`);
    expect(await transitions(page.locator(m("fp")).first())).toMatchObject({
      left: { duration: "0.18s" },
      top: { duration: "0.18s" },
    });
    await screen(page, `${EDIT}/outcomes`);
    expect(await transitions(page.locator(`article${m("mc")}`).first())).toMatchObject({
      "border-color": { duration: "0.18s" },
    });
    await screen(page, "/studio/media");
    const bar = page.locator(`${m("bar")} span`).first();
    expect(await transitions(bar)).toEqual({ width: { duration: "0.12s", easing: "linear", delay: "0s" } });
  });

  test("M-ST-FRAME: the device-frame preview resizes over .2s", async ({ page }) => {
    await signIn(page);
    await screen(page, "/studio/projects/arcana-workspace/visuals");
    expect(await transitions(page.locator(m("frameBox")).first())).toMatchObject({
      width: { duration: "0.2s" },
      height: { duration: "0.2s" },
      "border-radius": { duration: "0.2s" },
    });
  });
});
