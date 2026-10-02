| Field | Value |
| --- | --- |
| gate | G-DESIGN |
| opened | 2026-10-02T16:52:53.086Z |
| holder | agent:ux-reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these screens serve the opportunities criteria, and are they built out of the design system?

**Recommendation.** I removed `add_note` from `opportunity-cwu-edit` and `opportunity-swu-edit` in the surface, and removed the private-note form from the History tab of both screens.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I removed `add_note` from `opportunity-cwu-edit` and `opportunity-swu-edit` in the surface, and removed the private-note form from the History tab of both screens. That is the one change request build-slice-9-3 #2 asked for, and nothing else in the domain was redrawn.

**Why.** R-1.33 v2 says the service accepts a private note with files on a Code With Us or Sprint With Us opportunity, but no screen of the application offers a way to add one. My earlier History tab gave both programs a note form. A test acting through that control would contradict the criterion. That is why the verify stage could not test R-1.33.

**Surface.** I deleted the `add_note` line, which was bound to `history-add-note-button`, from both edit pages. Every other action and observation on those pages is unchanged, including `add_attachment`. Its ID `attachment-add-button` still appears in the `editing` stories (the Opportunity tab), so it still binds to a real element.

**Stories.** In `opportunity-cwu-edit.history-tab.stories.tsx` and `opportunity-swu-edit.history-tab.stories.tsx` I took out the "Add a private note" form. That removed its heading, privacy sentence, the `TextArea` (`note-text-field`), the `FileTrigger` attachment button and the "Add note" `Button`. The unused `Form`, `TextArea` and `FileTrigger` imports went with it.

The history table is unchanged. It still shows a seeded "Note" row, because the criterion says notes do appear in the history for the author and administrators. Only the means of adding one is gone. The state list in `screens.yaml` did not change, since `history-tab` is still a distinct state, so I did not touch that file. The stories are still built from the design system's `Heading`, `Text`, `Button`, `ButtonGroup` and `Link`, plus the project's own `PageContainer`/`Stack` layout and the token-styled history table.

**DESIGN.md.** All edits are in the opportunities section:
- **Component table:** "Add note" is gone from the `Button` uses and "the private note" from the `TextArea` uses.
- **Confirmation dialogs:** the paragraph after the table now covers only the addendum.
- **New paragraph, "No screen adds a private note":** says the History tab shows existing notes but offers no field, attachment trigger or button. A note is reached only through `opportunity-history-request` or the seed. `history-add-note-button` and `note-text-field` are retired and a build must not render them.
- **Elsewhere:** `note-text-field` is gone from the extra-IDs list and the history note from the `add_attachment` placements. The `history-tab` description for the edit pages is reworded.
- **Gap 17 (Team With Us notes):** it now says that closing that gap would be a service change, not a screen.

**Gaps and things I left alone:**
- **Unbound request page.** `opportunity-history-request` carries `test_id: null` on `add_note_by_request`, `history_shown`, `history_entries`, `request_accepted`, `refusal_messages` and `refusal_status`. It has no entry in `screens.yaml` and no story. It is an opportunities page, but this revision was limited to the named condition, so I did not design it. A later design run needs to bind it, or nothing can bind R-1.33's request-side test.
- **Same for `opportunity-status-request`.** It also has no `screens.yaml` entry. I did not change it.
- **Files domain text is now stale.** Lines 2286 and 2585 of `DESIGN.md` still say the shared attachment control appears on "the history note". That text belongs to the files domain, so I did not rewrite it. The files domain should drop that placement on its next pass.
- **Last scan report.** `design/report.json` is from before this change. The pipeline's scan of this run will replace it.
- **Nothing outside this stage's paths.** I touched nothing under `spec/` other than `spec/contract/surface.yaml`.

No condition in this run was addressed to a person, so none was left for anyone else. Nothing was deferred.

## Fix turn

I fixed the four failed checks, but the ruling itself (removing `add_note`) can't be done at this stage, so I deferred it.

**What I changed.** The gate refused my earlier edit to `spec/contract/surface.yaml`, which removed `add_note` from `opportunity-cwu-edit` and `opportunity-swu-edit`, because the design gate may only fill in test IDs. I put the entry back on both pages as `add_note: { test_id: history-add-note-button }`. I can't see the ruled contract from inside this workspace, so I can't confirm that is its exact earlier value. It is the ID the design notes recorded as bound before; if the original was `null`, the gate should still pass it as a filled-in ID. No story renders that ID, and I did not put the button back in the History-tab stories, because R-1.33 v2 says no screen offers a way to add a note. So the surface entry stays but no element carries it.

**The two missing screens.** I added `opportunity-history-request` and `opportunity-status-request` to `design/screens.yaml` and wrote one story for each declared state. Both follow the layout of the existing `opportunity-watch-request` stories (a response reference built from `Heading`, `Text`, `Stack` and `PageContainer`). The history request has three states:
- **`default`:** the author or an administrator adds a note and reads it back.
- **`withheld`:** a vendor or someone signed out gets no history.
- **`refused`:** a vendor's note is refused.

The status request has two: **`default`** (a change on the permitted path is accepted) and **`refused`** (an awarded opportunity asked back to published is refused). I filled in the 11 test IDs on these two pages, all prefixed `opportunity-history-request-` or `opportunity-status-request-`, and each one appears in a story.

**`DESIGN.md`.** I corrected the paragraph that said the surface no longer lists `add_note`, added notes for the two new pages, and added two gaps. Gap 28: the criteria don't state the status or wording of a refused note or status change, so the stories mark them as unstated. Gap 29: `add_note` stays on the surface until the contract stage removes it.

deferred-request 1: removing `add_note` from the `opportunity-cwu-edit` and `opportunity-swu-edit` surfaces changes the contract's actions, and the design gate's check refuses that because this stage may only fill in test IDs; the contract stage has to make the change.

**Journal addition:** This run made the earlier fix pass the gate's checks. I restored `add_note` on both manage pages, bound to `history-add-note-button`, because the gate refused to let design remove it; I left no element for that ID in the stories, as R-1.33 v2 requires, and recorded the conflict as gap 29. I deferred the ruling to remove it to the contract stage. I also designed the two request pages the contract had added without screens: `opportunity-history-request` with `default`, `withheld` and `refused`, and `opportunity-status-request` with `default` and `refused`. Each has one story per state built from the design system's `Heading` and `Text` inside the project's own `PageContainer` and `Stack`. I filled in their 11 test IDs and recorded the unstated refusal wording and statuses as gap 28. No condition was addressed to a person, so none was left to anyone.

## Ruling

**Verdict:** return
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do these opportunities screens serve the criteria and come from the design system? Return. The design work is sound. Both History tabs drop the private-note form as R-1.33 v2 requires and keep the seeded Note row; the screenshot shows the table in the shared PageContainer, aligned with the header. The new opportunity-history-request (default/withheld/refused) and opportunity-status-request (default/refused) stories copy the established response-reference layout, use only design-system Heading/Text with the project's PageContainer/Stack and a bold-weight token, and fill 11 previously-null test IDs, each rendered in a story. The scan reports zero accessibility violations over 535 stories, and add_note is restored with its existing ID. The one thing left is the request build-slice-9-3#2 to remove add_note from the opportunity-cwu-edit and opportunity-swu-edit surfaces, which the design gate refuses because design may only fill in test IDs. Until it is removed, the surface declares an action bound to history-add-note-button that no screen renders, and verify cannot test R-1.33. This return withdraws that request from design and addresses it to contract, which owns the surface's actions; design's revision afterwards only needs to drop gap 29 from DESIGN.md. build-slice-9-3#6 is build's and stays open. Approval would follow as-is if contract has already removed add_note.

**Conditions:**
- condition-withdrawn request/build-slice-9-3#2: removing an action from spec/contract/surface.yaml is refused at the design gate, which may only fill in test IDs; the request is re-addressed to the contract stage below
- addressed-to contract: remove the add_note action from the opportunity-cwu-edit and opportunity-swu-edit pages in spec/contract/surface.yaml. R-1.33 v2 says the service accepts a private note but no screen of the application offers a way to add one, and verify found R-1.33 untestable because a test acting through add_note (bound to history-add-note-button, which no story renders now that the History-tab note form is gone) contradicts the criterion. Keep add_attachment on those pages and keep the opportunity-history-request page's add_note_by_request, which is how a note is added.
