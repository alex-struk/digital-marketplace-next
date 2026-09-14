---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-14T14:43:43.684Z"
cost: 2.497080499999999
turns: 64
session: "bb01e892-1049-4529-a0a9-6c512dbca20f"
---

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