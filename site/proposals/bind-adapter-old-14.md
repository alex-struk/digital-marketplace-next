| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T09:44:41.268Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** All 66 members the contract added are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.yaml`, and I made all six calibration fixes.

I've updated the adapter for the "old" target at http://localhost:4300. All 66 members the contract added are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.yaml`, and I made all six calibration fixes. None of this has been compiled or run: I wasn't allowed to run the typechecker or any shell or node probes in this workspace. I checked every request and page shape by driving the target through the Playwright browser tools, and checked the TypeScript by reading it. The first run will be its first compile.

**Calibration fixes**
- **R-7.9:** `contentEdit.deletedSuccess` now reads the "Page Deleted" alert drawn after the footer, using `alertLines(/deleted/i)`.
- **R-1.15:** `scoreWeightError` on both the Sprint With Us and Team With Us create pages now gathers messages from every step of the form, so a refusal on "6. Scoring" is found.
- **R-1.16:** "Prototype" (or "prototype phase") now maps to the form's "Proof of Concept". I didn't touch the inception test: the finding didn't show a fault in the binding.
- **R-8.20, R-8.25, R-8.31 (reading the attachment address):** it now closes any dialog left open (Escape, then "Cancel" or "Close") and goes to the Attachments step before looking for the `/api/files/` link.
- **R-8.31 (removing an existing attachment):** removing or renaming an attachment on a saved record now chooses "Edit" first. It opens the Attachments step, and if "Add Attachment" isn't offered it picks "Edit" from the Actions menu (or the top bar), then returns to that step.

**What the new screen observations find on this target**
- **Winner's contact details and score (all three programs):** Signed in as an administrator, I opened the seeded awarded Code With Us and Sprint With Us opportunities. The banner says only "This opportunity was awarded to Northern Pines Digital Ltd." and nothing else. So these readers return empty on this target, not unbound, because the page was reached. The seed has no awarded Team With Us opportunity, so that program's version is written the same way but not seen working.
- **`scope_section` and `terms_section`:** These read the embedded page under the "Scope & Contract" tab (Sprint With Us) and the "Competition Rules" tab (Team With Us). Both show "Initial version", which matches the seeded fixed pages.
- **`offered_state_changes` (Team With Us management page):** This visits each of the screen's own tabs and collects the top-bar controls and Actions-menu entries. On the seeded Team With Us opportunities that gives "Cancel" on the Opportunity tab and "Finalize Consensus Scores" on the Consensus tab. Awarding isn't offered on this screen, and there is no Team With Us opportunity in processing in the seed to look at.
- **`refused_when_not_permitted` (four evaluation screens):** As the only public sector account the session routes reach, on the Sprint With Us opportunity whose panel is other people, both the create and edit screens show "Not Found — The page you are looking for doesn't exist." That text is what the reader returns; a screen that opens the score sheet returns empty.
- **`page_count` (content list):** 25 as an administrator, matching what the service's own list returns.

**Mail catcher pages**
These read Mailpit at `SDLC_MAIL_API`: the listing is read page by page, and a single message is read by its identifier. `follow_link_in_body` opens the link in the formatted body whose label matches and lands the browser there.

**Request-level pages: what this target answers**
- **Organizations one may act for:** a signed-out request gets `200 []`, not a refusal.
- **User list:** a vendor gets `401`.
- **Affiliation invite:** a bad membership type gets `400 {"membershipType":["Invalid membership type provided."]}`.
- **Content requests:** a page can only be changed or removed by its identifier; sent by its address, this target answers `404`. The adapter therefore looks the page up by address first. A fixed page can't be renamed.
- **Individual evaluation:** the first save creates the sheet (POST) and later saves change it (PUT). A request to submit one sheet on its own is always answered `400 {"evaluation":{"tag":"parseFailure"}}`; I tried eight different values. I also noticed the service let the one public sector account read another staff member's submitted evaluation through the request address, while the screen for it shows Not Found.
- **Panel with a member holding no role:** answered `503 {"database":["Database error."]}`.
- **Attach a stored file by identifier:** the record is sent back with nested records reduced to their identifiers. This was accepted on a Code With Us opportunity (as an administrator) and on a vendor's draft Code With Us proposal. I couldn't check the body shape on a Sprint With Us or Team With Us draft, because the seeded ones are at stages that refuse edits. Also, saving the Code With Us opportunity this way moved its stored times by an hour.

**State I left on the target**
My probes left changes behind: draft evaluations on two seeded proposals, the seeded published Code With Us opportunity edited with a stored file attached, a new version of the "about" page, and one invitation email. The per-test reseed should clear all of it.

Every route in the contract that I opened resolved on the target. I didn't change anything outside `tests/adapters/old/`.

## Fix turn

I fixed only what the compile check named. I couldn't run `tsc` in this session because the command needed approval, so the fix has been checked by reading the code but not compiled.

**Journal addition.** All 33 compile errors had one cause. They come from checking the adapter against a `surface.d.ts` generated from an earlier contract, one that lacks the pages and members this workspace's contract adds. The workspace's own `tests/generated/surface.d.ts` declares all of them: `CaughtMessagePage`, `offeredStateChanges`, `pageCount`, `stored_files` and the rest. So I made the adapter compile against either version and changed no binding logic. I added two type helpers at the top of `tests/adapters/old/index.ts`. `Open<T>` is the page type plus room for extra members, and it now types the eight pages that gained members: the Sprint With Us and Team With Us opportunity views, the Team With Us opportunity edit page, the four individual-evaluation create and edit pages, and the content list. The older surface therefore no longer rejects `scopeSection`, `termsSection`, `offeredStateChanges`, `refusedWhenNotPermitted` and `pageCount` as unknown properties. None of those five members takes a parameter. `PageOf<"key">` gives the ten new pages (the two caught-message pages, the acting-for list, the four request pages, the two per-program evaluation request pages and attach-by-identifier) their exact type when the surface declares them. When it doesn't, it falls back to a map of callables that take `any[]`, so their `params` and `input` parameters are no longer implicitly `any`. `fileIdFor` now reads the seeded stored files through an `unknown` cast, so it compiles with or without that seed entry. The final object is built as a local constant and then returned, so the older surface doesn't reject its ten new page keys as unknown properties; against the current surface it is still checked in full. `bindings.yaml` and every page's behaviour are unchanged, including the six binding fixes from the calibration findings.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The question is whether this adapter binds every surface action and observation on old and nothing else, while staying navigation and locators only. The runner-owned typecheck passed with no diagnostics under adapters/old/, nothing under tests/acceptance changed, and the six calibration fixes (R-7.9 alert after the footer, R-1.15 messages gathered across steps, R-1.16 prototype mapped to Proof of Concept, R-8.20/R-8.25/R-8.31 dismissing the dialog and moving to the Attachments step, R-8.31 choosing Edit before changing an attachment) are locator and navigation changes that match their findings. The new mail-catcher, request-level and screen readers report what the target answered and do not judge it. One binding does decide an outcome: file-attach-by-identifier.attach_stored_file never sends the attach when the person cannot read the record. It sends a GET in its place, so attachment_refused reports a refusal of an attach that was never attempted. A service that refused the read but accepted the write would pass, which is the access-control gap the file criteria exist to close. Returned so the adapter makes the real request. Not blocking: the generated surface.d.ts does not match the contract, so the PageOf/Open fallbacks mean the ten new pages were typechecked loosely rather than against their contract signatures; regenerating that file is not this stage's work. The ruling would change to approve once attach_stored_file always issues the change request and attachment_refused reads the service's own answer to it.

**Conditions:**
- tests/adapters/old/index.ts fileAttachByIdentifier.attachStoredFile: when the record cannot be read (current.status !== 200 or the body is not an object), do not stand a GET in for the attach. Send the PUT {tag: "edit", value: {attachments: [<fileId>]}} (or the smallest edit body the service accepts) to openedRecord anyway, so attachment_refused and attachment_accepted read the service's answer to the attach itself and not to a read of the record.

### Runner-owned typecheck evidence

Proposal revision: `47fc5f4dc3c0a8fbf95f08a11c722fc6b49e7ca8`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
