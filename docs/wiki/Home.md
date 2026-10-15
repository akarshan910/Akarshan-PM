# Volumes and Studio

This is the wiki for Akarshan Kumar's product portfolio and the small platform behind it. The portfolio is treated as a product with one demanding user: a public site, **Volumes**, where every project is a numbered volume and every number carries a label, and a private CMS, **Studio**, that runs every word, number, project and section of it. The wiki documents what was built and why. It's written from the repository's own records, as of 15 Oct 2026, before launch.

| | |
| --- | --- |
| ![The homepage at 1440](../../design/previews/Home.webp) | ![The homepage on a phone](../../design/previews/HomeMobile.webp) |

## The portfolio as a product

The first site worked, but every edit was a code change, case studies had no address of their own, and targets looked like results. The rebuild treats those as product problems: content becomes data with drafts and publishing, every case study gets its own page, and every number says whether it was achieved, targeted, projected, a baseline or an output. How it got here is in [The story](The-story.md).

## Where things are

- **The site:** [akarshan-pm.vercel.app](https://akarshan-pm.vercel.app) from launch ([D53](../handover/09-decisions.md)). Until then, `main` keeps serving the original site ([D46](../handover/09-decisions.md)).
- **The design:** every board in [`design/`](../../design/README.md), with previews.
- **The build spec:** the engineering handover in [`docs/handover/`](../handover/README.md), and its status in [`HANDOFF.md`](../../HANDOFF.md).
- **The reasoning:** [`docs/story/`](../story/README.md).

## Pages

| Page | What it covers |
| --- | --- |
| [The story](The-story.md) | From one hard-coded page to a platform: the audit, the design rounds, the feedback, V0 and the build |
| [Decisions and trade-offs](Decisions-and-trade-offs.md) | The decision log, and how each decision played out |
| [Architecture](Architecture.md) | The system, prerendering and the client-only Studio, publishing and rebuilds, hosting and environments |
| [Content model](Content-model.md) | Every table and JSON document, draft and published copies, versions and migrations |
| [Widgets](Widgets.md) | Each homepage section, its data and settings, at three sizes, and how to add a new one |
| [Publishing](Publishing.md) | Autosave, conflicts, offline, publish checks, revisions, rebuilds, unpublishing and scheduling |
| [Security](Security.md) | The threat model, sign-in, row-level security, Edge Functions, CSP, sanitising and the no-leaks tests |
| [Design system](Design-system.md) | Tokens, type, grid, components, result labels and accents |
| [Motion](Motion.md) | Every animation by ID, reduced motion and the performance guards |
| [Studio guide](Studio-guide.md) | For the owner: signing in, editing, publishing and recovering from errors |
| [Operations](Operations.md) | Deploys, environment variable names, backups, link checks, purging and dependencies |
| [Testing and QA](Testing-and-QA.md) | Unit, end-to-end and visual tests, pixel parity, accessibility and performance |
| [Lessons](Lessons.md) | What went well, what was harder than expected, and what changed from the plan |
