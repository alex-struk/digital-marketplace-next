| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T13:59:14.163Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't typecheck the adapter or run it against the target.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've answered all three conditions; nothing is deferred. I couldn't typecheck the adapter or run it against the target. `npm run typecheck`, `npx tsc` and the local `tsc` binary all needed approval, and no one was here to give it. The new code has only been read through by hand. Each control it uses was seen on the running target at http://localhost:4300, signed in through the identity provider as the administrator who chairs the seeded panels (`test-admin`) and as the evaluator who is not the chair (`test-gov`).

**Condition 1 (the four consensus sheets).** The create and edit sheets for both programs are now served, so I walked them on seeded records:
- **Pages walked:** create on the one-outstanding Sprint With Us opportunity's third proposal; edit on the all-agreed Sprint With Us and Team With Us opportunities' first proposals, with the chair's own user id; edit on the past-consensus opportunity.
- **What the chair sees:** the sheet is headed "Proponent N". Under each question is a table "Evaluators' scores for question N" and the boxes "Agreed score for question N" and "Agreed comment for question N". The buttons sit in a "Consensus actions" group: "Save draft" (create) or "Save changes" (edit), plus "Save and go to next proponent". The edit sheet also shows "Status: Submitted".
- **Duplicate:** saving a second consensus for a proposal that already has one is refused with the alert "You already have a team question consensus for this proposal." Nothing was stored.
- **Not the chair:** the evaluator is shown a note, "Only the chair records the consensus", and the agreed values as plain text, with no boxes and no buttons.
- **Finalized:** after finalizing, the chair is shown "The consensus scores have been finalized" and no buttons.

I replaced the old stub, which reported every member absent, with a real binding (`consensusSheetPage` in `tests/adapters/new/index.ts`). What each member hands back matches the old binding:
- `chair_only` returns nothing while the boxes are offered, otherwise the note or the not-found answer.
- `editable_after_submitted` returns "enabled", "disabled" or "absent".
- `consensus_status` returns the status value.
- `panel_member_score` and `panel_member_notes` return the sheet's text, with the evaluators' tables in it.
- Actions on a sheet that shows the chair-only or finalized note throw `refused:`. A score or comment box missing from a sheet that does load throws `unbound:`.

All 34 members of these four pages are now `bound` in `bindings.yaml`.

**Condition 2 (finalize on the consensus list).** The old binding looked for "Finalize consensus scores" only inside the Consensus section. It is actually in the page's "Opportunity actions" bar, next to "Edit" and "Cancel opportunity". Pressing it opens a dialog, "Finalize the consensus scores?", with "Cancel" and its own "Finalize consensus scores" button.

I confirmed it on the one-outstanding opportunity. That drew an alert above the sections: "The consensus scores could not be finalized" / "Not all consensuses have been submitted." No state changed.

The rebinding, done the way the old binding does it:
- **The press:** the finalize action now presses the button in the actions bar. If the opportunity is at consensus but the reader isn't offered the button, it throws `refused:`.
- **The confirm:** the confirm action presses the dialog's button and waits for the result. If the page shows a refusal, it keeps the alert's lines and throws `refused:`.
- **The two refusal readers:** they read the page's alerts plus that kept refusal.

`finalize_confirmation_modal` reads the dialog. These five members are `bound` for both programs.

I didn't trigger the no-screenable-proponent refusal myself. Its wording comes from the ruling, and the reader matches it with the same filter the old binding uses. I also didn't finalize either opportunity set aside for the finalize criterion (R-5.32), because finalizing can't be undone.

**Condition 3 (not-found before consensus).** On the Sprint With Us opportunity still at individual evaluation (…0701), both consensus routes answer "Page not found", to the chair too. Opening a sheet no longer decides anything. The members that follow read the not-found answer as the refusal:
- Actions throw `refused:`.
- `chair_only` returns the not-found text.
- `consensus_status` and the panel readers return nothing.
- `editable_after_submitted` returns "absent".

The trade-off: a not-found answer to the administrator for some other reason, such as a wrong identifier, would also read as a refusal rather than as unbound.

**Left alone on purpose:** the other members of the two consensus-list pages (the proponent table, the open-consensus link and "Submit final consensus scores") weren't named by these conditions. Their reasons in `bindings.yaml` still say "unbound", with a description of the section that is out of date: it now has a table of proponents and a submit button. Their code already uses a table or button wherever one appears, so the bindings file understates what the adapter can reach on those pages. That needs a later rebinding to correct.

Every page route I opened resolved on the target. I didn't change anything outside `tests/adapters/new/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does this adapter bind every surface action and observation on new, and nothing else? Returned. The three revision requests from build-slice-18 are answered: the four consensus sheets are bound by consensusSheetPage with navigation, locators and refusal reporting only (no assertion or business logic); finalize is rebound to the 'Opportunity actions' bar, its dialog, and the refusal alert; the not-found answer before consensus is read as the R-5.29 refusal. Nothing under tests/acceptance changed, and the runner's typecheck on 83f560fe5 passed with no diagnostics under adapters/new. But bindings.yaml still records unbound reasons for seven other members of evaluation-consensus-list-swu and -twu stating the Consensus section 'shows only one sentence… no table, link or button', which the proposal itself says is now false (the section renders a table of proponents and a submit button). An unbound reason has to be real; a stale one makes verify report the application as missing surfaces it now provides and would misdirect build. Rebinding those members, or replacing each reason with a current specific one, would change this ruling to an approval.

**Conditions:**
- In tests/adapters/new/bindings.yaml, on evaluation-consensus-list-swu and evaluation-consensus-list-twu, the unbound reasons for open_proponent_consensus, submit_final_consensus_scores, confirm_submit_consensus, cancel_modal, proponent_row, consensus_status and submit_confirmation_modal still say the Consensus section shows only one sentence with no table, link or button; this proposal reports that the section now renders a table of proponents and a submit control. Walk those pages again as the chair and bind each member to what is rendered, or replace its reason with a current, specific one naming what the page actually lacks.

### Runner-owned typecheck evidence

Proposal revision: `83f560fe5c0713c21188dd7aabaf2a8d72008a6f`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
