# 04 · Acceptance criteria

Implementation is done when every line below holds on the deployed site. Check it:

- at 390, 834 and 1440px wide;
- with keyboard only;
- with a screen reader;
- with reduced motion on.

## Content and honesty

- [ ] Every number on the public site carries a label: Achieved, Target, Projected, Baseline or Output.
- [ ] V0 shows the current site's values. Every figure in the [audit's discrepancy table](01-audit.md#site-vs-résumé) appears in Studio under "Worth a check", with the résumé's value as the alternative. The live value changes only when the owner picks one.
- [ ] Missing facts appear as clearly marked placeholders in drafts and never reach the live site. Empty fields hide their line; empty chapters and sections hide entirely.
- [ ] Private evidence notes never appear in published JSON, page HTML or network responses for visitors.

## Public site

**Direction**

- [ ] The whole site follows Round 1 Volumes. The hero is the standardised Ink & Depth panel. There is no Japanese or SFX lettering anywhere.
- [ ] The pill nav matches the current site exactly on every breakpoint: glass, rotating ring, red "Let's Talk", and Menu plus Let's Talk on mobile.
- [ ] On phones, Menu opens a full-screen menu:
  - the section links, with the current one marked;
  - Let's Talk;
  - Email, LinkedIn and Résumé.

  The pill's ✕, "Close menu", Esc or a link closes it, and focus returns to Menu.
- [ ] CTAs use the angled cut. No logo or monogram anywhere.

**Hero**

- [ ] Floating previews come from the list in Studio and float as specified in [Motion](02-design-system-and-directions.md#motion):

  | Device | Previews |
  | --- | --- |
  | Laptop | 1 to 3 at once, as set in Studio |
  | iPad | One |
  | Phones | None |

  They never cover the hero text, they hold while hovered, and a draft never floats.

**Shelves**

- [ ] Every shelf uses the [standard shelf](02-design-system-and-directions.md#shelves): the same header, a full-width lead card, then cards three across.
- [ ] The cap is lead card plus 1 to 3 rows. Past it, a "See all N" cell appears; a gap in the last row gets an "All work" tile.
- [ ] Phones show the same projects, as a lead card and compact rows.
- [ ] The lead card is the first published project on its shelf.

**Skills and Off duty**

- [ ] Skills is one word cloud matching the Home boards:
  - outlined group words;
  - skills spread through the cloud at their sizes (S, M, L, XL) from Studio;
  - hovering, focusing or tapping a group lights up its skills and dims the rest;
  - screen readers hear each group's skills together.
- [ ] Off duty is the manga page from the Home boards:
  - one ink panel per item, with its accent, art, caption box and tag;
  - the first item's panel is big and carries the spine shelf of favourites;
  - phones show a swipeable row of panels.

**/work**

- [ ] It lists every published, listed project with filters (shelf, company, topic, label), search and sort.
- [ ] It loads 24 at a time and stays smooth with 100+ rows.

**Pages and URLs**

- [ ] Each published project and post has its own URL (`/work/:slug`, `/writing/:slug`) with its own title, description, Open Graph image and canonical URL, served as prerendered HTML.
- [ ] Old `?open=<id>` links redirect to the matching `/work/:slug`. Changed slugs redirect when the switch is on.
- [ ] An unpublished project's address redirects to `/work` with a short note. An expired preview link shows its own page. `/work` with no results offers "Clear filters".
- [ ] The case study matches its laptop, iPad and phone boards. On phones:
  - the chapter bar opens a chapter list;
  - RICE tables become one card per row;
  - the prototype opens full screen.

**Writing**

- [ ] The homepage section shows the latest 2, 3 or 4 posts marked for the homepage, and stays hidden until there is one.
- [ ] `/writing` filters by topic. `/writing/rss.xml` validates and carries the 20 latest posts.
- [ ] Scheduled posts go live within 5 minutes of their time and are 404 before it.

**Prototypes and video**

- [ ] Prototypes are links: they load on click inside a sandboxed iframe, with a poster first, a loading state, and an error state with "Try again" and "Open in a new tab".
- [ ] A host that blocks framing gets an "Open prototype ↗" button instead of a frame. A prototype that hasn't loaded after 15 seconds shows the error state.
- [ ] Media follows the Public states board:
  - images hold their space while loading, so CLS stays at 0;
  - a failed image shows its alt text;
  - nothing loads from a video host until play is pressed;
  - a removed or private video shows "This video isn't available right now".
- [ ] Videos embed from YouTube (privacy-enhanced), Vimeo, Loom or Google Drive only.

**Motion**

- [ ] Every animation matches the [Motion](02-design-system-and-directions.md#motion) tokens and the live demos on canvas page 6:
  - pointer tilt on fine pointers;
  - drift on touch;
  - nothing hover-only;
  - everything still with `prefers-reduced-motion`;
  - nothing flashes.
- [ ] Loops and floating previews pause when the hero is off screen or the tab is hidden.

**Performance and accessibility**

- [ ] Core Web Vitals on a mid-range phone over 4G: LCP under 2.5s, CLS under 0.1, INP under 200ms. Studio code is not in the public bundle.
- [ ] WCAG 2.2 AA:
  - contrast;
  - focus visible and in order;
  - 44px touch targets;
  - alt text on every meaningful image;
  - decorative layers and floating previews hidden from assistive tech.

## Studio

**Access and saving**

- [ ] Studio signs in with a 6-digit code sent by email, and only the owner's address gets one. Database policies enforce this, not just the UI.
  - Any other address sees the same "Check your email" screen and receives nothing.
  - Any other account that somehow has a session is signed out and reads no data.
- [ ] Sign-ups are off from day one. The owner's account is created once with `npm run setup:owner`, and the owner's address isn't in the code.
- [ ] Codes:
  - expire after 10 minutes and work once;
  - each new code replaces the old one;
  - one code can be requested per minute per address;
  - the boxes lock after 5 wrong codes;
  - Turnstile guards code requests once CAPTCHA protection is on, and Supabase limits code checks per IP.
- [ ] Every path on the sign-in flow board works:
  - a deep link returns to its page after sign-in;
  - wrong, expired and too-early states show their messages;
  - signing out mid-edit keeps unsaved changes and syncs them after signing in;
  - "Sign out on all devices" ends every session.
- [ ] No service-role key or other secret ships to the browser.
- [ ] Edits autosave within a second and show Saving, Saved, Offline or Couldn't save, with retry.
- [ ] Two tabs editing the same thing can't silently overwrite each other: the second save gets a conflict prompt.
- [ ] Offline edits are kept on the device and sync on reconnect. Publishing waits for the connection.

**Website builder**

- [ ] Every homepage section and every item inside it can be turned on or off and reordered, by drag and by keyboard (focus a handle, press ↑ or ↓), with a spoken announcement.
- [ ] The hero stays first and visible (its parts can be hidden). The footer stays last.
- [ ] Nav links follow page order, each with its own label.
- [ ] "Publish website" lists every change and publishes the layout and profile together. Project pages, posts and drafts aren't touched.
- [ ] A draft project keeps its spot but can't be switched on. It takes that spot when it's published.
- [ ] Skills: each group's name, subtitle and skills can be edited, with a size per skill. Off duty: each item's title, label, text, tag, accent and art can be edited, plus the first item's favourites.

**Publishing**

- [ ] Publishing a project or post shows what changes and runs the checks before anything goes live. It's blocked by:
  - a missing required field;
  - missing alt text;
  - an Achieved result without evidence;
  - an unsupported or unshared video link;
  - a prototype link that asks for a login.

  Empty recommended fields only warn.
- [ ] Drafts, scheduled posts, previews and `/studio` are never indexed and never in the sitemap. A draft's URL returns the normal 404 to visitors.
- [ ] Preview links (website, project or post) work without an account, expire after 7 days, can be revoked, and are `noindex`.
- [ ] Unpublish and delete ask for confirmation. Deleting a published project requires typing its address. Deletes can be undone for 7 seconds.

**Media and devices**

- [ ] Uploads (images and PDFs) show progress, resume after a dropped connection, and explain every rejection: size, type, a video file or a prototype file. The last two point to the link fields.
- [ ] Files in use can't be deleted. Replace swaps them everywhere.
- [ ] Studio is fully usable on iPad and on a phone: bottom tabs on phones, tables as cards, publish bar in reach.
