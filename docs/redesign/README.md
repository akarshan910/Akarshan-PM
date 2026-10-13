# Portfolio redesign and Studio CMS: design phase

This folder records the design phase:

- what the current site does;
- which directions were explored and which one was chosen;
- how the CMS ("Studio") is meant to work;
- what "done" means for implementation.

Nothing here changes the running site yet.

## Where the designs are

All boards are on one private design canvas, organised by page:

1. **Round 3: Volumes × shōnen × depth.** Three mixes of Round 1 Volumes with shōnen manga visuals and depth-field mouse parallax, plus a motion and interaction spec. The final hero comes from mix A, Ink & Depth.
2. **Round 2: bold explorations.** Eight directions, from liquid glass to kinetic type.
3. **Round 1: Volumes (A).** The base direction, with your first comments applied.
4. **Final site: Volumes + Ink hero.** The direction to build:
   - the design system;
   - home at laptop, iPad and mobile, with floating previews in the hero and the standard shelf;
   - how shelves scale as projects are added ("Work at scale");
   - Writing: the homepage section, `/writing` and a post;
   - the case study at laptop and iPad.
5. **Studio (CMS):**
   - sign-in and the dashboard;
   - the Website builder, with Profile & facts;
   - projects and the five-tab project editor;
   - Writing, media and draft preview;
   - every system state;
   - Studio on iPad and phones.
6. **Motion & animation.** The motion system: tokens, then every animation on the site as a live demo, with reduced-motion behaviour.

The canvas is private to the owner. Share it from the canvas page's Share menu.

## Decided

| Topic | Decision | Details |
| --- | --- | --- |
| Visual direction | Round 1 Volumes for the whole site. The hero is Round 3 A (Ink & Depth), redrawn in Round 1's tokens, type and grid. There's no Japanese or SFX lettering anywhere | [The final hero](02-design-system-and-directions.md#the-final-hero) |
| Kept from the live site | The pill nav, exactly, on every device. The angled-cut CTA | [Design system](02-design-system-and-directions.md) |
| Removed | The AK monogram and the "Now" card | — |
| Studio sign-in | Google only, and only your account (akarshan910@gmail.com), with an email-link backup. To be built during development | [Auth](03-cms-architecture.md#auth) |
| What Studio controls | The whole site. Every section and every widget inside it can be turned on or off and reordered, alongside site copy, projects, posts and media | [Website builder](03-cms-architecture.md#website-builder) |
| Writing | Posts live on the site: a homepage section, `/writing`, a page per post and an RSS feed. No Medium or Substack | [Writing](03-cms-architecture.md#writing) |
| Growth | Homepage shelves have a cap. `/work` lists every project | [How shelves scale](03-cms-architecture.md#how-shelves-scale) |
| Shelves | One standard shelf for every shelf. Lead card, then rows of three. "See all" or "All work" completes the last row. One palette of nine project accents | [Shelves](02-design-system-and-directions.md#shelves) |
| Lead card | The first published project on each shelf. Starring a project in Studio moves it to the top | [How shelves scale](03-cms-architecture.md#how-shelves-scale) |
| Hero previews | Floating project cards, set in Studio › Website › Hero. They fade in, drift and fade out on the right of the hero | [The final hero](02-design-system-and-directions.md#the-final-hero) |
| Motion | One easing curve, seven durations, an 80ms stagger, with live demos | [Motion](02-design-system-and-directions.md#motion), canvas page 6 |
| Prototypes | Deployed separately, for example on Vercel, and added in Studio as links | [Media](03-cms-architecture.md#media) |
| Video | Links: YouTube, Vimeo, Loom or Google Drive (shared as "Anyone with the link") | [Media](03-cms-architecture.md#media) |

## Decisions still needed

| Decision | Options | Where to look |
| --- | --- | --- |
| Job title | "Product Manager" (résumé) or "Senior Product Manager" (current site) | [Audit](01-audit.md#site-vs-résumé), Studio › Website › Profile & facts |
| Availability chip | Keep "Seeking Senior / Lead PM roles" (current site) or hide it | Studio › Website › Profile & facts |
| Disputed numbers | 300M+ vs 230M+ users, GLP-1 figures, NPS vs CSAT, Active Foods 40L/month, "30 Cr+" | [Audit](01-audit.md#site-vs-résumé) |
| Sri Mandir RICE row | "Subscription packages" scores 11.3 from its inputs but shows 5.7 | Studio › Editor › Story |
| Wipro entry | Remove the "$XXXK" placeholder or supply a figure you can share | Studio › Website › Profile & facts |
| Sugar.fit volumes | The four Shipped projects are drafts started from your résumé. Each needs screens, your role and evidence before it can go live. Until one is published, the Shipped shelf stays hidden | Studio › Projects |
| Writing intro | `/writing` needs one line on what you write about | Studio › Writing |

## Still to design

- The case study on phones, in the final style.
- Public media states on the case study: video embeds and image loading. The prototype's poster, loading and error states are on the Motion page.

## Documents

- [01 · Audit of the current site](01-audit.md)
- [02 · Design system and directions](02-design-system-and-directions.md)
- [03 · Studio CMS architecture](03-cms-architecture.md)
- [04 · Acceptance criteria](04-acceptance-criteria.md)

## Next step

Once the open items are settled, implementation can start in this order:

1. Data layer and Studio:
   - the Supabase schema and auth;
   - the Website builder;
   - the project and post editors;
   - media;
   - publishing.
2. Migrate into Studio as drafts:
   - the five case studies;
   - the profile;
   - today's section order.
3. Rebuild the public site in the final direction, reading only published content.
4. Writing: `/writing`, post pages, RSS and scheduled publishing.
5. SEO (prerendering and the sitemap), then the motion layer, built to the Motion page.
