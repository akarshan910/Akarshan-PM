# Portfolio redesign and Studio CMS: design phase

This folder records the design phase: what the current site does, which directions were explored, how the CMS ("Studio") is meant to work, and what "done" means for implementation. Nothing here changes the running site yet.

## Where the designs are

All boards are on one private design canvas, organised by page:

1. **Round 3: Volumes × shōnen × depth** (latest): three mixes of the Round 1 Volumes direction with shōnen manga visual language and depth-field mouse parallax, each at laptop, iPad and mobile, plus a shared motion and interaction spec.
2. **Round 2: bold explorations**: eight directions (liquid glass, cyberpunk HUD, neon night, shōnen manga, cover story, depth field, desktop OS, kinetic type).
3. **Round 1: Volumes (A)**: the chosen base direction, with your comments applied.
4. **Volumes: full site**: design system, home at laptop, iPad and mobile, and the case study at laptop and iPad. The case study's mobile layout and the public media states follow once a Round 3 direction is chosen.
5. **Studio (CMS)**: sign-in, dashboard, projects, the five-tab project editor, media, profile, preview, every system state, and Studio on iPad and phones.

The canvas is private to the owner. Share it from the canvas page's Share menu.

## Decisions needed before implementation

| Decision | Options | Where to look |
| --- | --- | --- |
| Visual direction | Round 3 A (Ink & Depth), B (Chapter Spread) or C (Volumes Prime), or a mix | Canvas page 1 |
| Job title | "Product Manager" (résumé) or "Senior Product Manager" (current site) | [Audit](01-audit.md#site-vs-résumé), Studio › Profile |
| Availability chip | Keep "Seeking Senior / Lead PM roles" (current site) or hide it | Studio › Profile |
| Disputed numbers | 300M+ vs 230M+ users, GLP-1 figures, NPS vs CSAT, Active Foods 40L/month, "30 Cr+" | [Audit](01-audit.md#site-vs-résumé) |
| Sri Mandir RICE row | "Subscription packages" scores 11.3 from its inputs but shows 5.7 | Studio › Editor › Story |
| Wipro entry | Remove the "$XXXK" placeholder or supply a figure you can share | Studio › Profile |

## Documents

- [01 · Audit of the current site](01-audit.md)
- [02 · Design system and directions](02-design-system-and-directions.md)
- [03 · Studio CMS architecture](03-cms-architecture.md)
- [04 · Acceptance criteria](04-acceptance-criteria.md)

## Next step

Once a direction is picked and the open items are confirmed, implementation can start in this order:

1. Data layer and Studio (Supabase schema, auth, editor, media, publish).
2. Migrate the five case studies and the profile from the code into Studio as drafts.
3. Rebuild the public site in the chosen direction, reading only published content.
4. SEO (per-project pages, prerendering, sitemap) and the motion layer.
