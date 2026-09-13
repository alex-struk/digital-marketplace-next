---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-13T23:58:33.155Z"
cost: 8.132114
turns: 76
session: "2f8e53b5-a97d-4a8d-9257-48e4d76d7aa5"
---

I've updated the "old" adapter (`tests/adapters/old/index.ts`) and rewritten `tests/adapters/old/bindings.yaml` to cover the whole current contract, but I could not type-check it. There is no `node_modules` in the workspace and running commands needed approval, so `tsc` was never run.

**What I started from.** An adapter and bindings file from an earlier run were already here, written against an older contract. The contract has since gained eight pages and about forty members, so I walked the new parts in the browser and added them. I left most existing bindings as they were, apart from the attachment and invitation fixes described below.

**Base URL.** I couldn't read the target-URL variable, because every way of reading the environment needed approval. The running app answered at `http://localhost:3000`, and that is the address I explored. The adapter itself uses the `baseURL` it is handed.

**Newly bound:**
- **Record identifiers** (opportunity, proposal, organization) are read from the address the record's own screen lands on. The person's identifier comes from the profile tab links, because `/users/me` keeps "me" in its address.
- **Opportunity management pages:** the creator's name is read from "Created By". The last person to change it is read from the newest History entry, keeping the name's own spelling rather than the capitals it is drawn in.
- **Public opportunity pages:** the published date is read from the header line.
- **Scheduled transitions:** a request to `/status`, which answers "OK".
- **The five "me" screens:** built from the same code as their per-person twins. Signed out, `/users/me` sends the browser to the sign-in page, and that is what the sign-in-required observation reads.
- **Invitations:** the organizations tab shows a pending row with nothing beside it to answer with. The invitation email's links (I found them on the admin email reference page) open that tab with a "Approve Request?" or "Reject Request?" confirmation waiting. So approving and rejecting follow that link using the invitation's affiliation identifier, then confirm. The two confirmation observations read that dialog. The earlier bindings had wrongly claimed Approve and Reject buttons in the row.
- **Service level agreement link:** it leads to `/content/service-level-agreement`, where the app shows its own "Not Found" screen.
- **Page editor:** the page's address comes from "This page is available at…". Version history reads empty, because nothing on the screen offers past versions.
- **Invalid membership type:** the team screen only invites ordinary members, so any other type is sent to the address the screen itself posts to. The app answers 400 with "Invalid membership type provided."
- **File upload and description:** requests go from the browser's own session, and I checked the answers:
  - a normal upload returns 201 with the file's id, name, date and a content digest;
  - leaving out read access returns 400;
  - an unknown read-access tag returns 400;
  - a malformed read access returns 500;
  - no file part returns 500;
  - a name over 255 characters returns 400;
  - an 11MB file returns 500 "Content-Length is too large." (which states no limit);
  - signed out returns 401;
  - an unknown file returns 404.
- **Attachment step:** it states "Attachments must be smaller than 10MB."
- **Profile picture:** the address is taken from the stored image, and its size is read by loading that image.

**Newly unbound:**
- **Created-by and last-changed-by names on the three public opportunity pages:** those pages show only published and updated dates.
- **Leaving an organization, on both memberships tabs:** the column beside an affiliated row is empty and no leave control exists.
- **Uploading without declaring a size:** no screen does it, and neither the browser nor Playwright's request client will send a body without a length to this plain HTTP address.
- **Unsubscribe confirm, cancel and dialog on the "me" notifications tab:** these stay unbound for the same reason as on the per-person tab — the confirmation only appears on the separate unsubscribe landing page.

**Selector fix.** Two older lines found an attachment's remove icon and download link by DOM position (XPath), which the no-selector rule forbids. The download link is now found by where it leads. The remove icon has no name, so it is found as the image drawn just right of the attachment's name box. I saw that layout in the browser, but I have not actually run the new remove or download code.

**Not exercised.** Beyond what's listed above, the actions and observations were written from what I saw on screen but not run through the adapter itself.

**Side effects on the target.**
- Signed in as the file-uploader persona, I stored three small probe files, one per accepted upload.
- The membership-type request was refused, so it created nothing.
- I opened both invitation confirmations without confirming either.
- I added two attachments to the seeded Code With Us opportunity's form without saving; leaving the page discarded them.
- The browser tool created a `.playwright-mcp` folder at the workspace root, which is outside my directory and which I left alone.

**Routes.** Every route in `surface.yaml` that I opened resolved.