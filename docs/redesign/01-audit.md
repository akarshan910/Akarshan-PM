# 01 · Audit of the current site

## What's there today

- **Stack.** Vite 6, React 18 and Tailwind 4, exported from Figma Make (`package.json` name `@figma/my-make-file`). No backend, no router.
- **Code shape.** The whole site is one component: `src/app/App.tsx` (4,113 lines), styled by `src/styles/portfolio.css` (1,006 lines). `package.json` declares 28 Radix UI and MUI packages, but the page uses its own CSS.
- **Content.** Everything is hard-coded:
  - `CASES` holds the five case studies: Sri Mandir, Word Trip, Arcana, GLP-1 scaffold and FarmVille 3.
  - `testimonials` holds seven entries with names and roles.
  - The hero, stats and experience are inline JSX.
  - Each case mixes `customSections` with `items`, `subsections`, `metricGroups`, `journeys` and `widgets`.
- **Prototypes.** Three standalone HTML files in `public/`: Sri Mandir, Word Trip and FarmVille 3. Copies of two of them also sit at the repository root.
- **Case study access.** Case studies open in a modal. The only deep link is `?open=<id>`.
- **Build output.** `dist/` is committed: one 267 KB JS bundle and one 144 KB CSS file, before compression.
- **Metadata.** `index.html` has a title ("Akarshan Kumar PM"), charset and viewport. There is no description and no Open Graph tags.

## Worth keeping

- **The pill nav.** Glass, a rotating ring and the red "Let's Talk" pill. Every new direction keeps it exactly, on every device.
- **The angled-cut CTA.**
- **Working prototypes.** They are the strongest proof on the site. The redesign gives them a proper frame, a poster and on-click loading.
- **Real testimonials** with names and roles.

## Problems

1. **Case studies aren't pages.** They have:
   - no URL of their own;
   - no per-project title, description or link preview;
   - nothing a search engine can index.

   Sharing one link to one project isn't possible beyond `?open=`.
2. **Every edit is a code change.** There are no drafts, no preview and no way to check a page before it goes live.
3. **Numbers don't say what they are.** Targets and projections carry the same weight as measured results. For example, Sri Mandir's "+30% monthly orders" is an assignment target.
4. **The site and the résumé disagree** in several places (table below). The redesign treats the 2-page résumé as the source of truth until you confirm otherwise.
5. **One RICE table is internally inconsistent** (Sri Mandir, "Subscription packages"):

   | Input | Value |
   | --- | --- |
   | Reach | 8 |
   | Impact | 2.5 |
   | Confidence | 85% |
   | Effort | 1.5 months |
   | Score from the inputs | 11.3 |
   | Score shown | 5.7 |

   A 3-month effort would give 5.7. If the score is right, the ranking is too. If the inputs are right, this row ranks first.
6. **Placeholder text is live.** The Wipro entry shows "Saved $XXXK by optimizing Uber Eats' …".

## Site vs résumé

| Item | Current site | 2-page résumé | Proposed |
| --- | --- | --- | --- |
| Title | Senior Product Manager | Product Manager (Sugar.fit, May 2025 – present) | Your call. Designs use the résumé title for now |
| Availability | "Open to work · Seeking Senior / Lead PM Roles" | Not stated | Keep if still true; Studio asks you to confirm |
| Users / devices at Glance | 300M+ users served | 230M+ lockscreen users | Use 230M+ unless 300M+ has a source |
| Glance ARR | $1.4M via Tracfone | $1.4M via Tracfone, plus $600K from Japan and Brazil ($2M total) | Both are right; the redesign shows the $2M total |
| GLP-1 app | ₹50L MRR, 35% renewal | ₹3.6 Cr in month one, 52% renewal | Confirm which figures and dates to show |
| CGM journey | NPS 35 → 52 | Post-first-sensor CSAT 42 → 72 (of 100) | Confirm the metric; crash replacements 20% → 6% and ₹3.2 Cr saved agree |
| Active Foods | Scaled D2C to 40L/month; AOV +7%; RTO −25% | AOV +7%; returns −25% (COD) / −17% (prepaid); 5% of carts recovered | 40L/month isn't in the résumé: confirm or drop |
| Revenue headline | "30 Cr+ in annual revenue" | Not stated | Left off until there's a source |
| Wipro (Uber Eats) | "Saved $XXXK …" | Client figures not given | Remove the placeholder |

Every number in the new designs carries one of five labels: **Achieved**, **Target**, **Projected**, **Baseline** or **Output**. In Studio, a result marked Achieved can't be published without a private evidence note.
