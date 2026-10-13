# 04 · Acceptance criteria

Implementation is done when every line below holds on the deployed site, checked at 390, 834 and 1440px wide, with keyboard only, with a screen reader, and with reduced motion on.

## Content and honesty

- [ ] Every number on the public site carries a label: Achieved, Target, Projected, Baseline or Output.
- [ ] No figure from the [audit's discrepancy table](01-audit.md#site-vs-résumé) is shown until you have confirmed it.
- [ ] Missing facts appear as clearly marked placeholders in drafts and never reach the live site. Empty fields hide their line; empty chapters hide entirely.
- [ ] Private evidence notes never appear in published JSON, page HTML or network responses for visitors.

## Public site

- [ ] The pill nav matches the current site exactly on every breakpoint: glass, rotating ring, red "Let's Talk", and Menu plus Let's Talk on mobile.
- [ ] CTAs use the angled cut. No logo or monogram anywhere.
- [ ] Each published project has its own URL (`/work/:slug`) with its own title, description, Open Graph image and canonical URL, served as prerendered HTML.
- [ ] Old `?open=<id>` links redirect to the matching `/work/:slug`.
- [ ] Prototypes load on click inside a sandboxed iframe from a separate origin, with a poster first and an error state with retry.
- [ ] Videos embed from YouTube (privacy-enhanced), Vimeo or Loom only.
- [ ] Core Web Vitals on a mid-range phone over 4G: LCP under 2.5s, CLS under 0.1, INP under 200ms. Studio code is not in the public bundle.
- [ ] Motion follows the [spec](02-design-system-and-directions.md#motion-and-interaction):
  - pointer parallax on fine pointers;
  - tilt or drift on touch;
  - nothing hover-only;
  - everything off with `prefers-reduced-motion`;
  - no flashes above 3 per second.
- [ ] WCAG 2.2 AA:
  - contrast;
  - focus visible and in order;
  - 44px touch targets;
  - alt text on every meaningful image;
  - decorative layers hidden from assistive tech.

## Studio

- [ ] Only emails on the owner allowlist can read or change anything. This is enforced by database policies, not just the UI.
- [ ] No service-role key or other secret ships to the browser.
- [ ] Edits autosave within a second and show Saving, Saved, Offline or Couldn't save, with retry.
- [ ] Two tabs editing the same project can't silently overwrite each other: the second save gets a conflict prompt.
- [ ] Offline edits are kept on the device and sync on reconnect. Publishing waits for the connection.
- [ ] Publishing shows what changes and runs the checks before anything goes live:
  - blocked by a missing required field;
  - blocked by missing alt text;
  - blocked by an Achieved result without evidence;
  - blocked by an unsupported video link;
  - warned (not blocked) for empty recommended fields.
- [ ] Drafts, previews and `/studio` are never indexed and never in the sitemap. A draft's URL returns the normal 404 to visitors.
- [ ] Preview links work without an account, expire after 7 days, can be revoked, and are `noindex`.
- [ ] Projects can be reordered by drag and by keyboard (focus a handle, press ↑ or ↓), with a spoken announcement. Homepage order publishes separately from project content.
- [ ] Featured is one lead card per shelf.
- [ ] Unpublish and delete ask for confirmation. Deleting a published project requires typing its address. Block and project deletes can be undone for 7 seconds.
- [ ] Uploads show progress, resume after a dropped connection, and explain every rejection: size, type, video file, or prototype with outside scripts.
- [ ] Files in use can't be deleted. Replace swaps them everywhere.
- [ ] Studio is fully usable on iPad and on a phone: bottom tabs on phones, tables as cards, publish bar in reach.
