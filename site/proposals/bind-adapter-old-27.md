| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T18:06:32.250Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** The target has no separate submission step for them to press, so both are now unbound.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I've made the change the ruling asked for: the two "submit" consensus members no longer press "Finalize Consensus Scores". The target has no separate submission step for them to press, so both are now unbound. I couldn't run the typecheck because the command needed approval that nobody could give in this session.

**The consensus submit pair.** On both the Sprint With Us and Team With Us consensus tabs, `submit_final_consensus_scores` and `confirm_submit_consensus` used to press "Finalize Consensus Scores" and confirm it. That is the control the contract names separately as `finalize_consensus_scores`. Pressing it at "submit" finalised the consensus. So R-5.30's resubmission was refused because of the adapter, and in R-5.32, R-5.36, R-5.10, R-5.13, R-5.14 and R-2.35 the finalize step that followed found its control gone and reported a false unbound.

Before marking them unbound, I looked for a step that records the chair's consensus as submitted without finalising it. Signed in as the administrator (the chair), I opened the seeded Sprint With Us opportunity that has one consensus outstanding:
- The consensus tab's top bar offers only "Finalize Consensus Scores".
- Each proponent row offers only "Edit" (consensus begun) or "Start Evaluation" (not begun).
- The unbegun consensus sheet (Proponent 3) offers only "Save Draft", "Cancel" and "Previous Proponent".
- The begun sheet (Proponent 1) offers "Edit". In edit mode it offers "Save Changes", "Cancel" and "Next Proponent".

The Team With Us consensus tab had already been recorded as offering only "Finalize Consensus Scores". None of these is a submission step, so in `index.ts` both methods now throw `unbound:` naming what was looked at, and `bindings.yaml` marks the same two members unbound with the same reasons on both pages. The finalize pair keeps its own binding, including the wait for the success or refusal notice, or for the control to leave the top bar. Nothing was saved or submitted while looking; I opened the begun sheet in edit mode and left without saving.

**The calibration findings.** Every item in both calibration lists is already handled in the current file, so I left them as they were, as the ruling asked:
- **R-3.10:** team rows carry each member's email.
- **R-2.23:** submitting a Code With Us proposal ticks the terms boxes first.
- **R-5.23:** a disabled or missing "Submit Scores for Consensus" is reported as a refusal.
- **R-3.25:** each Sprint With Us requirement reads "Met" or "Not met" from the colour of its icon.
- **R-2.31:** the view pages open the Proposal tab before reading the total score.
- **R-2.32:** the vendor's total is read from the Scoresheet table, and the rank from the "Ranking" card.
- **R-5.35:** the create page returns the single current proponent's name.
- **R-5.32 and R-5.36:** finalising waits for the outcome.

The members from the second list were already bound as refusals or on their proper controls, or were accepted as unbound with reasons at the last review. Every route I opened this run worked.

**Not done:**
- **Typecheck:** the change is two methods that throw, and `confirmFinalize` is still used by `confirm_finalize_consensus`, so I don't expect new errors, but it hasn't been checked.
- **`submit_confirmation_modal`:** the ruling didn't name it, so it is still bound to whatever dialog is open. With no submission step, it can only ever show the finalize confirmation. A reviewer may want it unbound too.
- **Leftover records:** the "Adapter probe" opportunities and draft proposal from an earlier run are still on the target, and that cleanup belongs to the oracle reseed.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Does this adapter bind every surface action and observation on old, and nothing else? Returned. Now marked unbound, submit_final_consensus_scores and confirm_submit_consensus no longer press Finalize, which bind-adapter-old-26#1 asked for. But the unbound reason ('no consensus-submission step apart from finalising') is not real. The target's consensus tab puts one conditional control in its top bar: 'Finalize Consensus Scores' only when every existing consensus record is submitted and the viewer is an administrator, and otherwise 'Submit Final Consensus Scores' for the chair, whose 'Please Confirm' dialog carries its own 'Submit Final Consensus Scores' button. This holds on both Sprint With Us and Team With Us. The probe looked only as the administrator in a state with no draft consensus (one submitted, one not begun and so with no record), which is exactly when the submit control gives way to Finalize. The typecheck reports no diagnostics under adapters/old/, and the other changes stay within navigation and locators. The ruling would change to approve once both members are bound to the submit control and its dialog, never falling back to the Finalize control or its confirmation.

**Conditions:**
- tests/adapters/old/index.ts evaluationConsensusList: bind submitFinalConsensusScores to the top-bar control labelled 'Submit Final Consensus Scores' and nothing else. The target shows it to the chair at consensus in place of 'Finalize Consensus Scores' whenever a consensus is still a draft, or the chair is not an administrator. The run-27 probe looked only as the administrator with no draft consensus present, so it saw only Finalize. Where the top bar shows 'Finalize Consensus Scores' instead, or nothing, report that as the page's refusal or state. Never press Finalize.
- tests/adapters/old/index.ts evaluationConsensusList: bind confirmSubmitConsensus to the 'Submit Final Consensus Scores' button inside the 'Please Confirm' dialog that the submit control opens. The dialog's body begins 'By submitting this consensus, you, as the chair...'. Wait for the outcome notice ('Consensuses Submitted' or 'Unable to Submit Consensuses'), the same way confirmFinalize waits for its own notice. Do not accept a dialog whose button is 'Finalize Consensus Scores'.
- tests/adapters/old/index.ts evaluationConsensusList: submitConfirmationModal must read only the submit confirmation (the dialog whose action is 'Submit Final Consensus Scores') and answer empty for the finalize confirmation. Today it returns whatever dialog is open.
- tests/adapters/old/bindings.yaml evaluation-consensus-list-swu and evaluation-consensus-list-twu: set submit_final_consensus_scores and confirm_submit_consensus back to bound, in line with index.ts once the conditions above are done.

### Runner-owned typecheck evidence

Proposal revision: `e62cdae3678a4d96505495f0db36dcc067f1d06f`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
