| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T05:24:02.667Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed one member, `proposal-cwu-edit.proposal_tab` in `tests/adapters/old/index.ts`, to fix the calibration finding R-2.2.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed one member, `proposal-cwu-edit.proposal_tab` in `tests/adapters/old/index.ts`, to fix the calibration finding R-2.2. I could not run the type check or the test suite: every attempt to run `tsc` was refused permission. The code has not been run. What I checked is by hand in the browser, below.

**What was wrong.** The member clicked the "Proposal" tab and returned whatever step the edit wizard was showing, which was "1. Proponent". It also read only the text visible on the screen, which leaves out what is typed in a text box. So the proposal text itself never reached the test.

**What I checked on the target.** I signed in through the organization owner's session route. I opened the seeded submitted Code With Us proposal (`cwuSubmissionBesideDraft` on `cwuLapsedWithSubmissionAndDraft`) at its `/edit` route. The route opens, and the "Proposal" tab link is there. The wizard has three steps: "1. Proponent", "2. Proposal" and "3. Attachments". Clicking the current step's name opens a menu of all three. On "2. Proposal" the proposal text sits inside a text box labelled "Proposal", which is read-only until Edit is pressed. It holds "The seeded proposal text of proponent 1.", and that text appears nowhere else on the screen.

**The fix.** The member now:
- opens the "Proposal" tab;
- goes to the "Proposal" step, through the step menu, or by the Previous/Next buttons if the menu fails;
- returns the step's visible text plus the value of each text box, so the proposal text comes back as "Proposal: …".

It still returns empty text when the reader isn't offered the tab at all, as before. If the tab opens but the wizard has no "Proposal" step, it now throws `unbound:` with that reason. I didn't find that case on the target.

**Scope.** I only overrode the Code With Us edit page. The Sprint With Us and Team With Us edit pages, and the review pages, still use the shared reader, because the finding only named this page. They may have the same problem if their proposal text also sits inside a text box on a later step. That's worth checking in the next calibration.

**Bindings.** `bindings.yaml` already listed `proposal_tab` as bound for this page, and I left it unchanged. Every page route I opened resolved on the target. I edited nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the rewritten proposal-cwu-edit.proposal_tab bind R-2.2's observation on old, and nothing else? Ruling: approve. The escalation came from the rebind loop limit (3 sends against policy.loops.rebind of 2), not from a pipeline defect, so it is ruled here on the merits. The diff is a single member override in tests/adapters/old/index.ts that answers the third send exactly: it moves the wizard to the '2. Proposal' step (goToStep via the step menu, walkToStep via Previous/Next as fallback) and returns formText(), which joins visible text with fieldValues(), so the value of the 'Proposal' text box now comes back. It only uses helpers already defined in the adapter (enterTab, currentStep, goToStep, walkToStep, formText), it keeps the existing empty-text result when the tab is withheld, and it adds an unbound: throw that points at the right member when the step is missing. The runner's own tsc on revision bdd7f67 passed with no diagnostics under adapters/old/, which answers the author's note that it could not type-check. Nothing outside tests/adapters/old/ changed and bindings.yaml already listed the member as bound. What decided it was the third item in the escalation: the diff matches that request and goes no further. What would change it: the next calibration still reading the proposal text as absent on this page, or the seeded submitted CWU proposal opening with no '2. Proposal' step. The SWU/TWU edit pages the author flagged are not in evidence yet and do not justify widening this diff.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `bdd7f67b26fa656304f43b8cfa60235a83ffaa47`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
