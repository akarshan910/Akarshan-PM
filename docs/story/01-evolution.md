# 01 · Evolution

## Version 1: a page that worked (March–April 2026)

The first portfolio was exported from Figma Make. It started as a Vite and React app whose whole site was one component, `src/app/App.tsx`, which grew to 4,113 lines.

| Date | What happened |
| --- | --- |
| 24 Mar | Initial commit: the Figma Make export |
| 29 Mar – 2 Apr | Case studies added one by one: Arcana Workspace, GLP-1 Digital Scaffold, then Sri Mandir and Word Trip rewritten from full PRDs. A `customSections` model grew inside the code to hold chapters, lists, sub-sections, metric tables, journeys and widgets |
| 3 Apr | A new 7-screen Sri Mandir prototype from the PRD |
| 6 Apr | FarmVille 3 revenue strategy as the fifth case study, with a landscape 3D prototype |

**What it did well:**

- a distinctive dark, manga-flavoured look;
- a glass pill nav with a rotating ring;
- working prototypes;
- real testimonials;
- deep case-study content.

**What hurt:**

- Every content change was a code change: more than 30 commits are titled "Update App.tsx".
- There were no drafts and no preview.
- Case studies opened in a modal with no URL of their own (`?open=<id>` was the only link), so they couldn't be shared individually or indexed.
- Targets, projections and measured results looked the same.

## The audit (13 Oct 2026)

The redesign began with an audit of the live site, before any design ([`docs/redesign/01-audit.md`](../redesign/01-audit.md)). It found:

- **Structure:** one component; 28 UI packages declared but unused; build output committed.
- **Honesty gaps:**
  - The site and the résumé disagreed on several numbers.
  - One RICE table was internally inconsistent: a row's score didn't match its own inputs.
  - A "$XXXK" placeholder was live.
- **What to keep:** the pill nav, exactly; the angled-cut CTA; the prototypes; the testimonials.

## Design rounds (13 Oct 2026)

All design happened on one canvas, page by page. The boards are in [`/design`](../../design/README.md).

1. **Round 1: three directions.**
   - A · Volumes: projects as numbered volumes, dark and editorial.
   - B · Operator: a data-dense dashboard.
   - C · Editorial: magazine-like.

   **Volumes** was chosen. It carries a personal thread (the owner's love of layered manga storytelling, where episode one pays off in the finale) and still reads as professional.

   The first feedback: keep the live nav **exactly as it is**, on every device, with the glass and ring intact. Drop the monogram and the "Now" card.
2. **Round 2: eight bold explorations.** Liquid glass, cyberpunk HUD, neon night, shōnen manga, cover story, depth field (mouse parallax), desktop OS and kinetic type, each at three sizes. Manga and depth field stood out.
3. **Round 3: three mixes** of Volumes with shōnen ink and depth-field motion, plus a motion spec. **Ink & Depth** won, but only for the hero. The rest of the site stayed Round 1, so the personality lives in one place and the content stays easy to read.

## The final design and the platform (13 Oct 2026)

**The final site:**

- Volumes everywhere, with the Ink & Depth hero redrawn in Round 1's tokens.
- A design system: dark and light tokens, nine project accents, five result labels, type, grid and components.
- Every page at 1440, 834 and 390: home, case study, `/work`, Writing, public states.
- A motion system with a live demo of every animation.

**Studio, the CMS:**

- the dashboard and the Website builder, where every section and widget can be shown, hidden and reordered;
- projects and a five-tab editor;
- Writing, media, Profile & facts and draft preview;
- every system state, on laptop, iPad and phone.

## Iterating on feedback (13 Oct 2026)

Each round of the owner's comments on the canvas changed the product. In order:

| Feedback | Change |
| --- | --- |
| "Copy this nav section as it is" | The pill nav was rebuilt from the live CSS: glass, the rotating ring's exact gradient, the red Let's Talk. Then it was applied on every device |
| "How do these sections scale as I add more projects?" | Shelves got a cap (a lead card plus 1–3 rows), "See all N" and "All work" tiles, and a `/work` list with filters, search and paging. A "Work at scale" board shows a slider from 2 to 40 projects |
| "This needs to be standardised" + "create a section with all the animation" | One standard shelf component everywhere, one palette of nine accents, and a Motion page of live demos with tokens |
| "These need to be config-driven … randomly float in the hero" | The floating previews: a list in Studio, cards that fade in at random spots, drift and fade out, held on hover, and still for reduced motion |
| "How do we handle prototypes?" and "video on Google Drive" | Prototypes became links to their own deployments (e.g. Vercel), with framing checks and fallbacks. Videos became links, including Google Drive with its sharing caveats |
| "Google auth on my account, else how will I access the CMS?" | Owner-only sign-in, designed end to end with every path |
| "Complete the case study at laptop, iPad, mobile" | The phone case study (chapter sheet, RICE as cards, a full-screen prototype) and the public states board |
| "Phone navigation … what happens when the user clicks Menu?" | A full-screen phone menu with the section links, Let's Talk, and three ways to close it |
| "Can this be made as a word cloud? … looks very tabular" | Skills became one word cloud. Group words are outlined, skills are spread through the cloud, and hovering a group lights up its skills. Sizes are set per skill in Studio |
| "Off duty is plain vanilla … earlier one was okay … make something better" | Off duty became a manga page: ink panels with art, caption boxes and tags. The anime favourites became volume spines on a shelf |
| "Can we do the CMS auth using email-based OTP?" | Studio sign-in switched from Google to a 6-digit email code, the pattern from the owner's lumina-photography admin. Turnstile, limits and closed sign-ups make it hard to abuse |
| "Make the repo public … ensure nothing security-level is in it" | A security pass: no secrets in history, the owner's address supplied at setup only, `SECURITY.md`, and hardened ignore rules |
| "Give options to add topics … past many topics, a multi-select dropdown" | A topic picker: chips and "+ Add topic" up to 8 topics, then a searchable multi-select dropdown, shared by posts and projects |
| "Make sure [skills] is config-driven from the CMS" | Every part of the Skills section became editable in Studio, including its label and the order and names of skills |
| "I've used up Supabase's free tier with two projects" | The portfolio moved into the photography site's Supabase project, in its own `pm` schema, with rules that keep the two sites apart |

## V0: the first release of the platform (decided 13 Oct 2026)

**The scope.**

- V0 ships the final design with **the current site's content, published**, so the new site is complete on day one.
- The owner then rewrites each section in Studio.
- Disputed facts stay as they are on the live site and are listed in Studio as "Worth a check", with the résumé's value alongside.

**The handover.** The engineering handover ([`docs/handover/`](../handover/README.md)) was written so an AI coding agent can build V0 to the pixel. It includes:

- the boards as HTML and CSS source;
- precedence rules for when sources disagree;
- milestones with a definition of done;
- an explicit list of what to ask the owner and what never to ask.

## The build (to be written)

Add entries here as milestones land: what was built, what changed from the plan, and why.
