# 03 · Wiki plan

**When.** After milestone M7 in the [engineering handover](../handover/README.md#milestones), once the site and Studio are built, launched and stable. The wiki documents what was actually built, so it's written last.

**Where.** The repository's GitHub wiki: a separate git repository at `…/Akarshan-PM.wiki.git`.

- The owner creates the first page once in the GitHub UI, which turns the wiki on.
- After that, pages are written as Markdown and pushed.
- Mirror the source in `docs/wiki/` so it's reviewed like code.

**Rules.**

- Public and safe:
  - no secrets, keys or private URLs;
  - no owner email in setup steps (use `OWNER_EMAIL`);
  - no screenshots of Studio showing drafts.
- Explain the why as well as the what, citing [02 · Decisions](02-decisions.md).
- Diagrams in Mermaid, so they render on GitHub.
- Every page links to the code it describes: paths, functions, migrations.

## Pages

| Page | Must cover |
| --- | --- |
| **Home** | What this is; the portfolio-as-product idea; links to the live site, the design and every wiki page |
| **The story** | Version 1 to platform: the timeline, the audit, the design rounds, the feedback that changed the product (from [01 · Evolution](01-evolution.md)) |
| **Decisions and trade-offs** | The decision log, updated with how each decision played out in the build |
| **Architecture** | The system diagram; prerendering and the client-only Studio; how publishing rebuilds the site; hosting; environments; costs on free tiers |
| **Content model** | Every table and JSON type: profile, layout, projects, posts, media, revisions, redirects, previews, with examples. Draft and published copies. Versioning and migrations |
| **Widgets** | Each homepage section: its data, settings, rendering at three sizes, empty states. How to add a new section type |
| **Publishing** | Autosave, conflicts, offline queue, publish checks, revisions, rebuilds, unpublish and delete, scheduled posts |
| **Security** | The threat model; sign-in by email code with Turnstile and limits; RLS and column grants; Edge Functions; CSP; sanitising; the drafts-never-leak tests; repository hygiene |
| **Design system** | Tokens, type, grid, components, result labels, accents, with preview images from `/design` |
| **Motion** | The motion tokens, every animation with its ID, reduced motion, performance guards |
| **Studio guide** | For the owner: signing in, editing each section, projects, writing, media, previews, publishing, recovering from errors |
| **Operations** | Deploys, environment variables (names only), backups and restore, link checks, the purge job, monitoring, updating dependencies |
| **Testing and QA** | Unit, end-to-end and visual tests; the pixel-parity procedure; accessibility and performance budgets, with results |
| **Lessons** | What went well, what was harder than expected, and what changed from the plan |
