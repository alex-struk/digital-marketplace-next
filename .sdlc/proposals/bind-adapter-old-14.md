---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "All 66 members the contract added are now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.yaml`, and I made all six calibration fixes."
opened: 2026-09-25T09:44:41.268Z
---

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
