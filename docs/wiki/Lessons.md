# Lessons

What went well, what was harder than expected, and what changed from the plan. Written from the build's own records ([`HANDOFF.md`](../../HANDOFF.md), the [decision log](../handover/09-decisions.md) and [the story](../story/01-evolution.md)), as of 15 Oct 2026, before launch. It'll be revisited after launch.

## What went well

- **A handover precise enough to build from.** The boards are HTML and CSS with exact values, every animation has an ID, and there's a precedence order for when sources disagree. Agents asked the owner about accounts, the domain and the shared Supabase project, and nothing else. Every disagreement between a board and a chapter became a dated decision instead of a question (for example [D67](../handover/09-decisions.md), [D71–D74](../handover/09-decisions.md)).
- **Content frozen before anything was deleted.** The live site's text went into `src/legacy/content.ts` first, with a test that traces every string back to the old component. Nothing could be lost in the rewrite, and V0's content has one source.
- **One content core for everyone.** Schemas, defaults and the V0 builder came first and are shared by the site, Studio, the seed and the Edge Functions, so they can't disagree about a document.
- **The database tested without the database.** Pulling Supabase's Docker images failed, so migrations, row-level security and the functions run on PGlite with Supabase's roles stubbed. The real shared project was never touched during the build.
- **A security review at the end of every phase.** It caught things the tests didn't, such as the homepage's data carrying profile items that the page hid.
- **Parallel agents with written coordination.** Five agents (public site, Studio, security, QA, review) each worked in their own worktree, owned a set of files, and coordinated through progress logs and inboxes. When a session ended, the next one resumed from the log.

## What was harder than expected

- **Pixel parity.** The boards draw illustrative copy, and the iPad and phone boards condense it, so the same page can't match three boards with one set of content. The fix was a test fixture of the boards' own copy, with a variant per width ([D70](../handover/09-decisions.md)). Where two boards draw the same content differently, parity masks it ([D60](../handover/09-decisions.md), [D75](../handover/09-decisions.md)). Small things mattered too: a curly apostrophe changed where a line wrapped, and fonts rasterised differently until the board renders loaded the site's own font files.
- **A static site has no server to say "not found".** A case-study address with no prerendered page hydrated another page's HTML and showed an error. It needed the unlisted-project shell ([D24](../handover/09-decisions.md)) and the host's rewrites to behave.
- **Shared infrastructure on one machine.** Agents' test servers collided on the same ports, and another project held a default port, so Playwright ran against the wrong app until each worktree got its own ports.
- **Tests that raced hydration.** A few end-to-end tests acted before the app had hydrated and failed only sometimes, mostly on the phone project. Each was fixed by waiting for the app, not by retries.
- **Limits outside the code.** Usage limits stopped agents mid-task, and a container reset once destroyed unpushed work. Pushing after every commit became a rule.

## What changed from the plan

- **Sign-in codes are 8 digits, not 6** ([D66](../handover/09-decisions.md)), because CAPTCHA protection stays off on the shared project for now ([D54](../handover/09-decisions.md)).
- **Fewer dependencies in Studio:** its own query cache and IndexedDB wrapper ([D65](../handover/09-decisions.md)), and, provisionally, its own reorder and rich-text field ([D69](../handover/09-decisions.md)); no `heic2any` ([D80](../handover/09-decisions.md)).
- **The boards won small arguments with the written spec:** plain list bullets, "Search N volumes", 16:9 post covers, a 10px Let's Talk on phones, no back link in the phone case-study footer, and the prototype note on laptop only ([D71–D74](../handover/09-decisions.md), [D78](../handover/09-decisions.md), [D79](../handover/09-decisions.md)).
- **Visitors read slightly more than the spec listed:** a project's `id` and `index_allowed` ([D56](../handover/09-decisions.md), [D82](../handover/09-decisions.md)), both needed to build the pages.
