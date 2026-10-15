# Studio guide

Studio is the private editor behind the portfolio, at `/studio`. This guide is for the owner. It's organised by task: signing in, arranging the homepage, confirming facts, editing projects, writing, managing media, previewing, publishing, and what to do when something goes wrong. Everything you change is a private draft until you publish it, and a publish reaches the live site within about a minute. Status as of 15 Oct 2026: every screen is built, but Studio isn't connected to the real Supabase project until the go-live steps are done, and the site isn't launched yet ([D46](../handover/09-decisions.md)).

The pictures linked on this page are previews of the design boards, which use illustrative content, not screenshots of real drafts.

## Before go-live

Until the owner runs the go-live steps in [`supabase/README.md`](../../supabase/README.md) and the launch checklist in [09 · Decisions](../handover/09-decisions.md#launch-checklist-owner):

- **A production build** of Studio shows "Studio isn't connected yet" rather than editing anything fake ([`src/lib/studio/client.ts`](../../src/lib/studio/client.ts)).
- **The development server** (`npm run dev`) runs Studio against an in-memory copy of the V0 content ([`src/lib/studio/memory.ts`](../../src/lib/studio/memory.ts)). It behaves like the database where Studio can tell: versions and conflicts, unique addresses, soft deletes and the publish checks. Nothing leaves the browser, and every reload starts again from the V0 content.

## Where things are

| Screen | Address | What it's for | Board preview |
| --- | --- | --- | --- |
| Sign-in | `/studio/login` | Getting in with an email code | [StudioLogin](../../design/previews/StudioLogin.webp), [StudioAuthFlow](../../design/previews/StudioAuthFlow.webp) |
| Dashboard | `/studio` | What needs doing next | [StudioDashboard](../../design/previews/StudioDashboard.webp) |
| Website | `/studio/website` | The homepage: order, show or hide, section settings | [StudioSite](../../design/previews/StudioSite.webp) |
| Profile & facts | `/studio/website/profile` | Your name, title, numbers, roles, testimonials and links | [StudioProfile](../../design/previews/StudioProfile.webp) |
| Projects | `/studio/projects` | Every project, by shelf, in homepage order | [StudioProjects](../../design/previews/StudioProjects.webp) |
| Project editor | `/studio/projects/:id/:tab` | One project, in five tabs | [Overview](../../design/previews/EditorOverview.webp), [Visuals](../../design/previews/EditorVisuals.webp), [Story](../../design/previews/EditorCaseStudy.webp), [Outcomes](../../design/previews/EditorOutcomes.webp), [URL & SEO](../../design/previews/EditorSettings.webp) |
| Writing | `/studio/writing` | Posts: drafts, scheduled and published | [StudioWriting](../../design/previews/StudioWriting.webp) |
| Media | `/studio/media` | Every uploaded file | [StudioMedia](../../design/previews/StudioMedia.webp) |
| Draft preview | `/studio/preview/:kind/:id` | A draft as visitors would see it | [StudioPreview](../../design/previews/StudioPreview.webp) |

On a laptop the sidebar holds Dashboard, Website, Projects, Writing, Media and "View live site ↗", with your account card at the bottom. The iPad rail and the phone tab bar are drawn on [StudioTablet](../../design/previews/StudioTablet.webp) and [StudioMobile](../../design/previews/StudioMobile.webp). The routes are in [`src/routes.ts`](../../src/routes.ts) and the screens in [`src/routes/studio/`](../../src/routes/studio) and [`src/components/studio/`](../../src/components/studio).

## Sign in

Studio signs in with a one-time code sent by email. There's no password, no Google account, and no way to sign up: the owner's account is created once, at setup, from `OWNER_EMAIL` ([D8](../handover/09-decisions.md), [D28](../handover/09-decisions.md)).

1. Open `/studio/login`, enter your email address and press **Email me a code**.
2. Check your email. The code is **8 digits** ([D66](../handover/09-decisions.md)) and expires after 10 minutes.
3. Paste or type it. Studio signs you in as soon as all eight digits are in.

Things worth knowing:

- **The code screen always appears,** even for an address that isn't the owner's, so the page never reveals who owns the site.
- **Resend** is available once a minute. "Didn't get it?" counts down until you can ask again. Check spam first.
- **A wrong code** says "That code didn't work." After five wrong codes, this device waits 15 minutes before taking another code ([`src/lib/studio/signin.ts`](../../src/lib/studio/signin.ts)). "Send a new code" stays available.
- **An expired code** says "That code has expired." Send a new one.
- **An account that isn't the owner's** is signed out at once: "This account can't open Studio".
- **A link into Studio** (for example to a project) brings you back to that page after you sign in.
- **Signing out** is in the account menu: "Sign out", or "Sign out on all devices". Your published site isn't affected.

Why a code and not Google: it's simpler, the owner already uses the pattern in another admin, and there's no OAuth project to maintain. Why 8 digits and not the boards' 6: CAPTCHA protection is off on the shared Supabase project for now ([D54](../handover/09-decisions.md)), so guessing had to be made harder, and 8 digits makes it 100 times harder. Your mailbox is now the key to Studio, so turn on 2-Step Verification for it (launch checklist, item 10).

## Start from the dashboard

The dashboard greets you, shows counts (projects, live, private drafts, when the site was last published), and lists **Needs your input**, most urgent first:

1. drafts with publish blockers, as chips naming the missing fields;
2. RICE table rows whose scores don't match their inputs;
3. "Worth a check" facts, where the live site and your résumé disagree ([07 · Worth a check](../handover/07-v0-content.md#worth-a-check));
4. links that failed their nightly check;
5. scheduled posts that couldn't publish.

Each row links to the exact field. Below it are the last five things you saved and three quick actions: Upload media, Arrange the homepage, Write a post.

## Arrange the homepage in Website

**Website** is where the homepage's sections are arranged. The outline on the left lists every section in page order, the middle shows a live preview, and the inspector on the right shows the settings of whatever you select. Each section kind is described on the [Widgets](Widgets.md) page.

- **Show or hide** a section or one of its parts with its eye. The hero always shows; hide its parts instead. Draft projects keep their spot with a "Draft" chip, but their eye stays off until you publish them.
- **Reorder** by dragging a handle, or focus it and press ↑ or ↓. The hero stays first and the footer last.
- **Link a section in the nav** with "Link it in the nav", then type its label (up to 14 characters). The nav follows page order.
- **Edit a section** by selecting it. For example:
  - a shelf has its title, the label above it, its intro and "Rows on the homepage" (1, 2 or 3);
  - Writing has "Posts on the homepage" (latest 2, 3 or 4) and the RSS link;
  - a skill group has its name, subtitle, and each skill with a size, S, M, L or XL. Keep two or three big and most at M;
  - an Off duty item has its title, label, text (about 200 characters fits every panel), tag, accent and art;
  - the hero's floating previews let you choose the projects that float and how many show at once.
- **Names, numbers and roles** for the hero, proof strip, experience, testimonials and contact are confirmed in Profile & facts. The inspector links there.
- **Add section** adds a text section before Contact. Its panel has a title, the text, and "Delete section" with Undo.
- **Preview** shows Desktop or Phone. "Show hidden" and "Show drafts" add labelled placeholders for what visitors won't see. iPad is checked in Draft preview instead ([D45](../handover/09-decisions.md)).
- **Discard** goes back to the last published layout.
- **Publish website** lists exactly what changes ("Moved Testimonials above About", "Hid Off duty") before anything goes live. Project pages and drafts aren't touched.

## Confirm your facts in Profile & facts

Profile & facts is one long form: Hero, Proof strip, About, Experience, Testimonials, and Contact and links. On the right are a live preview of the hero and a "Before you publish" checklist.

**"Worth a check" items** are where the live site and your résumé disagree. V0 kept the live values, so the new site was complete on day one ([D5](../handover/09-decisions.md)). For each one:

- **Keep the site figure** confirms it as it is.
- **Use the résumé figure** opens the stat or bullet for editing, pre-filled, with the résumé's wording beside it. It doesn't overwrite anything until you choose **Save and confirm** ([D76](../handover/09-decisions.md)).
- The job title is two radio cards, one for each source.
- **Still true** confirms something that has no alternative, such as your availability.

An unconfirmed fact still publishes with its live value. Publishing with open items asks "Publish with {n} unconfirmed?" first ([D42](../handover/09-decisions.md)).

Also here:

- **Proof rows** each have an Edit button, because this is the only place their numbers are edited ([D77](../handover/09-decisions.md)).
- **Experience:** add roles and switch each on or off. "Remove the placeholder" removes the hidden Wipro "$XXXK" bullet ([D18](../handover/09-decisions.md)).
- **Testimonials:** every one switched on shows in the homepage carousel, with no limit ([D14](../handover/09-decisions.md)).
- **Contact and links:** email, LinkedIn, GitHub, your phone (off by default), the résumé, and where "Let's Talk" goes: Contact section, Email, LinkedIn or a booking link ([D34](../handover/09-decisions.md)).
- **More fields** with no board editor are plain forms in the same styles: the hero button, About points, "Problem spaces", education and each testimonial's details ([D38](../handover/09-decisions.md)).

**Publish profile** publishes the profile and the homepage layout together, the same publish as Website.

## Manage projects

**Projects** lists every project grouped by shelf, in homepage order, with its status: "Published", "Edits not live", or "Draft" with how ready it is.

- **Reorder** by dragging or with ↑ ↓ on a focused handle. Reordering pauses while a filter or search is on. Layout changes wait in a bar at the bottom until you press **Publish layout**.
- **The lead card** is simply the first visible project on a shelf. The star moves a project to the top ([D37](../handover/09-decisions.md)).
- **The ⋯ menu** has Edit, Preview draft, Duplicate as draft, then Publish, "Review and publish" or Unpublish, and Delete….
- **Delete…** here is a soft delete: it asks once, offers "Unpublish instead", and gives you 7 seconds to Undo ([D43](../handover/09-decisions.md)). Only URL & SEO deletes for good.
- **New project** creates a private draft called `untitled-n` and opens it.

## Edit a project in five tabs

The editor's header shows the status, the save status, Preview, and the publish button. A dot on a tab means it has edits that aren't live.

1. **Overview.** Title (required; it warns past 60 characters and is refused past 80, [D39](../handover/09-decisions.md)), company (required), card label, one-line summary (required, up to 140), the shelf, the kind of work (Shipped, Strategy study or Prototype), and topics, up to 8 ([D23](../handover/09-decisions.md), [D44](../handover/09-decisions.md)). Then the case study's summary row: "The problem" and "What I proposed", which hide while empty ([D25](../handover/09-decisions.md)). Then your role, timeline and team, and the PRD link.
2. **Visuals.** What leads the page: an image, a video (YouTube, Vimeo, Loom or Google Drive) or a prototype link. Studio checks a prototype link as you paste it, and tells you if it can't be framed or asks visitors to log in. Also the project's accent ([D26](../handover/09-decisions.md)), the cover with its focal point and required alt text, and the gallery. Prototypes and videos are links, never uploads ([D11](../handover/09-decisions.md)).
3. **Story.** Chapters on the left and blocks in the middle. Add a block from sixteen types, from Text and Metrics to Journey and RICE tables. Empty chapters and empty blocks are skipped on the live page, so a draft never shows a blank section. A RICE row whose score doesn't match its inputs gets three fixes: use the computed score, change the effort, or keep it as reviewed.
4. **Outcomes.** Every number gets one of five labels: Achieved, Target, Projected, Baseline or Output ([D7](../handover/09-decisions.md)). An Achieved result needs an evidence note, which only you see. The honesty check runs as you edit.
5. **URL & SEO.** The page address, search title and description, the link preview image, Public or Unlisted, search indexing, private preview links, and Unpublish or Delete. A new address only goes live on the next publish, and the old one can redirect to it ([D40](../handover/09-decisions.md)). Delete here is permanent and asks you to type the address.

## Write posts

**Writing** has Drafts, Scheduled and Published tabs, and "New post".

- **Ideas from your résumé** suggests possible topics from your experience highlights. Starting one creates an empty draft with that title. Nothing is published or invented.
- **The editor** has an optional cover (with required alt text), a title, a subtitle, and blocks: Paragraph, Heading, Quote, Image, Embed and Code.
- **Post settings:** the address, the excerpt (up to 160), topics, when to publish (now, or scheduled in your time zone), "Show on my homepage", an optional canonical link, facts you can cite, and the search preview.
- **Scheduled posts** can be unscheduled, which returns them to Drafts ([D45](../handover/09-decisions.md)). A scheduled post that couldn't publish shows "Couldn't publish" with the reason, here and on the dashboard.

The homepage's Writing section and `/writing` stay hidden until the first post is published ([D19](../handover/09-decisions.md)).

## Manage media

**Media** lists every uploaded file, with a storage meter. The 1 GB is the shared project's free quota, so it counts the photography site's files too. Prototypes and videos are links, so they don't count.

- **Upload** images or PDFs up to 10 MB each. Images are resized in your browser before upload ([D29](../handover/09-decisions.md)). HEIC photos work in Safari; elsewhere, export a JPG first ([D80](../handover/09-decisions.md)).
- **Filters** include "Needs alt text" and "Not used anywhere".
- **Alt text** is required before a page that uses an image can go live.
- **Replace file** swaps a file everywhere it's used. Live pages pick it up on their next publish, and Studio offers to publish them ([D41](../handover/09-decisions.md)).
- **Delete** is blocked while a file is used anywhere. An unused file can be deleted for good.

## Preview and share

- **Preview** in any editor opens the draft as visitors would see it, at Desktop, Tablet or Phone width. "Highlight changes" outlines what differs from the live version; "Compare with live" shows them side by side.
- **Share preview** creates a private link to the draft. Anyone with it can view the draft; it's never indexed and expires after 7 days. The link is shown once, so copy it then. Revoke it from URL & SEO at any time.

## Publishing, and "within a minute"

Nothing you edit is public until you publish it. Each kind of content publishes on its own:

| What | Button | What goes live |
| --- | --- | --- |
| A project | The editor's publish button | That project's page and card. The first publish places it on its shelf |
| A post | Publish, Schedule or Update post | That post |
| The homepage | Publish website, Publish profile, or Publish layout in Projects | The profile and the layout together |

Before a project publishes, a checklist shows what will change, what stays hidden, and any warnings. Problems that block it link to the field ("Fix {n} to publish"). Your draft keeps saving while you fix them. A flagged RICE row is a warning, not a blocker ([D61](../handover/09-decisions.md)).

**"It updates within a minute"** means this: the public site is a set of prerendered pages, not a live database. Each publish asks Vercel to rebuild the site, and the rebuild takes about a minute ([01 · Architecture](../handover/01-architecture.md)). Until it finishes, visitors see the previous version. If the rebuild couldn't be started, the publish still stands, and Studio says "Published. The site will update on the next deploy" ([D81](../handover/09-decisions.md)). The trade-off is set out in [Decisions and trade-offs](Decisions-and-trade-offs.md#architecture).

**Unpublish** takes a page off the site and back to draft. Its Undo restores the last live version ([D62](../handover/09-decisions.md)).

## When something goes wrong

Studio saves your work 800ms after you stop typing. The save status in every editor's header always says where things stand: "All changes saved", "Saving…", "Offline · saved on this device", or "Couldn't save" with Retry.

| What you see | What it means | What to do |
| --- | --- | --- |
| **"You're offline."** banner | The connection dropped. Your edits are kept on this device | Keep editing. They sync when you reconnect. Publishing pauses until then ("Reconnect to publish") |
| **"Your last change didn't save."** banner | A save failed. Studio keeps retrying | Keep the tab open until it says Saved, or press Retry now |
| **"Edited somewhere else"** dialog | Another tab or device saved this first. The dialog names what changed on each side | **Load latest** to take the other version, or **Keep mine** to save yours over it |
| **"You've been signed out"** dialog | Your session ended while you were editing | Press "Email me a code" and sign in. Your unsaved edits are kept on this device and sync afterwards |
| **"Some changes haven't synced yet"** | You're leaving with edits still waiting to sync | **Stay** until they sync, or **Leave anyway** |
| **"Couldn't load your projects"** | Studio couldn't reach the database | Check your connection and press Try again. Nothing on the live site has changed |
| **Publish blocked** | A required field is missing or a check failed | Follow each blocker's link to its field |
| **"Published. The site will update on the next deploy"** | The publish saved, but the rebuild didn't start | Nothing is lost. The change goes live with the next rebuild, for example after your next publish |
| A deleted project or section | — | Press Undo within 7 seconds |

The full set of states is on the [StudioStates](../../design/previews/StudioStates.webp) board, and their rules are in [05 · Studio](../handover/05-studio.md#system-states). How saving, conflicts and the offline queue work is on the [Publishing](Publishing.md) page.
