# Akarshan Kumar · portfolio, and the platform behind it

This repository is my product portfolio, and it's also part of the portfolio. It started as one hard-coded React page. It is being rebuilt as a small content platform:

- **Volumes:** a designed public site, built from widgets.
- **Studio:** a private CMS that runs every word, number, project and section of it.

How it got here (the research, the options, the decisions and their trade-offs) is written down alongside the code, the way I'd run any product.

- **The site:** [akarshan-pm.vercel.app](https://akarshan-pm.vercel.app) from launch ([D53](docs/handover/09-decisions.md)). Until then, the `main` branch keeps serving the original site ([D46](docs/handover/09-decisions.md)).
- **The wiki:** [`docs/wiki/`](docs/wiki/Home.md), mirrored to the GitHub wiki once it's switched on.

| | |
| --- | --- |
| ![The homepage at 1440](design/previews/Home.webp) | ![The homepage on a phone](design/previews/HomeMobile.webp) |

## The thinking, in short

**The problem.** The first version worked, but it was a wall of code. Five case studies, seven testimonials, a career history and every number on the page lived inside a single 4,113-line component.

- Changing a sentence meant changing code: there are a dozen "Update App.tsx" commits in the history.
- There were no drafts and no previews.
- A case study had no address of its own, so it couldn't be shared or found by search.
- Targets and projections looked exactly like measured results.

**The bet.** Treat the portfolio as a product with one demanding user: me, updating it from a laptop or a phone between jobs. That turns the work into two products:

1. **A public site that can say honest things well.** Every number carries a label: Achieved, Target, Projected, Baseline or Output. Every project is a numbered *volume* with its own page. Motion adds character without getting in the way.
2. **A platform that keeps it true over time.**
   - Content is data, not code: profile, projects, posts, media and the homepage layout.
   - Drafts stay private until published.
   - Publishing runs checks: alt text, link health, and evidence for any Achieved claim.

**The process.** It was run the way I run product work:

1. An audit of the existing site.
2. Three rounds of design directions, with feedback on each.
3. A design system, then every page and state at three device sizes.
4. A motion spec with live demos.
5. A CMS designed screen by screen.
6. Acceptance criteria.
7. An engineering handover precise enough that an AI coding agent can build it to the pixel without asking about pixels.

The full story is in [`docs/story/`](docs/story/README.md).

## How it's modular

### A platform to power the content

```
Studio (/studio, owner only) ──writes drafts──▶ Supabase Postgres ◀──reads published── Public site (prerendered)
        │  sign in: 8-digit email code             │  row-level security                     ▲
        │                                          │                                         │ rebuild on publish
        └──publish──▶ Edge Function "pm-publish" ──┴──copies draft → published──▶ Vercel deploy hook
```

**Content types.** There are five, and each is stored as a draft and a published copy:

| Type | Holds |
| --- | --- |
| `profile` | Facts and copy |
| `site_layout` | Sections, widgets, order, navigation |
| `projects` | Case studies |
| `posts` | Writing |
| `media` | Images and PDFs |

**Publishing** copies the draft to the published copy, after checks, in one transaction, keeps a revision, and rebuilds the static site. Visitors can only ever read published columns. The database enforces that, not just the UI.

**Media stays light.** Prototypes and videos are links (Vercel, YouTube, Vimeo, Loom, Google Drive), loaded on click in sandboxed frames.

**One backend, shared.** The Supabase project also runs the owner's photography site. The portfolio lives in its own `pm` schema, with its own buckets, functions, owner check and migrations. Published images are copied into the static site, so visitors never touch the shared quota.

### A site built from widgets

The homepage is a list of **sections**, and each section is a widget with its own settings:

| Section | What the owner can set |
| --- | --- |
| Hero | The parts can be turned on or off. Floating project previews are picked from a list |
| Proof strip | Which numbers show, and in what order |
| Shelves | Any number. Title, intro and 1–3 rows each. The lead card is the first project on the shelf |
| Writing | The latest 2, 3 or 4 posts |
| About, Experience | Text and entries |
| Skills | A word cloud: label, title, intro, groups, skills, their order and each skill's size. V0 starts every skill at M |
| Testimonials | Which quotes show; every switched-on quote is in the carousel |
| Off duty | A manga page of panels: each one's art, accent and favourites |
| Contact, Footer | Copy and links, and where Let's Talk goes: Contact (default), email, LinkedIn or a booking link |

- Every section and every item inside it can be shown, hidden and reordered, by drag or by keyboard.
- The pill nav is generated from the sections linked to it.
- "Add section" creates new shelves or text sections.
- Shelves scale by design: the homepage caps each shelf, and `/work` lists everything with filters and search.

## Where things are

| Path | What it holds |
| --- | --- |
| [`design/`](design/README.md) | Every design board (48, two of them viewing aids for the tall Home boards), with rendered previews: explorations, the final site at 1440 / 834 / 390, Studio, and the motion system |
| [`docs/wiki/`](docs/wiki/Home.md) | The project wiki: architecture, content model, widgets, publishing, security, design system, motion, the Studio guide, operations, testing, and lessons |
| [`docs/story/`](docs/story/README.md) | How the project evolved: the decisions, the trade-offs, what changed after feedback, and the build |
| [`docs/redesign/`](docs/redesign/README.md) | The design phase: audit, design system, CMS architecture, acceptance criteria |
| [`docs/handover/`](docs/handover/README.md) | The engineering handover: architecture, tokens, every page and state, every animation, Studio, backend, V0 content, QA, decisions |
| [`CLAUDE.md`](CLAUDE.md) | The working agreement for the AI agent building it |
| [`SECURITY.md`](SECURITY.md) | What's public, where secrets live, how Studio is protected, how to report a problem |
| `src/` | The rebuilt site and Studio: `routes/`, `components/`, `motion/`, `styles/`, and `lib/` (schemas, views, content sources). The original page's content is frozen in `src/legacy/` |
| `supabase/` | The `pm` schema's migrations, the `pm-` Edge Functions and their tests ([`supabase/README.md`](supabase/README.md)) |
| [`HANDOFF.md`](HANDOFF.md) | Where the build is and what's next, for whoever picks it up |

## Status

As of 15 Oct 2026, on the rebuild branch `claude/elegant-allen-xdmal0`. The milestones are in the [handover](docs/handover/README.md#milestones); [`HANDOFF.md`](HANDOFF.md) has the detail.

| Milestone | State |
| --- | --- |
| M0 · Foundation | Done |
| M1 · Components | Done |
| M2 · The public site on V0 data | Done. Pixel parity with the boards is checked per section at 1440, 834 and 390 |
| M3 · Supabase | Built and tested locally. The owner applies it to the shared project at go-live |
| M4 · Studio | Done, including the iPad and phone pass |
| M5 · Publishing and SEO | Built: metadata, feeds, media, redirects, the unlisted shell, and routes and headers as Vercel Build Output. They switch on at go-live |
| M6 · QA and launch | In progress |
| M7 · The wiki | In progress |

**V0** ships the new design with the current site's content. The content is then rewritten section by section in Studio.

## Running it

```bash
npm ci
npm run dev
```

The checks run before every commit: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run test:db` and `npm run build`, then `npx playwright test`. The site builds from the V0 content by default; the Supabase steps are in [`supabase/README.md`](supabase/README.md) and are run by the owner.

## Credits

See [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

Fonts: Archivo, Geist, Geist Mono and JetBrains Mono, all under the SIL Open Font License.
