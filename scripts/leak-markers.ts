/**
 * The no-leaks markers (08 · Drafts never leak, step 1), shared by the data-level test
 * (supabase/tests/no-leaks.test.ts) and the build-level seed (scripts/seed-leak-markers.ts), so both
 * check the same things. On top of a seeded V0 schema it adds a marker string in every place a
 * visitor must never see, publishes the live parts through pm-publish's own handler, makes a preview
 * link, and returns a manifest of what to look for and where.
 */
import type { Post, Profile, Project, SiteLayout } from "../src/lib/types";
import type { Deps } from "../supabase/functions/_shared/deps.ts";
import { previewHandler } from "../supabase/functions/_shared/preview.ts";
import { publishHandler } from "../supabase/functions/_shared/publish.ts";

export const LEAK = "LEAK-7f3a";
export const LEAK_IDS = {
  draft: "60000000-0000-4000-8000-000000000001",
  unlisted: "60000000-0000-4000-8000-000000000002",
  scheduled: "60000000-0000-4000-8000-000000000003",
  livePost: "60000000-0000-4000-8000-000000000004",
} as const;

export interface LeakManifest {
  /** Each marker string; none may appear in any built file or visitor response. */
  markers: string[];
  /**
   * Ids of rows that must never reach a built file. (`anon` may still read them inside the published
   * layout, which keeps a draft's place so it floats once published; the views drop them.)
   */
  privateIds: string[];
  /** Addresses that must answer 404. */
  notFound: string[];
  /** The unlisted project: renders with noindex, linked from nowhere. */
  unlisted: { path: string; slug: string };
  /** A live post, to prove the build saw published posts at all. */
  livePost: string;
  /** A preview link for the draft project: no-store, noindex, the draft marker present; revoke → 410. */
  preview: { token: string; tokenHash: string; marker: string };
}

const m = (name: string) => `${LEAK}-${name}`;

/** Every flagged RICE row marked checked, so V0 projects publish again as the owner would. */
export function reviewedAll(p: Project): Project {
  return {
    ...p,
    story: p.story.map((c) => ({
      ...c,
      blocks: c.blocks.map((b) =>
        b.type === "table" ? { ...b, reviewed: b.rows.map((r) => r[1] ?? "") } : b,
      ),
    })),
  };
}

async function draft<T>(deps: Deps, table: string): Promise<T> {
  const [r] = await deps.sql.query<{ draft: T }>(`select draft from pm.${table} where id = 1`);
  if (!r) throw new Error(`pm.${table} has no row; run the V0 seed first.`);
  return r.draft;
}

const post = (title: string): Post => ({
  schemaVersion: 1,
  title,
  blocks: [{ id: "b", type: "text", body: `<p>${title} body</p>` }],
  topics: [],
  showOnHome: true,
  seo: {},
});

/**
 * Adds the markers and publishes. `owner.token` is any string `deps.auth` maps to the owner's id; the
 * handlers run in-process, exactly as the deployed functions would.
 */
export async function addLeakMarkers(deps: Deps, owner: { token: string }): Promise<LeakManifest> {
  const call = async (handler: typeof publishHandler, fn: string, body: Record<string, unknown>) => {
    const res = await handler(
      new Request(`http://local/functions/v1/${fn}`, {
        method: "POST",
        headers: { authorization: `Bearer ${owner.token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      deps,
    );
    const out = (await res.json()) as Record<string, unknown>;
    if (res.status !== 200)
      throw new Error(`${fn} ${JSON.stringify(body)} → ${res.status} ${JSON.stringify(out)}`);
    return out;
  };
  const publish = (b: Record<string, unknown>) => call(publishHandler, "pm-publish", b);

  const [live] = await deps.sql.query<{ id: string; draft: Project }>(
    `select id::text, draft from pm.projects where published is not null
     and length(draft -> 'overview' ->> 'summary') <= 140 order by published_slug limit 1`, // not Arcana (D51)
  );
  if (!live) throw new Error("No live project; run the V0 seed first.");

  // A live project's private fields: evidence, todo, a hidden chapter and its prompts.
  await deps.sql.query("update pm.projects set draft = $2 where id = $1", [
    live.id,
    reviewedAll({
      ...live.draft,
      outcomes: live.draft.outcomes.map((o) => ({ ...o, evidence: m("evidence") })),
      todo: [m("todo")],
      story: [
        ...live.draft.story,
        {
          id: "hidden-ch",
          title: m("hidden-chapter"),
          hidden: true,
          prompts: [m("prompt")],
          blocks: [{ id: "t", type: "text", body: `<p>${m("hidden-text")}</p>`, style: "body" }],
        },
      ],
    }),
  ]);

  // A draft project (on a shelf and in the floaters), and an unlisted one.
  await deps.sql.query("insert into pm.projects (id, slug, draft) values ($1, 'secret-draft', $2)", [
    LEAK_IDS.draft,
    { ...live.draft, overview: { ...live.draft.overview, title: m("draft-title"), summary: m("draft") } },
  ]);
  await deps.sql.query("insert into pm.projects (id, slug, draft) values ($1, 'unlisted-one', $2)", [
    LEAK_IDS.unlisted,
    reviewedAll({ ...live.draft, overview: { ...live.draft.overview, title: m("unlisted") } }),
  ]);

  // A scheduled post, and a live one.
  await deps.sql.query(
    "insert into pm.posts (id, slug, draft) values ($1, 'scheduled', $2), ($3, 'live-post', $4)",
    [LEAK_IDS.scheduled, post(m("scheduled")), LEAK_IDS.livePost, post("A live post")],
  );

  // A hidden testimonial and an unconfirmed fact's alternative.
  const profile = await draft<Profile>(deps, "profile");
  const [fact] = Object.keys(profile.facts);
  await deps.sql.query("update pm.profile set draft = $1 where id = 1", [
    {
      ...profile,
      testimonials: [
        ...profile.testimonials,
        { id: "t-hidden", quote: m("quote"), name: "N", initials: "N", role: "R", tone: "teal" },
      ],
      facts: fact
        ? {
            ...profile.facts,
            [fact]: {
              ...profile.facts[fact],
              source: "owner",
              alternative: { value: m("fact"), source: "resume" },
            },
          }
        : profile.facts,
      unconfirmed:
        fact && !profile.unconfirmed.includes(fact) ? [...profile.unconfirmed, fact] : profile.unconfirmed,
    },
  ]);

  // A hidden section (before the footer, which is always last), plus the drafts on a shelf and as floaters.
  const layout = await draft<SiteLayout>(deps, "site_layout");
  await deps.sql.query("update pm.site_layout set draft = $1 where id = 1", [
    {
      ...layout,
      sections: [
        ...layout.sections.slice(0, -1).map((s) =>
          s.kind === "testimonials"
            ? { ...s, items: [...s.items, { id: "t-hidden", visible: false }] }
            : s.kind === "shelf"
              ? {
                  ...s,
                  items: [
                    ...s.items,
                    { id: LEAK_IDS.draft, visible: true },
                    { id: LEAK_IDS.unlisted, visible: true },
                  ],
                }
              : s.kind === "hero" && s.hero
                ? {
                    ...s,
                    hero: {
                      ...s.hero,
                      floaters: {
                        ...s.hero.floaters,
                        items: [...s.hero.floaters.items, LEAK_IDS.draft, LEAK_IDS.unlisted],
                      },
                    },
                  }
                : s,
        ),
        {
          id: "secret-text",
          kind: "text",
          visible: false,
          items: [],
          header: { title: m("hidden-section") },
          text: { body: `<p>${m("hidden-body")}</p>` },
        },
        ...layout.sections.slice(-1),
      ],
    },
  ]);
  await deps.sql.query(
    `insert into pm.link_checks (url, status, detail) values ('https://example.com/leak', 'error', $1)
     on conflict (url) do update set detail = excluded.detail`,
    [m("link")],
  );

  await publish({ action: "publish", kind: "project", id: live.id });
  await publish({ action: "publish", kind: "project", id: LEAK_IDS.unlisted });
  await publish({ action: "settings", kind: "project", id: LEAK_IDS.unlisted, visibility: "unlisted" });
  await publish({ action: "publish", kind: "post", id: LEAK_IDS.livePost });
  await publish({
    action: "publish",
    kind: "post",
    id: LEAK_IDS.scheduled,
    scheduleFor: new Date(deps.now().getTime() + 30 * 86_400_000).toISOString(),
  });
  await publish({ action: "publish", kind: "site", confirmUnconfirmed: true });
  const preview = await call(previewHandler, "pm-preview", { kind: "project", id: LEAK_IDS.draft });
  const url = String(preview.url);
  const link = preview.link as { tokenHash: string };

  return {
    markers: [
      "evidence",
      "todo",
      "hidden-chapter",
      "prompt",
      "hidden-text",
      "draft-title",
      "draft",
      "unlisted",
      "scheduled",
      "quote",
      "fact",
      "hidden-section",
      "hidden-body",
      "link",
    ].map(m),
    privateIds: [LEAK_IDS.draft, LEAK_IDS.unlisted, LEAK_IDS.scheduled],
    notFound: ["/work/secret-draft", "/writing/scheduled"],
    unlisted: { path: "/work/unlisted-one", slug: "unlisted-one" },
    livePost: "/writing/live-post",
    preview: {
      token: url.slice(url.lastIndexOf("/") + 1),
      tokenHash: link.tokenHash,
      marker: m("draft-title"),
    },
  };
}
