# Portfolio redesign and Studio CMS: design phase

This folder records the design phase:

- what the current site does;
- which directions were explored and which one was chosen;
- how the CMS ("Studio") is meant to work;
- what "done" means for implementation.

**The build spec** is the engineering handover in [`docs/handover/`](../handover/README.md). Where the handover adds detail, the handover wins.

**The story** of how the project evolved, with its decisions and trade-offs, is in [`docs/story/`](../story/README.md).

## Where the designs are

Every board is in [`/design`](../../design/README.md): the `.dc.html` source and a preview image of each. They're exported from the owner's private design canvas, which is organised by page:

1. **Round 3: Volumes × shōnen × depth.** Three mixes of Round 1 Volumes with shōnen manga visuals and depth-field mouse parallax, plus a motion and interaction spec. The final hero comes from mix A, Ink & Depth.
2. **Round 2: bold explorations.** Eight directions, from liquid glass to kinetic type.
3. **Round 1: Volumes (A).** The base direction, with the owner's first comments applied.
4. **Final site: Volumes + Ink hero.** The direction to build:
   - the design system;
   - home at laptop, iPad and mobile:
     - floating previews in the hero;
     - the standard shelf;
     - the Skills word cloud;
     - the Off duty manga page;
     - the phone menu;
   - how shelves scale as projects are added ("Work at scale");
   - Writing: the homepage section, `/writing` and a post;
   - the case study at laptop, iPad and mobile;
   - public states: images, video and prototypes while loading or failing, 404, moved projects, previews, empty results and errors.
5. **Studio (CMS):**
   - sign-in with a one-time code by email, plus the full sign-in flow (every path in and out, laptop and phone);
   - the dashboard;
   - the Website builder, with Profile & facts, skill sizes and the Off duty panels;
   - projects and the five-tab project editor;
   - Writing, media and draft preview;
   - every system state;
   - Studio on iPad and phones.
6. **Motion & animation.** The motion system: tokens, then every animation on the site as a live demo, with reduced-motion behaviour.

## Decided

| Topic | Decision | Details |
| --- | --- | --- |
| Visual direction | Round 1 Volumes for the whole site. The hero is Round 3 A (Ink & Depth), redrawn in Round 1's tokens, type and grid. No Japanese or SFX lettering anywhere | [The final hero](02-design-system-and-directions.md#the-final-hero) |
| Kept from the live site | The pill nav, exactly, on laptop and iPad. Phones keep the pill with Menu and Let's Talk, and Menu opens a full-screen menu. The angled-cut CTA | [Design system](02-design-system-and-directions.md) |
| Removed | The AK monogram and the "Now" card | — |
| Studio sign-in | A 6-digit code sent by email, to the owner's address only. No passwords and no Google setup. Sign-ups are off from day one. Codes expire after 10 minutes and work once. A Cloudflare Turnstile bot check guards code requests once Supabase's CAPTCHA protection is switched on (only after lumina's login sends tokens, D35/Q8), and Supabase limits code checks per IP. Decided 13 Oct 2026; this replaces the earlier Google sign-in | [Auth](03-cms-architecture.md#auth) |
| What Studio controls | The whole site. Every section and every widget inside it can be turned on or off and reordered, alongside site copy, projects, posts and media | [Website builder](03-cms-architecture.md#website-builder) |
| Skills | One word cloud, not a table, fully set in Studio: label, title, intro, groups, skills, order and each skill's size (S, M, L, XL). Group names are big outlined words, skills are spread through the cloud, and hovering or tapping a group lights up its skills. V0 starts every skill at M | [Skills cloud](02-design-system-and-directions.md#skills-cloud) |
| Off duty | A manga-style page: one ink panel per hobby, with art, a caption box and a tag. The first hobby gets the big panel and an optional shelf of favourites, drawn as volume spines | [Off duty](02-design-system-and-directions.md#off-duty) |
| Testimonials | Every switched-on testimonial shows in the homepage carousel. No testimonials page, no limit of three (D14) | [Handover 03](../handover/03-public-site.md#testimonials) |
| Topics | One picker for posts and projects: chips up to 8, a searchable multi-select dropdown past 8 (D23) | [Handover 02 · S1](../handover/02-tokens-and-components.md#s1--topic-picker) |
| Let's Talk | Goes to Contact by default; Studio can switch it to email, LinkedIn or a booking link (D34) | [Handover 03](../handover/03-public-site.md#the-page-shell) |
| Writing | Posts live on the site: a homepage section, `/writing`, a page per post and an RSS feed. No Medium or Substack | [Writing](03-cms-architecture.md#writing) |
| Growth | Homepage shelves have a cap. `/work` lists every project | [How shelves scale](03-cms-architecture.md#how-shelves-scale) |
| Shelves | One standard shelf for every shelf: a lead card, then rows of three. "See all" or "All work" completes the last row. One palette of nine project accents | [Shelves](02-design-system-and-directions.md#shelves) |
| Lead card | The first published project on each shelf. Starring a project in Studio moves it to the top | [How shelves scale](03-cms-architecture.md#how-shelves-scale) |
| Hero previews | Floating project cards, set in Studio › Website › Hero. They fade in, drift and fade out on the right of the hero | [The final hero](02-design-system-and-directions.md#the-final-hero) |
| Motion | One easing curve, a small set of durations, an 80ms stagger, with live demos | [Motion](02-design-system-and-directions.md#motion), canvas page 6 |
| Prototypes | Deployed separately, for example on Vercel, and added in Studio as links | [Media](03-cms-architecture.md#media) |
| Video | Links: YouTube, Vimeo, Loom or Google Drive (shared as "Anyone with the link") | [Media](03-cms-architecture.md#media) |
| First release (V0) | The final design with the current site's content, published at launch. The owner then rewrites each section in Studio. Decided 13 Oct 2026 | [V0 content](../handover/07-v0-content.md) |
| Backend | One Supabase project, shared with the owner's lumina-photography site, because the free plan's two projects are in use. The portfolio lives in its own `pm` schema, with its own buckets, functions and migrations. Decided 13 Oct 2026 | [Backend](../handover/06-backend.md#the-shared-project) |
| Public repository | The repository is public. It holds no secrets, and the owner's address is supplied at setup, never written in code | [`SECURITY.md`](../../SECURITY.md) |

## For the owner to settle in Studio after launch

V0 shows the current site's values. These are worth a look once Studio is live. None of them blocks the build.

| Item | Options | Where |
| --- | --- | --- |
| Job title | "Senior Product Manager" (current site, shown in V0) or "Product Manager" (résumé) | Studio › Website › Profile & facts |
| Availability chip | Keep "Open to work · Seeking Senior / Lead PM Roles" or hide it | Studio › Website › Profile & facts |
| Disputed numbers | 300M+ vs 230M+ users, "30 Cr+", GLP-1 figures, NPS vs CSAT, Active Foods 40L/month | [Audit](01-audit.md#site-vs-résumé), Profile & facts |
| Sri Mandir RICE row | "Subscription packages" scores 11.3 from its inputs but shows 5.7 | Studio › Editor › Story |
| Wipro entry | The "$XXXK" placeholder is hidden in V0. Supply a figure you can share, or leave it hidden | Studio › Website › Experience |
| Skill sizes | Every skill starts at M. Pick the two or three to make big | Studio › Website › Skills |
| SugarFit volumes | The four Shipped projects are drafts started from the résumé. Each needs screens, your role and evidence before it can go live. Until one is published, the Shipped shelf stays hidden | Studio › Projects |
| Writing intro | `/writing` needs one line on what you write about | Studio › Writing |

## Documents

- [01 · Audit of the current site](01-audit.md)
- [02 · Design system and directions](02-design-system-and-directions.md)
- [03 · Studio CMS architecture](03-cms-architecture.md)
- [04 · Acceptance criteria](04-acceptance-criteria.md)

## Next step

Implementation follows the milestones in the [engineering handover](../handover/README.md#milestones).
