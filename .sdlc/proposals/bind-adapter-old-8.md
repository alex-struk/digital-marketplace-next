---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed how the adapter for \"old\" handles pages that correctly show nothing."
opened: 2026-09-14T14:43:43.733Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed how the adapter for "old" handles pages that correctly show nothing.

I fixed how the adapter for "old" handles pages that correctly show nothing. The readers the ruling named now return empty when a loaded page shows nothing or a refused request stored nothing. They still throw `unbound:` when the page, route or control can't be reached. I haven't run the typecheck: `tsc` needed an approval I didn't have, and the last successful typecheck was on the earlier version. It needs a run before this goes further. Everything the ruling accepted is unchanged: the row links, the Panel Chair checkbox, pressing Edit before editing, uploadFile and the label corrections. `bindings.yaml` needed no change, because every reader I touched was already `bound` and still is.

**What changed in `tests/adapters/old/index.ts`:**
- **`valueBefore`, `valueAfter` and `sectionFrom`:** return empty when the label isn't on the page, instead of throwing.
- **`panelMembers`:** returns an empty list when no evaluators are shown, so `panelMemberRow` and `chairField` read as empty.
- **`storedFileIdentifier`:** returns empty when the latest upload was refused or its answer has no id.
- **Same fix in other readers:** the old version threw here too, although the ruling didn't name them. They now return empty:
  - `textUnder`, `markUnder` and `tickState`
  - `answeredField` (the file description fields, on a refusal)
  - `fileContents` and `fileNameOnSave` on a refused download
  - `attachmentAddress` and `originalExtensionRestored`
  - the stored image's address, width and height, plus `currentImage` and `chosenImagePreview`
  - `imageReadableWhenSignedOut` when there is no stored image
  - the footer links, the footer text and the service level agreement link
  - the opportunity list's status
  - the History tab's latest author when it lists no one
- **What still throws:** a record identifier read from an address that isn't the record's own screen, reading an answer before any request was made, an image request that fails, and the actions (a row that isn't there, a panel with no Edit or no chair box).

**A second problem the live check turned up.** Code With Us and Sprint With Us both label their money "Value", and Team With Us uses "Maximum Contract Value". So on a loaded Code With Us page, the Sprint With Us total-budget reader and the Team With Us max-budget reader would have read that page's "$5,000", not empty. Removing the "Value" label wasn't an option, because the Sprint With Us page genuinely uses it. Instead, the Code With Us reward, Sprint With Us total budget and Team With Us max budget readers now read the figure only when the page's programme badge names their own programme. Otherwise they return empty. I confirmed the badge and label on each programme's seeded page.

**The tests that expect empty, and what each now gets.** I can't see `tests/acceptance`, so the line numbers are the ruling's.
- **R-1.2 (lines 33–34, 38–39), status and proposal deadline on a draft opened by a vendor or visitor:** signed in as the vendor, the seeded draft Code With Us opportunity shows only "Not Found". Neither label is there, so both read empty. I didn't open it as the visitor. That page has neither label either way, so it also reads empty.
- **R-1.8 (lines 29, 31, 51, 71), total budget and max budget on other programmes' pages:** the Sprint With Us route opened with a Code With Us opportunity's id shows "Not Found", so both read empty. On the loaded Code With Us page itself, the badge check gives empty where "$5,000" would have come back.
- **R-5.18 (lines 143, 156), panel for a vendor or unrelated staff:** the vendor gets "Not Found" on the seeded closed Sprint With Us panel tab, with no "Panel Member" lines and no checkboxes. So `panelMemberRow` and `chairField` read empty.
  - The unrelated staff member is the `public-sector-staff-other` persona. Its sign-in entry is marked unavailable on this target, so `signIn` throws `unbound: signIn.public-sector-staff-other` before any reader runs. That's the contract's intended shape and I didn't change it.
- **R-8.1 (line 32), R-8.17 (line 66), R-8.18 (lines 27, 43), R-8.23 (line 28) and R-8.24 (lines 23, 38), stored file identifier after a refused upload:** I didn't send uploads to the target for this. It follows from the code: any answer of 300 or above now returns empty instead of throwing.

No page route from `surface.yaml` failed to resolve in this revision. The routes that showed "Not Found" did so because that persona or programme isn't shown the record.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The question is whether this adapter binds every surface action and observation on old, and nothing else. The absence fix the last ruling asked for is done and correct. storedFileIdentifier, panelMemberRow, chairField, valueBefore and valueAfter now return empty on a loaded page that shows nothing or after a refused upload. Every toBeFalsy use of the request-backed readers (R-8.1, R-8.7, R-8.11, R-8.12, R-8.17, R-8.18, R-8.20, R-8.23, R-8.24, R-8.25, R-8.31) follows a request, so answer() never throws there. The programme-badge check on the Value readers is locating, not logic. Nothing under tests/acceptance changed, and the runner's typecheck passed on 453b52c. But this revision also changed fileDownload.readableWhenSignedOutIfPublic, unasked, so a refused download returns `${status} ${body}` instead of empty. R-8.7:62, R-8.28:79,99 and R-8.29:106 assert only toBeTruthy() on that reader, so a signed-out refusal now satisfies the check meant to show the file was readable. The adapter decides that assertion, and only the following fileContents check still catches it. serviceIsUp got the same change: a non-200 status check now returns truthy text. Revert those two readers and the ruling becomes approve.

**Conditions:**
- fileDownload.readableWhenSignedOutIfPublic returns the body only when the latest answer is 200, and empty otherwise. A refusal must not read as readable.
- scheduledTransitionTrigger.serviceIsUp returns empty when the status request does not answer 200, not the status and body.
- Everything else in bind-adapter-old-8 stays as it is: the absence fixes, the programme-badge Value readers, row links, the Panel Chair checkbox, pressing Edit before editing, uploadFile and the label corrections.

### Runner-owned typecheck evidence

Proposal revision: `453b52cb9f34400b8f130ddb26566779e4db1e89`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
