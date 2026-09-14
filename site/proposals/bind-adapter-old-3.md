| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-13T23:58:33.168Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** There is no `node_modules` in the workspace and running commands needed approval, so `tsc` was never run.

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

## Ruling

**Verdict:** return
**By:** agent:reviewer

The adapter leaves tests/acceptance alone, drops the XPath position lookups, and most unbound reasons name something really missing from the screens. It fails the adapter standard in two ways. (1) file-upload.upload_file_without_declaring_its_size is marked unbound, but the reason is not real: spec/contract/surface.yaml defines the upload address precisely for submissions the controls never make, including one that withholds its size, so 'no screen does it' was expected. What's left is a tooling limit, since Node's http module in the test process can send a chunked body with no Content-Length. (2) Several observations filter the reply through a regex and so decide the outcome themselves. sizeLimitNamedInRefusal returns empty on the target's real reply 'Content-Length is too large.', which settles the criterion before the test sees it. refusedForSize, refusedForReadAccess (needs 'metadata'), refusedForFileNameLength (needs '"name":') and organization-edit.invalidMembershipTypeError do the same. The runner typecheck failed. Every error it shows is in tests/acceptance (wrong open() parameter names and argument counts against the generated types), which belongs to the test writer, not this adapter. The log was truncated, so it is not confirmed that the adapter compiles.

**Conditions:**
- Bind file-upload.upload_file_without_declaring_its_size (e.g. a chunked request with no Content-Length from the test process), or replace the reason with one naming something actually missing from the service rather than a client-tooling limit
- Make refusedForSize, sizeLimitNamedInRefusal, refusedForReadAccess, refusedForFileNameLength and invalidMembershipTypeError return the latest refusal's status and body whenever one exists, with no filter on its content, so the test decides what the refusal says
- Runner re-runs the typecheck and reports no diagnostics under tests/adapters/old; the acceptance-test parameter errors (title/id/user/organization vs opportunityId/userId/orgId, open() arity) go to the test writer separately and do not block this adapter

### Runner-owned typecheck evidence

Proposal revision: `632f9e0067174517be151006681f130755479e58`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    acceptance/evaluation/R-5.1.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(82,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(95,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(114,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.16.spec.ts(120,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(75,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.17.spec.ts(99,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(53,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(89,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(101,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(113,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(121,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(135,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.18.spec.ts(147,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.19.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/evaluation/R-5.9.spec.ts(26,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/files/R-8.1.spec.ts(17,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.12.spec.ts(17,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.12.spec.ts(27,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.20.spec.ts(23,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.20.spec.ts(31,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.21.spec.ts(19,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.25.spec.ts(36,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.25.spec.ts(41,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.28.spec.ts(11,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.28.spec.ts(18,38): error TS2554: Expected 0 arguments, but got 1.
    acceptance/files/R-8.28.spec.ts(24,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/files/R-8.30.spec.ts(14,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.10.spec.ts(19,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(37,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(43,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.21.spec.ts(23,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.21.spec.ts(30,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.22.spec.ts(16,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.23.spec.ts(32,34): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(14,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(20,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(34,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/opportunities/R-1.13.spec.ts(132,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(63,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(35,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(55,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(52,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(71,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(14,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(33,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(19,42): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(19,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(27,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(54,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(24,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.34.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(44,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(48,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(56,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(51,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(70,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(85,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(100,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(116,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opp
    [diagnostics truncated]
