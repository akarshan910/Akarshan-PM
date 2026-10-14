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
| Laptop (≥ 1280) | Sidebar, `flex: 1 1 232px; max-width: 256px`: the "Studio." wordmark with the mono label "CMS", Dashboard, Website, Projects (with count), Writing, Media, a divider, "View live site ↗", then the account card at the bottom |
| iPad | A 72px icon rail with the same items and labels as tooltips. Landscape uses the full sidebar, as on the board |
| Phone | A five-tab bottom bar: Home, Website, Projects, Writing, Media. The account menu is under Home |

- **The account card** shows the signed-in address and "Owner · Sign out". It opens the account menu (`StudioAuthFlow` › Path 7): "Signed in with an email code", "Owner", then "Sign out" and "Sign out on all devices" ([06 · Client code](06-backend.md#client-code)).
- **Save status** sits in every editor's header (`StudioStates` › Saving): "All changes saved", "Saving…" with the pulsing dot, "Offline · saved on this device", or "Couldn't save" with Retry. It never hides.
- **Toasts** appear bottom centre, one at a time; destructive actions get Undo for 7 seconds.
- **Banners** for offline and save failures sit under the editor header.

**Data layer.**

- Queries use TanStack Query, keyed by table and id, so a save in one tab refreshes another tab's view.
- Writes go through one `useAutosave(doc)` hook: the 800ms debounce, the version check, the offline queue ([06 · Autosave](06-backend.md#autosave)).
- Every Studio module is a lazy route chunk, so the public bundle never contains Studio code.

## Sign-in

Boards: `StudioLogin.dc.html` (every state in Tweaks) and `StudioAuthFlow.dc.html` (every path, laptop and phone). Plumbing: [06 · Auth](06-backend.md#auth). Components: S2 code input, M-ST-OTP.

**The layout** has two columns:

- **The brand panel** (`#0B0B0E`, `flex: 1 1 420px`): the "Studio." wordmark, "Edit the portfolio. / Not the code.", and three ticked lines.
- **The form column** (max 440px, centred on `--bg`): one of two steps.

Phones show the wordmark above the form, without the panel (`StudioAuthFlow` › Path 1 · phone).

**Step 1, email:**

- "Sign in to Studio", the intro, then the field "Email": `type="email"`, `inputmode="email"`, `autocomplete="email"`, `autocapitalize="off"`, `spellcheck="false"`, placeholder "you@example.com". It's prefilled from `studio.email` on this device.
- The button "Email me a code" (`.pbtn`, 52px), then the two notes from the board.
- Turnstile runs invisibly and appears only in the "bot check" state.

**Step 2, code:**

- "Use a different email" is a back link above the heading.
- "Check your email", then "If **{masked}** owns this site, a 6-digit code is on its way. It expires in 10 minutes." The address is masked as the board's `mask()` does: `a••••••••0@gmail.com` (up to 8 dots).
- The label "6-digit code", the six code boxes, and the hint "Paste the code, or type it. It signs you in as soon as all six digits are in."
- "Sign in".
- "Didn't get it? [Resend code in 0:52] Check spam, or use a different email." The countdown runs from 60, then the link becomes "Resend code".

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
| too many tries | 5 wrong codes on this device | "Too many tries. To keep Studio safe, ask for a new code in 14:32." The boxes are `.off` and "Sign in" is disabled. "Send a new code" stays enabled |
| wait to resend | Resend pressed inside the 60 seconds | "A code was sent moments ago. You can ask for another in 0:42." The resend link stays disabled |
| signed in | The code passed and the owner check passed | "Welcome back" and "You're signed in on this device until you sign out.", with "Open the dashboard". Then go to `next` or `/studio` |
| not the owner | The code passed, but the account isn't in `pm.owners` | Signed out at once. "This account can't open Studio" and "Studio is private to the site owner. You've been signed out, and nothing was created or shared." Then "Use a different email" and "Go to the portfolio" |
| signed out | The session ended while editing (expired, revoked, or signed out elsewhere) | "You've been signed out. Sign in again to keep editing. Your unsaved changes are kept on this device." above step 1, with the email prefilled |
| offline | No connection | "You're offline. Connect to the internet to get a sign-in code." and a "Try again" link |
| deep link | Arrived with `?next=` | "After you sign in, you'll go straight back to **{page name}**." above step 1. After the code, Studio opens that page, not the dashboard |

- **Live region:** a polite `aria-live` region announces each state change with the board's `announce` strings.
- **Rate limit from Supabase:** shown as the "wait to resend" or "too many tries" state, whichever matches the error.

**Session expiry while editing** (`StudioStates` › Session expired, `StudioAuthFlow` › Path 6):

- A dialog, "You've been signed out", with "Email me a code", sent to the last address on this device.
- Edits stay in IndexedDB. The editor stays visible behind the dialog, read-only.
- After sign-in, Studio returns to the same page, syncs the edits and shows "✓ Signed in. 3 changes synced."

**Signing out** (`StudioAuthFlow` › Path 7): after "Sign out" or "Sign out on all devices", Studio shows its own page. That page reads "You're signed out", "Studio is closed on this device. Your published site isn't affected.", "Sign in again" and "Go to the portfolio". It isn't the "signed out" state above.

## Dashboard

Board: `StudioDashboard.dc.html` (populated, empty, loading).

- **Greeting:** "Good morning", "Good afternoon" or "Good evening" by local time, plus the profile's first name. The date is above it. Below it, one line on what needs doing, for example "Four drafts need your input before they can go live."
- **Header buttons:** "Edit website" (`.btn`) and the angled "+ New project" (`.cta`).
- **Stats:** Projects, Published ("Live"), Drafts ("Private"), "Site last published" with "View live".
- **Needs your input:** a count ("5 items") in the header, then what the owner should do next, most urgent first:
  1. publish blockers on drafts, as chips naming the missing fields, with a "% complete" bar (fields filled ÷ recommended fields);
  2. flagged RICE rows;
  3. "Worth a check" facts ([07](07-v0-content.md#worth-a-check));
  4. failed link checks;
  5. scheduled posts that couldn't publish.

  Each row links to the exact field. Draft rows end "Continue →", and the RICE row ends "Review in case study →".
- **Recently edited:** the last five things saved, by `updated_at`: projects, posts and website parts ("Website · hero"), each with a relative time.
- **Quick actions:** Upload media, Arrange the homepage, Write a post.
- **Empty** (no projects): the title "Welcome to Studio", then "Your first volume starts here", "Add your first project. It stays a private draft until you publish it." and New project.
- **Loading:** the board's skeleton.

## Website builder

Board: `StudioSite.dc.html`. Tweaks: default, reordered, widget hidden, shelf selected, skill group selected, off duty item selected, phone preview, publish dialog. The rules are in [`docs/redesign/03`](../redesign/03-cms-architecture.md#website-builder).

The builder uses the icon rail even on laptop. Its three columns are the outline (336px), the live preview, and the inspector (330px).

**Header:**

- "Studio / Website", the title "Website", and the "Live" chip;
- "{n} changes not live" while there are unpublished changes;
- the save status;
- Discard, only with changes. It restores the last published layout and announces "Changes discarded.";
- Preview;
- the angled "Publish website", disabled when there's nothing to publish.

**Outline.** The card is titled "Homepage", with "{n} of {m} sections on". A pinned "Navigation" row comes first, with "{n} links". Then comes every section in page order.

- **Each section row has** a drag handle (`.hd`), a chevron that expands it to its items, the name, chips, a "live/total" count, and an eye switch.
  - The chips are "Nav · {label}" when the section is linked in the nav. Notes are "No posts yet" on Writing, and "Nothing live yet" on a shelf with nothing published.
  - Hero and Footer show "First" and "Last" in place of the handle.
- **Items** are each section's parts. Each has a handle, a name and an eye:
  - Hero: Availability chip, Location, Name, Brush underline, Positioning line, Intro, Buttons, "Speed lines + tilt" (the motion switch, `hero.motion`), Floating previews;
  - Proof strip: the stats;
  - Writing: Latest posts, RSS link;
  - About: Text, Photo;
  - Contact: Closing line, Email, LinkedIn, GitHub, Résumé;
  - Footer: Credit line, Last updated;
  - the entries of shelves, Experience, Skills, Testimonials and Off duty. A testimonial that's on shows a "Homepage" chip.
- **Hidden rows** are greyed and struck through. The eye's tooltip says "On the site" or "Hidden"; for items, "On the homepage" or "Off the homepage. Still on /work and at its own address".
- **The hero's eye is locked.** Pressing it announces "The hero always shows. Hide its parts instead." The footer can be hidden.
- **Reorder** by dragging, or focus the handle and press ↑ ↓. The hero stays first and the footer last. A moved row flashes (M-ST-FLASH). The live region says "Skills is now section 8." for a section, "Arcana Workspace is now 1 of 5." for an item, and "{name} moved." after a drag.
- **Draft projects** keep their spot with a "Draft" chip. Their eye can't be switched on: its tooltip is "Publish the project first", and pressing it announces "Drafts stay off the site until you publish them."
- **"Add section"** at the end adds "Text section {n}" before Contact and announces "Text section added before Contact."
- The hint below the outline: "Drag a handle, or focus it and press ↑ ↓. The eye turns anything on or off. Hero and footer stay pinned."

**Inspector.** It shows the selected section's or item's settings.

- **The panel's header:** a kind label, the title, and a one-line description. An item adds "Back to {section}".
- **Under the header:**
  - every section and item except the Navigation row has "Show on the site" (locked on for the hero);
  - every section except Hero, Proof strip and Footer has "Link it in the nav", which reveals the nav label input (uppercase mono, max 14 characters, as in [06](06-backend.md#site-layout));
  - every movable section and item ends with "Position", ↑ "n / m" ↓.
- **Hero, Proof strip, Experience, Testimonials and Contact** (and their items) also show "Names, numbers and roles are confirmed in Profile & facts →".

Each panel matches the board:

| Selected | Panel |
| --- | --- |
| Navigation (pinned) | "Always on, always first." The note "The pill nav keeps your current design. Its links follow the order of the sections linked in the nav. Turn a link on or off from each section.", then the link chips and "Let's Talk →" |
| Hero, or its Availability chip, Positioning line or Intro item | "Availability chip" (hint "From your current site. Keep it only while it's true."), "Positioning line", "Intro". They edit `profile` directly |
| Floating previews (a Hero item) | "Projects that float": one row per project with ✕, and "+ VOL.n" chips to add the rest. "On screen at once": 1, 2, 3, with the hint "On laptops. iPad shows one and phones none. Visitors who prefer less motion see them standing still." Then the note "Drafts can be added now. They start floating once they're published." There's no reorder. Announced "{title} added to the floating previews." or "… removed from the floating previews." |
| Shelf | "Shelf title", "Intro", and "Rows on the homepage": 1, 2, 3 (hint "Past this, the last card becomes “See all”."). Then the note "The first visible project is the lead card. Drag projects in the outline, or open one to edit its page. All projects →". **Beyond the board:** "Label above the title" and "Second half, in grey" (`header.kicker`, `header.titleMuted`) sit in the same panel, styled like the board's fields, with the Skills panel's hints. The shelf's short `name` is edited in the panel's title |
| A project in a shelf | Thumbnail, title and company; the status chip, "Published" or "Draft · not on the live site"; "Edit the project page"; "Move to {other shelf}". The hint is "First on its shelf, so it's the lead card.", "Drag it to the top of the shelf to make it the lead card." or, for a draft, "It takes this spot as soon as you publish it." |
| Writing | "Posts on the homepage": "Latest 2", "Latest 3", "Latest 4". With no posts: "No posts yet, so this section stays off the live site until you publish your first one. Write a post →". RSS is the "RSS link" item's eye |
| About | "About text". The photo is the "Photo" item's eye; the photo itself and the points are in Profile & facts |
| Experience, Testimonials | The entries are edited in Profile & facts, linked from here |
| Skills | "Label above the title" (hint "The small label in red, for example “Skills”. Leave it empty to hide it."), "Title", "Second half, in grey", "Intro" (hint "Leave it empty to hide it."), and the board's note |
| A skill group | "Group name" (hint "Shown big and outlined in the cloud."), "Subtitle", then "Skills and their size" (hint "S, M, L or XL. Size is emphasis: keep two or three big and most at M."). Each skill row has a handle (↑ ↓), an editable name, a size select (S, M, L, XL) and ✕. "Add a skill and press Enter" adds one at size M. Announced "{skill} added", "{skill} removed", "{skill} is now n of m." |
| Off duty | "Title", "Second half, in grey", "Intro" (hint "Leave it empty to hide it."), and the board's note |
| An Off duty item | "Title" and "Label" side by side; "Text" (hint "About 200 characters fits every panel size.", an "n/200" counter, red past 200); "Tag"; "Accent", the nine swatches; "Art": Kunai, Pencil, Paddle, Pan, Plane, Camera. On the first item, "Shelf of favourites" (hint "Shown as volume spines under this panel."): one row per favourite, "{title} · {note}" with ✕, then "+ Add a favourite". There's no reorder |
| Contact | "Closing line". The links are the items' eyes |
| Footer | Its items: Credit line and Last updated |
| Text section | "A free text section." Header and a rich-text body (TipTap) |

**Preview.**

- **Devices:** "Desktop" or "Phone". Desktop renders 1280 wide at half size; Phone renders 390 wide at 0.9. Both show the draft profile and layout with the public components. On Phone, the nav shows "Menu" and the floating previews hide.
- **Drafts and hidden items:** "Show hidden" and "Show drafts", both on by default, add labelled placeholders for what visitors won't see:
  - hidden sections show "{section} is hidden";
  - an empty section shows "{section} has nothing turned on";
  - an empty shelf shows "{shelf}: nothing published yet, so it's hidden on the live site";
  - Writing shows "Writing appears with your first post";
  - draft cards are at 75% opacity with "DRAFT · NOT LIVE".
- **Selecting:** clicking a section in the preview selects it in the outline. The selected section has a 3px `#D61F33` outline and a name tag.
- **Placeholders:** empty fields show the boards' "Add in Studio" placeholders here only, never on the site.

**Publish website.**

- **The dialog:**
  - the kicker "Publish website", the title "Update the live homepage?", and "Only these changes go live. Project pages and drafts aren't touched.";
  - "{n} changes", then the list, worded as the board's `changes()`: "Moved Testimonials above About", "Hid Off duty", "Edited hero positioning line", "Navigation: renamed Exp to Experience", "Floating previews: 2 at once";
  - "Preview first", Cancel (focused on open; Esc closes), and "Publish now", which becomes "Publishing…".
- **Unconfirmed facts:** if any are visible, Profile's "Publish with {n} unconfirmed?" step runs first (see [Profile & facts](#profile--facts)).
- **Publishing** calls `pm-publish` with `kind: 'site'`. The toast reads "Homepage published. It updates within a minute." with "View live ↗", for 7 seconds.

## Profile & facts

Board: `StudioProfile.dc.html` (default, all confirmed, availability off, publish with open items).

**The header:** "Studio / Website / Profile & facts", the title, and "Your name, title and the numbers people check, in one long form. Confirm facts here; order and visibility live in Website." Then the save status, Preview and the angled "Publish profile".

**The form** is one long column, in sections: Hero, Proof strip, About, Experience, Testimonials, Contact and links.

- **Hero:**
  - Name;
  - Job title, as two radio cards, each labelled with its source;
  - "Positioning line", with the hint "One sentence. Says what you build and why it matters." Its counter shows "n/100" and turns red past 100. The hard limit is 220 (06);
  - Location;
  - "Show availability in the hero" with its text field. The hints are "From your current site. Keep it only while it's true.", "Shown as a small chip in the hero." and, when off, "Off. Turn it on only if you want to say it publicly."
- **Proof strip:** the four stats with "{n} to confirm".
- **About:** the text.
- **Experience:** "Add role", then each role with its dates and a switch labelled "Show {role} at {company} on the site".
- **Testimonials:** each has initials, name, role, tag, a "Homepage" switch and ↑ ↓.
- **Contact and links** (below).

**"Worth a check" fields** show the "Your call" or "Needs your call" chip, the note, and one button per value, with the board's labels (for example "Use 230M+" / "Use 300M+", "Show the $2M total" / "Show Tracfone's $1.4M"). Job title shows two radio cards labelled with their sources: "As on your résumé (…)", "As on your current site".

- Picking one confirms the fact and removes it from `unconfirmed`. The chip becomes "Résumé figure" or "Site figure"; a stat that already matches shows "Matches résumé".
- "Still true" confirms a fact without changing it, such as availability.
- **Per D5 and D30, an unconfirmed fact publishes with its live value** ([09](09-decisions.md)). The board's copy that leaves numbers off the site is overridden:
  - the hero preview shows the live value, not "—" and "Hidden until you confirm";
  - the "30 Cr+" row starts on, as the fourth live hero stat. Its note reads as any other Worth a check row, not "left off";
  - the checklist summary reads "{n} to confirm. The live value stays until you pick one."

**The rest of the form:**

- **Experience:** "Remove the placeholder" appears on the hidden Wipro bullet and announces "Placeholder removed." Switching a role off hides it on the timeline, which is the same `visible` flag as the builder's eye.
- **Testimonials:** each switch adds or removes the testimonial from the homepage carousel. There's no limit ([09](09-decisions.md), D14). The board's "n of 3 on the homepage" chip reads "{n} on the homepage".
- **Contact and links:**
  - Email, LinkedIn, GitHub;
  - Phone, with "Show my phone number on the site", off by default;
  - Résumé, an uploaded PDF or a link, with "Replace in Media →";
  - "“Let's Talk” goes to": "Contact section", "Email", "LinkedIn" or "A booking link". A booking link asks for the URL ("https://… your booking page"). Each option has the board's hint, for example "Scrolls to Contact, as your site does today. If Contact is hidden, it opens an email."

**On the right:**

- "Hero · live preview" updates as the form changes;
- "Before you publish": a ✓ or ! row per open item (board `checks`), with a summary.

**Publishing.** "Publish profile" runs the same site publish as the builder: profile and layout together.

- **Nothing open:** the toast "Profile published. The homepage updates within a minute."
- **Open items:** the dialog "Publish with {n} unconfirmed?" first, with the text "Where your current site and résumé disagree, the live value stays until you pick one. Everything else goes live now." Its buttons are "Keep editing" (focused) and "Publish". The board's body text and its "Publish the rest" button are overridden (D5). Publishing then shows the same toast.

### More fields

These profile fields have no board editor. Build them as plain forms in the same sections, with the boards' field styles (`.fld`, `.lbl`, `.inp`, `.hint`, `.cnt`, switches and ↑ ↓ buttons). The hero button label is max 24; other limits come from [06 · Profile](06-backend.md#profile).

| Section | Fields |
| --- | --- |
| Hero | Hero button: label (max 24) and link; "Show the Résumé (PDF) button" (`heroButtons`) |
| About | Points: title and text each, with add, ↑ ↓ and remove |
| Proof strip | "Problem spaces": the label and the chips (`spaces`); add, remove, reorder |
| Experience | Education: school, degree, dates; add, ↑ ↓, remove |
| Testimonials | Each testimonial, opened from its row: quote, name, initials, role, tone (the nine accent swatches), tag, LinkedIn link |

## Projects

Board: `StudioProjects.dc.html` (default, dragging, layout changed, menu open, delete confirm, filtered, no results, loading, error).

- **The header:** "Studio / Projects", "Projects", the line "This order is your homepage order. Drag a row, or focus its handle and use the arrow keys. Arrange the whole homepage in Website →", and "New project".
- **Grouped by shelf**, in homepage order. Each group header has "{n} on this shelf" and "Edit shelf in Website".
- **Columns:** #, Project, Status, Lead, Updated. A row has a cover thumbnail, the title, and a status:
  - "Published", "Edits not live", or "Draft" with "{n}% ready";
  - then the lead star, "Updated", and a ⋯ menu.
- **The ⋯ menu:** Edit, Preview draft, Duplicate as draft, then one of three:
  - Unpublish, for a published project;
  - "Review and publish", for edits not live;
  - Publish, for a draft. It's disabled with "{n} required fields missing" until the draft passes.

  Then Delete….
- **Reorder:** drag, or ↑ ↓ on a focused handle. Announced "{title}, position n of m on {shelf}." Reordering is paused while a filter or search is on ("Reordering is paused while a filter or search is on. Show all").
- **Layout changes** don't publish anything until the owner says so. The sticky bar has:
  - "Homepage layout changed, not live yet" and "Publishing updates the homepage only. Drafts stay drafts.";
  - Discard, which announces "Layout changes discarded.";
  - "Publish layout", which becomes "Publishing…", runs the site publish and toasts "Homepage layout is live."
- **The lead card** is the first visible project on its shelf. There's no separate lead field.
  - The star moves the project to the top of its shelf. It's announced "{title} moved to the top. It is now the lead card on {shelf}."
  - The tooltips are "Lead card: first on its shelf" and "Move to the top as the lead card".
  - Starring the current lead announces "{title} is already the lead card. Star another project to replace it."
  - The note under the list: "★ The first project on a shelf is its large lead card. Star another to move it to the top. Drafts keep their place but stay hidden until published."
- **Filters:** "All", "Published", "Drafts" with counts, plus search ("Search by title or company"). No match: "No projects match “{q}”", "Try a company name, like SugarFit or Zynga.", "Clear search". An empty shelf in a filter: "Nothing on this shelf matches."
- **Duplicate as draft:** toasts "Duplicated as a draft: Copy of {title}." with Undo ("Copy removed.").
- **Unpublish:** toasts "“{title}” is off the live site and back to draft." with Undo ("“{title}” is live again.").
- **Delete…** opens a confirm dialog with no typing:
  - "Delete “{title}”?", with the board's `confirmBody`: one text for a published project (its link stops working), another for one never published;
  - "Unpublish instead", Cancel, "Delete project".

  It's a soft delete. The toast "Deleted “{title}”." has Undo for 7 seconds ("Restored “{title}”."). The type-to-confirm delete belongs to [URL & SEO](#url--seo).
- **Error:** "Couldn't load your projects", "Studio couldn't reach the database. Check your connection and try again. Nothing on your live site has changed.", Try again.
- **Phones** (`StudioMobile`): rows as cards; "Reorder" switches to a mode with ↑ ↓ buttons.

"New project" creates a draft with a generated id and slug `untitled-n`, in the shelf it was started from, and opens the editor.

## Project editor

Boards: `EditorOverview`, `EditorVisuals`, `EditorCaseStudy`, `EditorOutcomes`, `EditorSettings`. Their Tweaks:

| Board | Tweaks |
| --- | --- |
| `EditorOverview` | default, saving, offline, save failed, validation error, publish dialog, publish blocked, publishing, published |
| `EditorVisuals` | default, uploading, missing alt text, publish blocked, video hero, video link error, video from Google Drive, prototype preview link, prototype can't embed, saving, offline, save failed, publish dialog, published |
| `EditorCaseStudy` | default, add block, empty chapter, re-ranked, text selected, dragging chapter, saving, offline, save failed, publish dialog, published |
| `EditorOutcomes` | default, "achieved, no evidence", new result, no results, saving, offline, save failed, publish dialog, published |
| `EditorSettings` | default, address changed, address taken, invalid address, unlisted, preview link, delete confirm, saving, offline, publish dialog, published |

**The header**, the same on every tab:

- the breadcrumb "Projects · {shelf} · {volume}";
- the status chips: "Published", "Edits not live";
- the save status, with Retry after a failure;
- Preview, and the angled publish button. It reads:
  - "Publish changes" while there are unpublished edits ("Publish" for a first publish);
  - "Published", disabled with a tick, when everything is live;
  - "Reconnect to publish" while offline.

**Banners:** "You're offline. Keep editing. Changes are kept on this device and sync when you reconnect. Publishing is paused." and "Your last change didn't save. Studio will keep retrying. Keep this tab open until it says Saved. Retry now".

**Tabs:** Overview, Visuals, Story, Outcomes, URL & SEO. A dot on a tab means "has unpublished edits" (its label adds ", has unpublished edits"). On iPad the card preview folds into a sheet; on phones the tabs scroll sideways (`StudioTablet`, `StudioMobile`).

### Overview

- **Basics:**
  - **Title** (Required): the hint "Sentence case reads best. Keep it under 60 characters." The counter shows "n/60" and warns past 60. Zod's hard limit is 80.
  - **Company or client** (Required).
  - **Card label:** "Shown after the company, in small caps."
  - **One-line summary** (Required): "The card's summary and the default search description. Say what you built and why." It has a /140 counter.
  - **Homepage shelf** and **Kind of work:** Shipped, Strategy study, Prototype.
  - **Topics,** with the topic picker (S1). The board's older chip-and-input control ("Add a topic and press Enter") is replaced by S1 (D23).
- **Validation** (tweak "validation error"): "Title is required." / "Add a title. It's used on the card, the page and in search."; "Summary is required." / "Add a summary. The card and search results need it."; "Summary is over 140 characters." / "Trim to 140 characters so it fits on the card."; "PRD link must start with https://".
- **Case-study summary:** "The problem" ("One or two sentences. Bold is allowed.") and "What I proposed" ("Keep it to the decision, not the whole plan."), each /280. Each hides while empty ([09](09-decisions.md), D25).
- **Your part in it:**
  - My role (Recommended). While it's empty, its hint reads "Empty, so the “My role and decisions” chapter is hidden.";
  - Timeline and Team;
  - the chip "{n} of 3 empty".
- **Links:** "PRD or document" (`https:` only, shown as "Read the PRD"). The interactive prototype link shows here read-only, with "Manage in Visuals →".
- **On the right:**
  - "Homepage card · live preview", "Updates as you type";
  - "Where this appears";
  - "The {headline} headline comes from Outcomes".

### Visuals

- **Top of the page:** Image, Video or Prototype.
  - **Prototype:**
    - link, poster ("Shown until a visitor loads the prototype."), frame (Phone, Tablet, Desktop, None), and "Starts": On click, When scrolled into view. Each start option has the board's hint;
    - pasting a link runs `pm-check-link` and shows the board's result:
      - "Prototype link checked: public, and it loads in a frame.";
      - "Prototype link works. Its site blocks embedding, so visitors get an Open button.";
      - "This is a Vercel preview link, which asks visitors to log in. Paste the production address instead.";
      - "Figma prototype: it plays in Figma's embed.";
      - "Use an https:// address.".
  - **Video:**
    - the link: YouTube, Vimeo, Loom or Google Drive;
    - another host shows "That link isn't from YouTube, Vimeo, Loom or Google Drive. Paste the share link from one of them.";
    - Drive adds the sharing check note;
    - the poster: "Uses the cover image below, cropped to 16:10."
- **Accent colour:** the nine swatches. An accent already used by another project on the same shelf is named in the swatch's label (", also used by {title}") and the hint ([09](09-decisions.md), D26).
- **Cover image and crops:**
  - click, or focus and use the arrow keys, to set the focal point, which updates the 16:10, 4:5 and 1.91:1 crops ("Focal point moved.");
  - cover alt text is required, with a /250 counter.
- **Gallery:**
  - "Add images", for PNG, JPG, WebP or GIF up to 10 MB. Larger files show "Too large · max 10 MB";
  - select an image to edit its alt text (/250) or "Decorative: screen readers skip it", its caption, and its "Position n / m";
  - "Remove from gallery" toasts "Removed from the gallery. The file stays in your media library." with Undo;
  - the upload states come from `StudioStates`.

### Story

Board: `EditorCaseStudy.dc.html`.

**Chapters** are on the left: drag, or ↑ ↓; "Add chapter". The hint: "Drag a handle, or focus it and press ↑ or ↓. Empty chapters are hidden on the live page, so a draft never shows a blank section."

- **The selected chapter** has "Chapter title" and "Preview this chapter".
- **Chapter settings:**
  - "Link to this chapter", `/work/{slug}#{anchor}`, which "Updates when you rename the chapter.";
  - "Show on the live page" (`hidden`).
- **An empty chapter** shows:
  - "Nothing here yet, so this chapter is hidden on the live page." and "It appears as soon as it has a block with content.";
  - "Questions to answer";
  - "Start with" Ownership, Text or List.

**Blocks** are in the middle:

- **Adding:** "Add block" opens "Add a block to “{chapter}”". Its types, in the board's order, each with its one-line description: Text, Heading, List, Callout, Metrics, Table, Image, Gallery, Video, Prototype, Before / after, Journey, Ownership, Quote, Cards, Divider.
- **Each block's toolbar:** move up or down (and drag), duplicate ("Block duplicated."), delete with Undo ("Block restored.").
- **Block settings,** on the right:
  - Text: Style, Body or Lead ("Lead is larger. Use it once, to open a chapter.");
  - Callout: Tone, Neutral or Accent;
  - Cards: Columns, 2, 3 or 4 ("On phones, cards stack into one column.");
  - Prototype: "Opens on" a screen from Visuals;
  - Metrics: "These numbers come from Outcomes… Edit in Outcomes →".
- **An empty block** shows "Fill this block, or remove it. Empty blocks are skipped on the live page."
- **Text blocks** use TipTap, restricted to the allowlist. Selecting text shows a bubble menu with Bold, Italic and Link.

**The RICE table** has the panel on the board:

- the switches: "Check scores against inputs", "Sort rows by score", "Highlight the top three", "On phones, show rows as cards";
- a flagged row shows "{row}: its inputs give 11.3 (…), but its score says 5.7. A 3-month effort would give 5.7.", with three fixes:
  - "Use 11.3 and re-rank" → "Score set to 11.3. {row} now ranks first.";
  - "Set effort to 3 mo" → "Effort set to 3 months. The score of 5.7 now matches.";
  - "Keep as is" → "Marked as reviewed. The score stays 5.7.";
- after a re-rank, a warning names any callout or chapter that still mentions the old order, with Undo.

Keyboard moves give the ring highlight (M-ST-RING).

**Phones:** one chapter at a time behind a switcher, and tables as cards.

### Outcomes

Board: `EditorOutcomes.dc.html`. The intro: "Every number says what kind of result it is and whose it is. Visitors see both. Your evidence note stays private, for you and for interviews."

Each result ("Result n") has:

- a number and "What it measures";
- a type of result (Required), from the five labels with their definitions on the right. Without one: "Pick one. Unlabelled numbers can't be published.";
- whose result it is (Recommended): My ownership, Team result or Business outcome;
- evidence ("Only you see this"):
  - "Required for achieved", otherwise "Optional";
  - the placeholder "Where the number comes from: a dashboard, report or experiment" for Achieved, otherwise "Where the goal or estimate came from";
- "Show in the page's results strip";
- a star, "Make card headline" or "Card headline", plus ↑ ↓ and delete.

**"Add result"** adds one. With none: "No results yet" and the board's text, then "Add a result".

**The live preview** ("On the page · live preview", dark theme) shows the strip and the card headline. When empty, they read "Nothing in the strip. The page skips this section." and "No headline: the card shows its summary only."

**The honesty check** ("Runs as you edit, and again before publishing.") uses the board's `honesty()` rules and copy:

| Check | Level |
| --- | --- |
| "Result n is marked achieved with no evidence note." | Error: blocks publishing |
| An Achieved result on a project whose kind isn't Shipped: "This project is a {kind} (see Overview). Achieved results usually come from shipped work. Is {value} measured?" | Warning |
| A Projected result without a note: "Result n is projected. Note the method, so you can explain it." | Warning |
| A result without "Whose result": "Result n doesn't say whose result it is." | Warning |
| "The card headline is labelled Target, and the summary doesn't claim it as achieved." | Passed (shown with a tick) |
| "Every result has a label." | Passed |

### URL & SEO

Board: `EditorSettings.dc.html`.

- **Page address:** `[domain]/work/` plus the slug field. The hint: "Lowercase letters, numbers and hyphens. Short and readable is best."
  - It's checked as the owner types: "Checking…", then available, taken ("Already used by “{title}”", with "Use {suggestion}"), or invalid ("Use only lowercase letters, numbers and single hyphens." / "Add an address.").
  - "Redirect the old address here" is on by default once the page has been published.
- **Search and link previews** ("Leave a field empty to use the title and summary from Overview."):
  - "Search title", with a counter "n/60" and the warning "Search engines may cut this off after about 60 characters.";
  - "Search description", with a counter "n/155";
  - the Google and LinkedIn previews;
  - the link preview image: "Made from the cover", or "Upload a custom image" ("1200 × 630 px works everywhere.").
- **Who can find it:** Public or Unlisted, with the board's descriptions, plus "Let search engines index this page". Indexing is off for unlisted pages ("Off: unlisted pages are always noindex.").
- **Share a private preview:**
  - "Create preview link" calls `pm-preview` and shows the link once, with Copy, "Expires after 7 days" and "Revoke link";
  - the toasts are "Preview link created. It expires in 7 days." and "Preview link revoked. It stops working now.";
  - active links are listed by creation date and expiry, never by token.
- **Unpublish or delete:**
  - Unpublish… confirms as on the board: "Unpublish “{title}”? It disappears from your homepage now. Anyone opening its link lands on your work index." The toast is "Unpublished. It's a draft again, and its address shows your work index."
  - Delete… is the type-to-confirm one (`StudioStates` › Delete): "This can't be undone. Type {slug} to confirm." with Cancel and "Delete forever". It returns to Projects.

### Publishing a project

The angled publish button opens the checklist dialog (`StudioStates` › Publish changes, and each editor's "publish dialog" tweak):

- **Ready:**
  - "Update the live page for “{title}”?" and "The live version is replaced. The page updates within a minute; its link stays the same.";
  - "What's changing", then the checks: what will stay hidden ("My role is empty, so that chapter stays hidden. You can publish anyway."), and warnings such as "RICE table: one row's score doesn't match its inputs. Review";
  - "Preview first", Cancel, "Publish now".
- **Blocked:** each blocker reads "{problem} Fix this to publish." and links to its field and tab. The confirm reads "Fix {n} to publish". Drafts keep saving while the owner fixes them.
- **Offline:** "You're offline. Publish once you're back online."
- **Publishing:** "Publishing…" with the spinner. Then the toast "Published. The live page updates within a minute." with "View live page ↗".

The checks are `pm-publish`'s, run in the browser first for instant feedback and again on the server ([06 · pm-publish](06-backend.md#pm-publish)).

## Writing

Board: `StudioWriting.dc.html` (writing a draft, many topics, topics dropdown open, no posts yet, publish dialog, scheduled, published).

**The list:**

- "Posts live on your site at /writing, in an RSS feed, and, when you choose, on your homepage." Drafts, Scheduled and Published tabs, with counts; "New post".
- **Empty tabs:** the board's empty titles and texts, such as "No drafts", "Nothing scheduled" ("Choose Schedule in a draft's settings."), "Nothing published yet" and "Write your first post".
- **Ideas from your résumé:** "Suggestions only. Nothing here is published, and each draft starts empty apart from the title." Each visible experience highlight from the profile is offered as a possible topic: "From: {company}". "Start a draft" creates a post whose working title is the highlight's text ("Draft started."). Nothing is invented.

**The editor:**

- "All posts", the status chip, the save status, "{n} words · {m} min read" (words ÷ 220, at least 1), Preview and the publish button ("Publish", "Schedule", or "Update post" once published);
- cover ("Add a cover image · optional"; alt text required), title, subtitle;
- blocks: Paragraph, Heading, Quote, Image, Embed ("Paste a YouTube, Vimeo, Loom or Figma link"), Code.

**Post settings:**

- **Address:** `/writing/<slug>`, from the title until edited.
- **Excerpt:** "Shown on cards and in search.", max 160 with a counter. The placeholder is "Leave empty to use the first lines".
- **Topics**, with the topic picker (S1).
- **When:** "Publish now", or "Schedule" with a date and time in the owner's time zone.
- **"Show on my homepage"**, and the optional "Canonical link" ("If you later share it on LinkedIn or Medium, point those copies back here.").
- **Facts you can cite:** "Confirmed numbers from your profile, with their labels. Click one to add it to the end of the post." Clicking one adds a `fact` block at the end ("Fact added at the end.").
- **Search preview.**

**Publishing** opens the dialog:

- the kicker "Publish post" or "Schedule post", and the title "Publish to /writing/{slug}?" or "Schedule for Monday 19 October, 09:00?";
- the checks:
  - "Add a title." blocks;
  - "The cover needs alt text." blocks;
  - "Short so far ({n} words). Publishing is still fine.";
  - "No excerpt: the first lines will be used.";
  - "Will show on your homepage's Writing section." or "Only on /writing and in RSS.";
- "Keep writing", and the confirm ("Publish now"; "Fix to continue" when blocked).

**Scheduled posts** show "Scheduled · Mon 19 Oct" in the list.

- **Unschedule** is beyond the board. It uses the board's ghost button style and returns the post to Drafts.
- **A schedule failure** (`schedule_error`) shows "Couldn't publish" with the reason on the post and on the dashboard.

## Media

Board: `StudioMedia.dc.html` (default, uploading, needs alt text, delete blocked, empty filter).

- **The intro:** "Every file you've uploaded. Images need alt text before a page that uses them can go live."
- **Storage meter:** "Storage {used} of 1 GB". That's the shared project's free quota, so it counts lumina's files too. "Prototypes and videos are links, so they don't count."
- **Upload:** drop or browse ("Images up to 10 MB · PDFs up to 10 MB."), running the pipeline in [06 · Storage](06-backend.md#storage).
  - Rejected files show the messages from `StudioStates` › Upload problems: too large, a video file, a prototype file, a paused upload, a HEIC conversion. For example, "Too large: 18.4 MB. PDFs can be up to 10 MB.".
  - The summary reads "Uploading 1 file. 2 files couldn't be uploaded."
- **Filters:** All, Images, Documents, "Needs alt text · n", "Not used anywhere · n", plus search. No match: "Nothing here with these filters" / "Try another type, or clear the filters." with "Show all files".
- **The detail panel:** a preview, the file name, alt text ("Required to publish"; "Used wherever this image appears. Projects can override it."), "Used in" with links, Replace file, Download, Delete…. The board has no "Decorative" here; that's set per use, in Visuals.
- **Delete is blocked** while a file is in use. The inline message reads "This file is used in {n} places. Remove it from those places first, or use Replace file to swap it everywhere at once." with OK. An unused file asks "Delete {name}? It isn't used anywhere. This can't be undone." with Cancel and "Delete file".
- **Phones:** the upload sheet offers Camera, Library or Files, and asks for alt text right after the upload (`StudioMobile`).

## Draft preview

Board: `StudioPreview.dc.html` (desktop, tablet, phone, compare desktop, compare phone, share open).

- **The bar:** "Back to editor", "Draft preview · not public · noindex", the device switcher (Desktop, Tablet, Phone), "Highlight changes", "Compare with live", "Share preview" and "Publish changes".
- **The page:** the draft rendered with the public components at the chosen width, read directly with the owner's session.
- **Highlight changes:** outlines every block that differs from the published version, with a "Changed" tag. Blocks only in the draft are tagged "Draft only."
- **Compare with live:** the published page side by side, scrolling together, headed "Live · what visitors see now" and "Draft · what you'll publish".
- **Share preview:** creates a link, as in URL & SEO. The popover reads "Anyone with this link can view the draft" and "Expires in 7 days. Never indexed. Revoke it from URL & SEO.", with the link and Copy.
- **Studio-only notes:** at the end, for example "Studio only: “My role and decisions” and “Learnings and next steps” are empty, so the live page skips them."

## System states

Board: `StudioStates.dc.html`. Every state on it is built and reachable:

- the saving states;
- toasts: published, undoable delete, copied, failed action;
- confirmations: publish ready, publish blocked, unpublish, delete with type-to-confirm (URL & SEO only; the Projects list uses its own confirm with Undo), discard the homepage layout, leaving with unsynced changes (`beforeunload` plus an in-app dialog for Studio routes);
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
