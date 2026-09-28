---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-28T18:11:35.653Z"
cost: 1.2313682000000001
turns: 30
session: "e3f30fdf-84b9-48cd-90d8-d1ea4927d12e"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

The "old" adapter now binds both consensus-submit actions to the real "Submit Final Consensus Scores" control and its confirmation dialog, and neither ever presses "Finalize Consensus Scores". I could not typecheck it or watch the submit control work on the target. The typecheck command needed an approval this session couldn't get, so I checked the edit by reading it. Seeing the submit control needs a consensus still in draft, and no seeded record has one.

**What changed.** All changes are in the two consensus-list bindings, `evaluation-consensus-list-swu` and `-twu`, in `tests/adapters/old/index.ts`:

- **`submit_final_consensus_scores`** looks in the top bar for "Submit Final Consensus Scores" and presses only that.
  - If the control is disabled, it throws a refusal.
  - If the bar shows "Finalize Consensus Scores" instead, it throws a refusal saying no consensus is left in draft. It never clicks Finalize.
  - If the bar shows neither, it gives the tab's existing answer for a reader who is offered nothing: a refusal when the opportunity is at consensus, otherwise `unbound`.
  - Each refusal is also saved for the error readers.
- **`confirm_submit_consensus`** first checks that the open dialog's own action is "Submit Final Consensus Scores". A dialog whose action is Finalize is left alone and named in the error. It then presses the button and waits for the outcome notice ("Consensuses Submitted" or "Unable to Submit Consensuses"), the same way the finalize confirmation waits. A failure notice is reported as a refusal. To do this, the finalize wait now takes an optional check for which dialog it expects.
- **`submit_confirmation_modal`** now reads only the submit confirmation and returns empty for any other dialog, including the finalize one.
- **`bindings.yaml`**: both members are back to `bound` on both pages.

**What I checked on the target.** Signed in as the administrator on the seeded Sprint With Us opportunity at consensus with one consensus outstanding, the top bar shows only "Finalize Consensus Scores". The earlier probe saw the same thing, because one consensus there is submitted and the other has not been started, so none is a draft.

I opened the finalize confirmation and cancelled it, so nothing changed. Its button is plain text rather than a real button, so the dialog check falls back to matching the text exactly. Against this dialog the check correctly reports "not the submit confirmation".

On this target the chair persona signs in as the administrator. That means the submit control only appears while a consensus is a draft. To reach that state I would have had to save a draft into a seeded record other criteria share, which the seed says does not move, so I didn't. The binding therefore follows the control, dialog wording and notices the ruling describes, and has not been run against a draft on the running target.

**Owed conditions.**
- **`bind-adapter-old-26#1`**: met. Neither submit member presses or confirms Finalize; seeing Finalize is reported as the page's refusal. They are bound to a real submit step, which the ruling showed exists.
- **`bind-adapter-old-26#2`**: met. `bindings.yaml` now matches the adapter for both members on both pages.

**Calibration findings.** Every "adapter failed" item was already fixed in the file I received; the line numbers they cite are from an older version. So I left them as they were:
- **R-3.10:** team rows already carry each member's email.
- **R-2.23:** submit ticks the terms boxes before confirming.
- **R-5.23:** a disabled "Submit Scores for Consensus" throws a refusal.
- **R-3.25:** the requirements read their met/unmet mark.
- **R-2.31:** the total score opens the Proposal tab first.
- **R-2.32:** the vendor's total and rank come from the Scoresheet tab and the "Ranking" card.
- **R-5.35:** the create page returns a single proponent name.
- **R-5.32 / R-5.36:** the finalize confirmation waits for its notice or for the control to leave the top bar.

Of the criteria calibration couldn't test because of unbound members, most of those members are already bound in the file I received:
- R-7.10 `publish_page`
- R-5.14 `finalize_consensus_scores`
- R-5.16 `add_panel_member`
- R-2.4 `delete_proposal`
- R-2.7 through R-2.37 (team-member, resource-answer and score-entry actions)
- R-4.8 `capability_checked`
- R-4.32 `toggle_export_field`

R-5.30 is covered by this change.

These stay unbound, with the reasons earlier revisions recorded, and I did not look at them again in this run:
- **First-time and self-reactivating personas (R-6.20, R-6.23, R-4.1, R-4.2, R-4.5):** this target has no identity provider, and its sign-in routes only open sessions for accounts that already exist.
- **`/sign-up/complete` members (R-4.3, R-4.23, R-4.24):** the route always redirects away and never shows the profile form.
- **`add_note` on the opportunity edit pages (R-1.33):** no screen offers a way to add a note.

Every page route I opened in this run resolved on the target, and I changed nothing outside `tests/adapters/old/`.