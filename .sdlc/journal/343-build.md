---
stage: "build"
title: "build slice 5"
at: "2026-10-01T03:25:20.254Z"
cost: 9.493002799999998
turns: 164
session: "f34d4d4c-2fb3-4f9c-99ec-09d4edc94f8d"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

Slice 5 is built: an administrator can now list, create, edit, rename, publish and remove the service's pages. `npm --prefix app run check` passes: typecheck plus all unit tests in the three workspaces (15 + 311 + 176). The production build also succeeds. I did not start the compose stack, because this machine is shared and has other people's containers running. The compose file is unchanged from earlier slices, so nothing here has been seen running at http://localhost:4300.

**How each criterion is reached**
- **The list (R-7.5, R-7.12):** an administrator gets a "Content" link in the navigation menu, leading to `/content`. Every page appears once, ordered by title, with its title linking to its managing screen, its public address linking to the page, a Yes/No for whether the service needs it, and its created and last-updated dates.
  - On a fresh, migrated installation that is the sixteen pages from decision records 0007 and 0008. Each is titled by its own address, says "Initial version" and is marked as needed. A test over the real migration history confirms the sixteen.
- **Everyone else is kept out (R-7.6, R-7.10, R-7.16):** anyone who is not an administrator sees the not-found screen on `/content`, `/content/create` and `/content/:slug/edit`, and nothing is sent to the service. That includes visitors, because R-7.6 says "anybody else".
  - At the service, every list, create, change or remove request from a non-administrator gets the same answer: 401 with `{"errors":["Only an administrator may manage pages."]}`. Permission is checked before anything else, so a request naming a missing page or a malformed address gets the same refusal.
  - 401 matches what the list of users already answers non-administrators with.
- **Creating (R-7.7):** `/content/create` asks for confirmation before publishing, then opens the new page's managing screen with "Page published".
- **Publishing changes (R-7.8):** each publish adds a new version in one transaction. Readers see the new wording straight away, and the screen shows "Changes published" with the new date and author.
- **Removing (R-7.9):** after one confirmation, the page and all its versions are deleted, and the administrator is returned to the list with "Page removed".
- **Validation (R-7.20, R-7.21):** the rules are shared by the browser and the service. Each field is marked when the person leaves it, and Publish stays unavailable until every field is valid. The service's refusal names each failing field, e.g. "Title: Enter a title".
- **Duplicate addresses (R-7.22):** checked on create and on rename, and shown in the alert the design specifies.
- **No version history (R-7.23):** nothing in the app shows earlier versions, and no element carries `content-version-history`.
- **Renaming (R-7.24):** a new address takes effect at once, the old one answers as not found, and the screen moves to the new address.
- **Pages the service needs (R-7.25):** the managing screen shows a warning, the address is read-only and there is no Delete. The service refuses a rename or removal sent directly.
- **Authorship (R-7.27):** the service sends `createdBy`/`updatedBy` only to administrators. The screen links each name to the person's profile, or shows "System" where no person is recorded.
- **Two administrators editing at once (R-7.28):** the second publish silently wins. If two publishes hit at exactly the same moment, they collide on the version number and the second is answered as a service error, as the criterion describes.
- **Editor and embedded images (R-7.26, R-8.29):** the toolbar has Bold, Italic, Heading, the two list types, Link and "Insert image", plus a link to the formatting guide that opens in a new tab.
  - A chosen image is uploaded right away, readable by anyone. A reference `![Describe this image](@file/<id>)` is placed at the cursor with the description selected for typing over.
  - Files over 10 MB, or that aren't JPEG or PNG, are refused before anything is sent.
  - The page renderer turns the reference into the file's address only when the page is displayed, and tags every image with `content-body-image`.

**Changes to the existing design**
- Changing and removing a page now work by address as well as by identifier. The contract only allows an identifier there, so the boundary check is loosened for those two requests, the same way slice 3 did for files.
- The design system's alert component drops its title when it is also given body text, and the stories do both. I added a small wrapper so the titles actually appear.

All of these choices are recorded in `docs/decisions/0025-managing-pages.md`.

**Tests**
- Backend:
  - the shared rules (field limits, address format, list order, the image reference);
  - the service against an in-memory store (every permission refusal in one shape and with nothing changed, create, change, rename, address clash, needed-page protection, removal);
  - the sixteen-page fresh-installation list over real migrations;
  - an end-to-end run through the real boundary, with signed tokens and the acceptance seed applied.
- Frontend:
  - the formatting and image-insertion helpers;
  - each screen's flows;
  - accessibility checks on the list, create and managing screens.
- Image upload is stood in for in the screen tests, because the test browser cannot send a multipart form. The upload function itself has no test of its own.

**What I couldn't do as written, and what the next slice will find**
- **The page count.** A seeded sandbox will have 23 pages marked as needed, not 16 or 22: `tests/seed/000-installation.sql` puts back the old application's 22, including the seven guides that were ruled out, and the migration adds the service level agreement page. Only a fresh, unseeded installation shows sixteen. Making a seeded sandbox show sixteen means changing that seed file, which isn't this stage's to change.
- **Terms and conditions.** The "notify vendors of updated terms" action on the terms page (R-7.13) belongs to another slice, and is not on the managing screen yet.
- **Shadowed address.** A page whose address is `create` can't be read at `/content/create`, because that is the create screen's address. The old application had the same problem.
- **Workspace state.** I removed the `node_modules` and build output I had created, so the workspace is back to sources only.