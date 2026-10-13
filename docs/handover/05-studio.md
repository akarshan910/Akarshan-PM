# 05 · Studio

Studio is the owner's CMS at `/studio`. It's a client-only SPA ([01 · Rendering](01-architecture.md#rendering)), light-themed with its own tokens ([02 · Studio tokens](02-tokens-and-components.md#studio-tokens)), and it talks to Supabase directly with the owner's session, through RLS ([06](06-backend.md)).

- **Boards:** every `Studio*.dc.html` and `Editor*.dc.html` board. Their Tweaks show every state.
- **Animations:** M-ST-* in [04 · Studio](04-motion.md#studio).
- **This chapter** says what each screen does, where its data comes from, and the rules the boards can't show.

## Routes

| Path | Screen | Board |
| --- | --- | --- |
| `/studio/login` | Sign-in | `StudioLogin`, `StudioAuthFlow` |
| `/studio` | Dashboard | `StudioDashboard` |
| `/studio/website` | Website builder | `StudioSite` |
| `/studio/website/profile` | Profile & facts | `StudioProfile` |
| `/studio/projects` | Projects | `StudioProjects` |
| `/studio/projects/:id/:tab` | Project editor; `tab` is `overview`, `visuals`, `story`, `outcomes` or `settings` | `Editor*` |
| `/studio/writing`, `/studio/writing/:id` | Writing: lists, then a post | `StudioWriting` |
| `/studio/media` | Media library | `StudioMedia` |
| `/studio/preview/:kind/:id` | Draft preview (`kind`: site, project, post) | `StudioPreview` |

Every route except `/studio/login` requires a session and the owner check. Without them, Studio redirects to `/studio/login?next=<path>`.

## Shell

Boards: `StudioDashboard` (laptop), `StudioTablet`, `StudioMobile`.

| Device | Navigation |
| --- | --- |
| Laptop (≥ 1280) | Sidebar, `flex: 1 1 232px; max-width: 256px`: the "Studio." wordmark, Dashboard, Website, Projects (with count), Writing, Media, a divider, "View live site ↗", then the account card at the bottom |
| iPad | A 72px icon rail with the same items and labels as tooltips. Landscape uses the full sidebar, as on the board |
| Phone | A five-tab bottom bar: Home, Website, Projects, Writing, Media. The account menu is under Home |

- **The account card** shows the signed-in address, "Owner", and a menu with "Sign out" and "Sign out on all devices" ([06 · Client code](06-backend.md#client-code)).
- **Save status** sits in every editor's header (`StudioStates` › Saving): "All changes saved", "Saving…" with the pulsing dot, "Offline · saved on this device", or "Couldn't save" with Retry. It never hides.
- **Toasts** appear bottom centre, one at a time; destructive actions get Undo for 7 seconds.
- **Banners** for offline and save failures sit under the editor header.

**Data layer.**

- Queries use TanStack Query, keyed by table and id, so a save in one tab refreshes another tab's view.
- Writes go through one `useAutosave(doc)` hook: the 800ms debounce, the version check, the offline queue ([06 · Autosave](06-backend.md#autosave)).
- Every Studio module is a lazy route chunk, so the public bundle never contains Studio code.

## Sign-in

Boards: `StudioLogin.dc.html` (every state in Tweaks) and `StudioAuthFlow.dc.html` (every path, laptop and phone). Plumbing: [06 · Auth](06-backend.md#auth). Components: S2 code input, M-ST-OTP.

**The card**, centred on `--bg`: the "Studio." wordmark, then one of two steps.

**Step 1, email:**

- Field "Email", `type="email"`, `autocomplete="username"`, prefilled from `studio.email` on this device.
- The button "Email me a code" (`.pbtn`, 52px).
- Turnstile runs invisibly and appears only in the "bot check" state.

**Step 2, code:**

- "Check your email". We sent a 6-digit code to `a•••••••0@gmail.com`, with the address masked as the board's `mask()` does.
- The six code boxes, then "Sign in".
- "Resend code in 0:52", counting down from 60 and then becoming "Resend code".
- "Use a different email".

**States and their copy** are on the board. The behaviour behind each:

| State | When | Behaviour |
| --- | --- | --- |
| email | First visit, or "Use a different email" | Focus in the email field |
| invalid | The address doesn't look like an email | Inline error, `aria-invalid`, focus stays |
| sending code | After "Email me a code" | The button shows the spinner, `aria-busy`; the field is disabled |
| bot check | Turnstile asks for a challenge | The widget shows in the card; sending waits for it |
| enter code | The send succeeded, **or** the address has no account | Always the same screen, so it never reveals who owns the site. Focus moves to the code input |
| code typed / checking code | Six digits entered | Auto-submits after 150ms. The boxes go `.off` while checking |
| wrong code | The check failed within 10 minutes of sending | Boxes `.bad`, "That code didn't work." Typing clears it. Counts towards the lock |
| code expired | The check failed more than 10 minutes after sending | "That code has expired." and "Send a new code" |
| too many tries | 5 wrong codes on this device | The boxes are disabled, "Try again in 14:32", "Send a new code" |
| wait to resend | Resend pressed inside the 60 seconds | The countdown shows; the button stays disabled |
| signed in | The code passed and the owner check passed | "Signed in" for 600ms, then `next` or `/studio` |
| not the owner | The code passed, but the account isn't in `pm.owners` | Signed out at once. "This account can't open Studio." |
| signed out | After "Sign out" | "You're signed out." above step 1 |
| offline | No connection | "You're offline. Connect to sign in." The button is disabled |
| deep link | Arrived with `?next=` | "Sign in to open {page name}." above step 1 |

- **Live region:** a polite `aria-live` region announces each state change with the board's `announce` strings.
- **Rate limit from Supabase:** shown as the "wait to resend" or "too many tries" state, whichever matches the error.

**Session expiry while editing** (`StudioStates` › Session expired): a dialog, "You've been signed out", with "Email me a code" sent to the last address on this device. Edits stay in IndexedDB and sync after sign-in. The editor stays visible behind the dialog, read-only.

## Dashboard

Board: `StudioDashboard.dc.html` (populated, empty, loading).

- **Greeting:** "Good morning", "Good afternoon" or "Good evening" by local time, plus the profile's first name. The date is above it.
- **Stats:** Projects, Published ("Live"), Drafts ("Private"), "Site last published" with "View live".
- **Needs your input:** what the owner should do next, most urgent first:
  1. publish blockers on drafts, as chips naming the missing fields, with a "% complete" bar (fields filled ÷ recommended fields);
  2. flagged RICE rows;
  3. "Worth a check" facts ([07](07-v0-content.md#worth-a-check));
  4. failed link checks;
  5. scheduled posts that couldn't publish.

  Each row links to the exact field.
- **Recently edited:** the last five drafts saved, by `updated_at`.
- **Quick actions:** Upload media, Arrange the homepage, Write a post.
- **Empty** (no projects): "Your first volume starts here" with New project.
- **Loading:** the board's skeleton.

## Website builder

Board: `StudioSite.dc.html`. Tweaks: default, reordered, widget hidden, shelf selected, skill group selected, off duty item selected, phone preview, publish dialog. The rules are in [`docs/redesign/03`](../redesign/03-cms-architecture.md#website-builder). The layout is three columns: the outline, the inspector, and the live preview.

**Outline.** Every section in page order, each expandable to its items.

- **Each row has** a drag handle (`.hd`), the name, an eye switch, and, for sections, the nav label chip.
- **Reorder** by dragging, or focus the handle and press ↑ ↓. The hero is pinned first and the footer last. A moved row flashes (M-ST-FLASH), and the live region says "Skills is now 6 of 11."
- **Draft projects** keep their spot, greyed, with "Draft"; their eye can't be switched on.
- **"Add section"** at the end adds a text section or a new shelf before Contact.

**Inspector.** It shows the selected section's or item's settings. Each panel matches the board:

| Selected | Panel |
| --- | --- |
| Hero | The availability, positioning and intro fields, which edit `profile` directly. The motion switch. Floating previews: the project list (add, remove, reorder) and "At once: 1, 2, 3" |
| Shelf | Name, header (label above the title, title, second half in grey, intro), rows (1, 2, 3), and "See all" behaviour notes |
| A project in a shelf | Its card preview, "Move to …" another shelf, Star as lead, "Open in editor" |
| Writing | Header, "Latest 2, 3 or 4", RSS link on or off |
| About | Header, body paragraphs, points, photo |
| Experience, Testimonials | Header; the entries are edited in Profile & facts, linked from here |
| Skills | Label above the title, title, second half in grey, intro |
| A skill group | Show on the site, group name, subtitle, then the skill rows: drag handle (or ↑ ↓), editable name, size select (S, M, L, XL) and ✕. "Add a skill and press Enter" adds one at size M. "Position" moves the group |
| Off duty | Title, second half in grey, intro |
| An Off duty item | Title, label, text (with a "/200" counter), tag, the nine accent swatches, and the six art presets. On the first item, the favourites shelf: titles and notes, add, reorder, remove |
| Contact | The closing line and its red part, the intro |
| Footer | Credit, and whether "Last updated" shows |
| Text section | Header and a rich-text body (TipTap) |

Any section can get a nav label from its panel ("Show in the nav as …", max 14 characters).

**Preview.**

- **Devices:** a laptop, tablet or phone width switcher, rendering the draft profile and layout with the public components at that width.
- **Drafts and hidden items:** "Show drafts" and "Show hidden" add labelled placeholders for what visitors won't see.
- **Selecting:** clicking a section in the preview selects it in the outline.
- **Placeholders:** empty fields show the boards' "Add in Studio" placeholders here only, never on the site.

**Publish website.**

- The angled CTA opens the board's dialog, which lists every change since the last site publish: "Moved Testimonials above About", "Hid Off duty", "Changed the hero's positioning line".
- If unconfirmed facts are visible, it asks once more ("Publish with 3 unconfirmed?").
- Publishing calls `pm-publish` with `kind: 'site'` and shows the toast "Published. Live within a minute."

## Profile & facts

Board: `StudioProfile.dc.html` (default, all confirmed, availability off, publish with open items).

One long form, in sections: Hero, Proof strip, About, Experience, Testimonials, Contact and links.

**"Worth a check" fields** carry a warning chip and two choices: the live value and the alternative, each labelled with its source ("As on your current site", "As on your résumé"), or "Your call" to type a new value.

- Picking one, or typing, confirms the fact and removes it from `unconfirmed`.
- "Still true" confirms a fact without changing it, such as availability.

**The rest of the form:**

- **Experience:** each role's fields and highlights. "Remove the placeholder" appears on the hidden Wipro bullet. Switching a role off hides it on the timeline, which is the same `visible` flag as the builder's eye.
- **Testimonials:** each switch adds or removes the testimonial from the homepage carousel. There's no limit ([09](09-decisions.md), D14).
- **Contact and links:**
  - Email, LinkedIn, GitHub;
  - Phone, with "Show my phone number on the site", off by default;
  - Résumé, an uploaded PDF or a link, with "Replace in Media →";
  - "'Let's Talk' goes to": Contact section, Email, LinkedIn, or a booking link (which asks for the URL).

**Publishing.** "Publish profile" runs the same site publish as the builder: profile and layout together. The "publish with open items" state is the extra confirmation.

The hero live preview on the right updates as the form changes.

## Projects

Board: `StudioProjects.dc.html` (default, dragging, layout changed, menu open, delete confirm, filtered, no results, loading, error).

- **Grouped by shelf**, in homepage order. Each group header has "Edit shelf in Website".
- **Each row:** #, a cover thumbnail, the title, status ("Published", "Edits not live", "Draft"), the lead star, "Updated", and a ⋯ menu.
- **The ⋯ menu:** Edit, Preview draft, Duplicate as draft, Unpublish (or Publish), Delete…
- **Reorder:** drag, or ↑ ↓ on a focused handle. Reordering is paused while a filter or search is on ("Reordering is paused while a filter or search is on. Show all").
- **Layout changes** don't publish anything until the owner says so. The sticky bar "Homepage layout changed, not live yet" has Discard and Publish; Publish runs the site publish.
- **Star:** makes the project the shelf's lead (`shelf.lead`).
- **Filters:** All, Published, Drafts, plus search by title or company.
- **Delete:** the type-to-confirm dialog (`StudioStates` › Delete), with "Unpublish instead". It's a soft delete with Undo for 7 seconds.
- **Phones** (`StudioMobile`): rows as cards; "Reorder" switches to a mode with ↑ ↓ buttons.

"New project" creates a draft with a generated id and slug `untitled-n`, in the shelf it was started from, and opens the editor.

## Project editor

Boards: `EditorOverview`, `EditorVisuals`, `EditorCaseStudy`, `EditorOutcomes`, `EditorSettings`. Each has Tweaks for saving, offline, save failed and the publish states.

**The header**, the same on every tab:

- the breadcrumb "Projects · {shelf} · {volume}";
- the status chip;
- the save status;
- Preview, and the angled "Publish changes" (or "Publish" for a first publish).

**Tabs:** Overview, Visuals, Story, Outcomes, URL & SEO. A dot on a tab means "has unpublished edits". On iPad the card preview folds into a sheet; on phones the tabs scroll sideways (`StudioTablet`, `StudioMobile`).

### Overview

- **Basics:** title (with a /60 counter and the hint "Sentence case reads best"), company or client, card label, one-line summary (/140), homepage shelf, kind of work (Shipped, Strategy study, Prototype), and topics with the topic picker (S1).
- **Case-study summary:** The problem, What I proposed, each /280 ([09](09-decisions.md), D25).
- **Your part in it:** My role (recommended; empty hides the "My role and decisions" chapter), Timeline, Team. A chip counts the empty fields.
- **Links:** PRD or document (`https:` only, shown as "Read the PRD"), and the prototype link, which is edited in Visuals and shown here read-only.
- **The card preview** on the right updates live.

### Visuals

- **Top of the page:** Image, Video or Prototype.
  - **Prototype:** link, poster, frame (Phone, Tablet, Desktop, None), and start (On click, When scrolled into view). Pasting a link runs `pm-check-link` and shows its result as on the board: login required, can't be embedded, or a Vercel preview link.
  - **Video:** the link, checked against the supported hosts, with the Drive sharing check.
- **Accent colour:** the nine swatches. An accent already used by another project on the same shelf is named in the swatch's label and the hint ([09](09-decisions.md), D26).
- **Cover image and crops:**
  - click, or focus and use the arrow keys, to set the focal point, which updates the 16:10, 4:5 and 1.91:1 crops;
  - cover alt text is required.
- **Gallery:** upload, reorder, caption, alt text or "Decorative", with the upload states from `StudioStates`.

### Story

Board: `EditorCaseStudy.dc.html` (add block, empty chapter, re-ranked, text selected, dragging chapter, saving, offline, save failed, publish).

**Chapters** are on the left: drag, or ↑ ↓; "Add chapter"; a title field. An empty chapter shows "Nothing here yet, so this chapter is hidden on the live page."

**Blocks** are in the middle:

- **Adding:** "Add block" opens the type menu: Text, Heading, List, Quote, Callout, Metrics, Table, Image, Gallery, Before/after, Video, Prototype, Journey, Ownership, Cards, Divider.
- **Each block's toolbar:** move up or down (and drag), duplicate, delete with Undo.
- **Text blocks** use TipTap, restricted to the allowlist. Selecting text shows a bubble menu with Bold, Italic and Link.

**The RICE table** has the panel on the board:

- the switches (check the formula, sort by score, highlight the top 3, cards on phones);
- a flagged row shows "its inputs give 11.3 … but its score says 5.7", with three fixes: "Use 11.3 and re-rank", "Set effort to 3 mo", "Keep as is";
- after a re-rank, a warning names any callout or chapter that still mentions the old order, with Undo.

Keyboard moves give the ring highlight (M-ST-RING).

**Phones:** one chapter at a time behind a switcher, and tables as cards.

### Outcomes

Board: `EditorOutcomes.dc.html` (achieved without evidence, new result, no results, publish states).

Each result has:

- a number and "What it measures";
- a type of result (required), from the five labels with their definitions on the right;
- whose result it is: My ownership, Team result or Business outcome;
- evidence ("Only you see this"), required for Achieved;
- "Show in the page's results strip".

Choose the card headline from the results. The live preview shows the strip and the card headline.

**The honesty check** runs as the owner edits and again at publish, with the board's `honesty()` rules and copy:

| Check | Level |
| --- | --- |
| "Result n is marked achieved with no evidence note." | Error: blocks publishing |
| An Achieved result on a project whose kind isn't Shipped: "Achieved results usually come from shipped work. Is {value} measured?" | Warning |
| A Projected result without a note: "Note the method, so you can explain it." | Warning |
| A result without "Whose result": "Result n doesn't say whose result it is." | Warning |
| The headline is a Target and is labelled so | Passed (shown with a tick) |
| Every result has a label | Passed |

### URL & SEO

Board: `EditorSettings.dc.html` (address changed, address taken, invalid address, unlisted, preview link, delete confirm, publish states).

- **Page address:** `[domain]/work/` plus the slug field.
  - It's checked as the owner types: "Checking…", then available, taken (with "Use {suggestion}"), or invalid.
  - "Redirect the old address here" is on by default once the page has been published.
- **Search and link previews:** search title and description, both falling back to Overview, with Google and LinkedIn previews. The link preview image is made from the cover, or uploaded at 1200 × 630.
- **Who can find it:** Public or Unlisted, plus "Let search engines index this page".
- **Share a private preview:**
  - "Create preview link" calls `pm-preview` and shows the link once, with Copy, the expiry and Revoke;
  - active links are listed by creation date and expiry, never by token.
- **Unpublish, Delete:** the dialogs from `StudioStates`.

### Publishing a project

"Publish changes" opens the checklist dialog (`StudioStates` › Publish changes):

- **Ready:** what will update, and what will stay hidden ("My role is empty, so that chapter stays hidden"). Then Publish now.
- **Blocked:** "Fix 2 things to publish". Each item links to its field and tab. Drafts keep saving while the owner fixes them.
- **Publishing:** the spinner. Then the toast "Published. Live within a minute." with View ↗.

The checks are `pm-publish`'s, run in the browser first for instant feedback and again on the server ([06 · pm-publish](06-backend.md#pm-publish)).

## Writing

Board: `StudioWriting.dc.html` (writing a draft, many topics, topics dropdown open, no posts yet, publish dialog, scheduled, published).

**The list:**

- Drafts, Scheduled and Published tabs, with counts; "New post".
- **Ideas from your résumé:** each visible experience highlight from the profile, offered as a possible topic: "From: {company}". "Start a draft" creates a post whose working title is the highlight's text. Nothing is invented, and nothing is published.

**The editor:**

- cover (optional, alt text required), title, subtitle;
- blocks: Paragraph, Heading, Quote, Image, Embed, Code;
- the word count and reading time.

**Post settings:**

- **Address:** `/writing/<slug>`, from the title until edited.
- **Excerpt**, max 160.
- **Topics**, with the topic picker (S1).
- **When:** "Publish now", or "Schedule" with a date and time in the owner's time zone.
- **"Show on my homepage"**, and an optional canonical link.
- **Facts you can cite:** confirmed facts with their labels; clicking one adds a `fact` block at the end.
- **Search preview.**

**Publishing** opens the dialog. A scheduled post shows "Scheduled for 14 Oct, 09:00" and can be unscheduled. A schedule failure (`schedule_error`) shows "Couldn't publish" with the reason on the post and on the dashboard.

## Media

Board: `StudioMedia.dc.html` (default, uploading, needs alt text, delete blocked, empty filter).

- **Storage meter:** used out of the plan's share for the portfolio. "Prototypes and videos are links, so they don't count."
- **Upload:** drop or browse, running the pipeline in [06 · Storage](06-backend.md#storage). Rejected files show the messages from `StudioStates` › Upload problems: too large, a video file, a prototype file, a paused upload, a HEIC conversion.
- **Filters:** All, Images, Documents, "Needs alt text · n", "Not used anywhere · n", plus search.
- **The detail panel:** a preview, the file name, alt text (required to publish; "Used wherever this image appears. Projects can override it."), "Decorative", "Used in" with links, Replace file, Download, Delete….
- **Delete is blocked** while a file is in use. The dialog lists where.
- **Phones:** the upload sheet offers Camera, Library or Files, and asks for alt text right after the upload (`StudioMobile`).

## Draft preview

Board: `StudioPreview.dc.html` (desktop, tablet, phone, compare desktop, compare phone, share open).

- **The bar:** "Back to editor", "Draft preview · not public · noindex", the device switcher, "Highlight changes", "Compare with live", "Share preview" and "Publish changes".
- **The page:** the draft rendered with the public components at the chosen width, read directly with the owner's session.
- **Highlight changes:** outlines every block that differs from the published version, with "Changed since the live version".
- **Compare with live:** the published page side by side, scrolling together.
- **Share preview:** creates a link, as in URL & SEO.
- **Studio-only notes:** at the end, for example "'My role and decisions' and 'Learnings and next steps' are empty, so the live page skips them."

## System states

Board: `StudioStates.dc.html`. Every state on it is built and reachable:

- the saving states;
- toasts: published, undoable delete, copied, failed action;
- confirmations: publish ready, publish blocked, unpublish, delete with type-to-confirm, discard the homepage layout, leaving with unsynced changes (`beforeunload` plus an in-app dialog for Studio routes);
- the session expired dialog;
- "Edited somewhere else": the conflict dialog with Keep mine and Load latest, naming what changed on each side;
- the offline, save-failed and resend-wait banners;
- upload problems;
- empty states: first run, no media, empty chapter, no results;
- loading skeletons.

## Accessibility and keyboard

- **Keyboard:** every drag has a keyboard path: focus the handle, then ↑ ↓. Enter or Space picks up and Esc cancels, with `@dnd-kit`'s keyboard sensor and live announcements.
- **Dialogs** trap focus, close on Esc (except while publishing), and return focus to their trigger.
- **Form errors** use `aria-invalid` and `aria-describedby`, and the publish checklist links focus to the field.
- **Touch targets** are 44px on iPad and phones.
