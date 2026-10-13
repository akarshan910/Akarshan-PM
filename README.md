# Akarshan Kumar · portfolio, and the platform behind it

This repository is my product portfolio, and it's also part of the portfolio. It started as one hard-coded React page. It is being rebuilt as a small content platform:

- **Volumes:** a designed public site, built from widgets.
- **Studio:** a private CMS that runs every word, number, project and section of it.

How it got here (the research, the options, the decisions and their trade-offs) is written down alongside the code, the way I'd run any product.

| | |
| --- | --- |
| ![The homepage at 1440](design/previews/Home.webp) | ![The homepage on a phone](design/previews/HomeMobile.webp) |

## The thinking, in short

**The problem.** The first version worked, but it was a wall of code. Five case studies, seven testimonials, a career history and every number on the page lived inside a single 4,113-line component.

- Changing a sentence meant changing code: there are 30-odd "Update App.tsx" commits in the history.
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
        │  sign in: 6-digit email code             │  row-level security                     ▲
        │                                          │                                         │ rebuild on publish
        └──publish──▶ Edge Function "publish" ─────┴──copies draft → published──▶ Vercel deploy hook
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

### A site built from widgets

The homepage is a list of **sections**, and each section is a widget with its own settings:

| Section | What the owner can set |
| --- | --- |
| Hero | The parts can be turned on or off. Floating project previews are picked from a list |
| Proof strip | Which numbers show, and in what order |
| Shelves | Any number. Title, intro and 1–3 rows each. The lead card is the first project on the shelf |
| Writing | The latest 2, 3 or 4 posts |
| About, Experience | Text and entries |
| Skills | A word cloud. Each skill has its own size |
| Testimonials | Which quotes show |
| Off duty | A manga page of panels: each one's art, accent and favourites |
| Contact, Footer | Copy and links |

- Every section and every item inside it can be shown, hidden and reordered, by drag or by keyboard.
- The pill nav is generated from the sections linked to it.
- "Add section" creates new shelves or text sections.
- Shelves scale by design: the homepage caps each shelf, and `/work` lists everything with filters and search.

## Where things are

| Path | What it holds |
| --- | --- |
| [`design/`](design/README.md) | Every design board (46), with rendered previews: explorations, the final site at 1440 / 834 / 390, Studio, and the motion system |
| [`docs/story/`](docs/story/README.md) | How the project evolved: the decisions, the trade-offs, and what changed after feedback |
| [`docs/redesign/`](docs/redesign/README.md) | The design phase: audit, design system, CMS architecture, acceptance criteria |
| [`docs/handover/`](docs/handover/README.md) | The engineering handover: architecture, tokens, every page and state, every animation, Studio, backend, V0 content, QA, decisions |
| [`CLAUDE.md`](CLAUDE.md) | The working agreement for the AI agent building it |
| [`SECURITY.md`](SECURITY.md) | What's public, where secrets live, how Studio is protected, how to report a problem |
| `src/` | Today: the original single-page site. It gets replaced as the rebuild lands |

## Status

The design is complete. The build follows the milestones in the [handover](docs/handover/README.md#milestones):

1. Foundation.
2. Components.
3. The public site on V0 data.
4. Supabase.
5. Studio.
6. Publishing and SEO.
7. QA and launch.
8. Finally, the project wiki.

**V0** ships the new design with the current site's content. The content is then rewritten section by section in Studio.

## Running it

```bash
npm install
npm run dev
```

During the rebuild, the README in [`docs/handover/`](docs/handover/README.md) lists the scripts each milestone adds, such as `typecheck`, `test`, `e2e` and `setup:owner`.

## Credits

See [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

Fonts: Archivo, Geist, Geist Mono and JetBrains Mono, all under the SIL Open Font License.
