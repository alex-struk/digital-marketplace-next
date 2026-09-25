---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-25T11:48:43.884Z"
cost: 2.6190196000000006
turns: 81
session: "c9d526d7-3cbf-486d-93ed-6cc6ac14eeef"
---

The "old" adapter now covers the five members this contract adds. All six calibration findings were already fixed in the adapter I was handed. I didn't change them, but I re-checked four of them by hand on the running target. I could not type-check or run the adapter itself: the workspace has no installed packages, and running node or python here needed approval I didn't have. The code and the bindings were checked by reading them, and the target was checked by driving it by hand.

**New bindings, all bound:**
- **`mail-delivery-fault`** (`refuse_delivery`, `restore_delivery`, `delivery_refused`) talks to the mail catcher's fault switch at `SDLC_MAIL_API` + `/api/v1/chaos`. Refusing sets the sender's refusal chance to 100 (code 451) and restoring sets it back to 0. On the running catcher, reading, refusing and restoring all answered 200, and I left delivery restored. `delivery_refused` reads the setting fresh each time: it returns "refused 451" while the fault is on and empty when mail is accepted. If the catcher's fault switch is missing, it throws `unbound:`.
- **`evaluation-panel-request.submit_panel_with_no_chair`** sends the members the input names (seed handles, identifiers or addresses) as the opportunity's whole panel: every one an evaluator, none the chair. It accepts a list, a list under a key like `members`, or one member per field. A name the seed doesn't know throws `unbound:`.
- **`evaluation-panel-request.missing_chair_error`** returns the service's refusal if there was one, and empty if the panel was accepted. It throws `unbound:` if no chairless panel was sent first.

**This target accepts a panel with no chair.** Signed in as an administrator on the seeded closed Sprint With Us opportunity, I sent two public-sector evaluators with no chair. The service answered 200 and stored them that way, so on this target `missing_chair_error` will correctly read empty and `panel_as_stored` will show the chairless panel. Any criterion expecting a refusal will fail on the service, not the adapter. I put the original panel back straight afterwards.

**Calibration findings, re-checked on the target:**
- **R-7.9:** `deletedSuccess` already uses `alertLines(/deleted/i)`. I created a scratch content page, deleted it, and the same logic read "Page Deleted" and "Adapter probe has been deleted."
- **R-1.15:** both `scoreWeightError` readers already gather messages from every step with `stepMessages`. I did not walk the long Sprint With Us create form again to confirm it.
- **R-1.16:** "Prototype" (and "Prototype phase") is already mapped to "Proof of Concept". This one I checked by reading the code only.
- **R-8.20 / R-8.25 (proposal):** `attachmentAddress` already closes any open dialog and goes to "3. Attachments" first. As a vendor, I submitted a Code With Us proposal with attachments. It landed on "1. Proponent", as the findings said, and from "3. Attachments" the file links read correctly.
- **R-8.31:** removing an existing attachment already chooses "Edit" from the Actions menu when the step is read-only. On the seeded published Code With Us opportunity, the Attachments step showed no "Add Attachment" until I chose Actions → Edit; after that the file chooser appeared.

**What I left on the target:**
- One Code With Us proposal from the third vendor account on the seeded published opportunity, which I withdrew.
- Its two stored files.
- Deleting the scratch content page left nothing behind.

**Other notes:**
- About a minute into the session the target stopped answering every request, pages included, for roughly a minute, then recovered on its own. If calibration hits the same stall, it would show up as timeouts that aren't the adapter's fault.
- Every page route in `surface.yaml` that I touched opened on the target.

I wrote only `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml`. In `bindings.yaml`, the five new names are `bound` under their contract spellings, each named once.

## Fix turn

I fixed both compile errors the check named in `tests/adapters/old/index.ts`. I couldn't confirm the fix: running the TypeScript compiler here needed approval that wasn't given, so the next stage's compile is the first real test.

**What caused it:** the suite is being compiled against an older version of the generated surface. That version has the evaluation-panel-request page but not the `submitPanelWithNoChair` action on it. The adapter typed that page strictly, so the compiler refused the extra member. Once the member was refused, its `input` parameter also lost its type, which caused the second error.

**What I changed:**
- **Line 6011:** the page's declaration is now `Open<PageOf<"evaluationPanelRequest">>` instead of `PageOf<"evaluationPanelRequest">`. `Open` is already in the file for this exact case (a page that gained members since an older surface) and four other pages use it the same way. It allows the new member without loosening any member the older surface already had.
- **Line 6030:** the parameter is now written as `input?: unknown`. That matches what the newer surface declares, and it no longer depends on the compiler inferring the type.

Nothing else changed, including `bindings.yaml`.

**Journal addition:** The acceptance suite failed to compile with two errors in the evaluation-panel-request page. The suite was being compiled against an older generated surface that has that page but not its `submitPanelWithNoChair` action, so the compiler rejected the member as unknown and could no longer type its `input` parameter. I declared the page with the file's existing `Open<…>` wrapper, as it already does for four other pages that gained members since an earlier surface, and wrote the parameter out as `input?: unknown`, which matches the newer surface. No other code and no binding changed. I could not run the compiler in this session to confirm the fix, because running it needed approval that was not given.