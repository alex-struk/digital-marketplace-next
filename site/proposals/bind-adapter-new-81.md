| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T12:22:23.077Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound most of the evaluation group on the "new" target: the running build now serves screens the last binding run had reported missing.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rebound most of the evaluation group on the "new" target: the running build now serves screens the last binding run had reported missing. I couldn't run the TypeScript compiler or any script here (those commands needed approval no one was there to give). So `tests/adapters/new/index.ts` has only been checked by reading it back. A compile is the first thing to do before calibration.

**What changed on the build.** The last binding run reported these screens as answering "Page not found" or falling back to the Summary. On 2026-10-04 they are served:
- **Dashboard:** /dashboard now has an "Evaluations" section listing the opportunities whose panel you sit on, with a "Dashboard sections" menu linking to it. On no panel, it shows a "You are not on the evaluation panel…" message instead.
- **Management screens:** the Sprint With Us and Team With Us management screens now have Instructions, Evaluation and Consensus sections. The Evaluation section lists proponents by anonymous name, links to each proponent's score sheet, and has a "Submit scores for consensus" button that stays disabled until every evaluation is complete.
- **Individual score sheets:** these now open for both programs, with a score box and a comment box per question and buttons to save a draft, save changes, or save and move to the next or previous proponent.
- **Refusals:** the owner who is not on the panel is offered only the Consensus section. The panel's own sheets answer "Page not found" to a staff member with no connection to the opportunity, while the administrator on that panel can read them.

I walked all of this as the panel evaluator (test-gov), the administrator who chairs the seeded panels, an account on no panel, and the owner who is not on the panel, using the seeded identifiers.

**Now bound:**
- the dashboard's Evaluations section and both show-section actions;
- both programs' Instructions pages;
- both programs' Evaluation lists;
- both programs' individual score sheets, create and edit;
- the Consensus section's message to the owner who is not on the panel;
- the management pages' Consensus, Instructions and Evaluation sections.

What the readers hand back:
- **Table readers** return one line per row with cells joined by " | ".
- **Anonymous names** come from the table's first column, or from the sheet's heading on a score sheet.
- **Read-only check** returns "read-only" for a submitted sheet, as the old binding does.
- **Refused readers:** a reader other than the administrator who is refused a screen reads nothing and the refusal is logged; an action they attempt is refused. The administrator being refused, or a screen that opens without the section, is unbound.
- **Disabled submit:** pressing a disabled "Submit scores for consensus" reports the refusal at once and keeps it for the incomplete-evaluation error.
- **Score and comment fields** are looked up when the action runs, by the label "Score/Comment for question N".

**Still not bound, and why:**
- **Consensus section (unbound).** On the seeded opportunities at consensus, signed in as the chair, it shows only one sentence: no table, no link, no button. Its actions, the proponent and status readers, the two confirmation dialogs and the two refusal messages are unbound. If a later build draws a control or table, the adapter will use it.
- **Consensus score sheets, all four (absent).** Every create and edit address answers "Page not found" to the chair and to the evaluator, and nothing in the application links to them. The adapter checks each time a method runs: absent while that is still true, unbound once the address answers anything else.

**Other edits:**
- **Section switching:** on the management screens, the code that switches sections compared the start of the `?tab=` value. It would have taken `tab=evaluationPanel` for `tab=evaluation`; it now compares the whole value.
- **Opportunity dashboard:** its readers now stay inside the My/All opportunities section, so rows from the new Evaluations table don't leak into the own-opportunities results.
- **Stale descriptions** that other unbound reasons quote were corrected, and an unused helper was removed.

**Seed data I changed.** While checking how a refused save looks, a "Save draft" on the seeded already-begun Sprint With Us opportunity stored an incomplete draft for its second proponent, as the panel evaluator. That draft has a score of 9 for question 1 and no comments. Unless the seed is reapplied, that proponent now reads "Draft: incomplete" instead of "Not started".

**Not checked.** I didn't see what a second "create" for an already-drafted proponent shows: the create address just redrew a blank form. So the duplicate-evaluation reader returns any alert line containing "already", "duplicate" or "exists".

No route in the contract failed to resolve apart from the consensus sheets above. I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the bind-adapter-new-81 adapter bind every surface action and observation on new, and nothing else? Approve. The diff touches only tests/adapters/new (bindings.yaml, index.ts) plus pipeline records; nothing under tests/acceptance or app/ changed. The new bindings for the dashboard Evaluations section, the SWU/TWU Instructions, Evaluation and Consensus sections, and the individual score sheets (create and edit) are navigation and locators only: readers return page text, refused non-admin readers read nothing with the refusal logged, and an administrator refused or a section missing reports unbound rather than deciding a result. The remaining unbound and absent reasons are real and name what the surface lacks: the Consensus section draws one sentence with no table, link or control even to the chair, and the four consensus score sheets answer 'Page not found' with nothing linking to them, re-checked at run time so they turn unbound once served. The section-switching fix (whole ?tab= value, so 'evaluationPanel' no longer matches 'evaluation') and confining the opportunity-dashboard readers to their own section are correct. The runner's typecheck on this revision passed with no diagnostics under adapters/new. The author's walk wrote a draft evaluation into the shared environment's seed (swuEvaluationAlreadyBegun, second proponent), which is environment state, not part of the diff; the seed should be reapplied before calibration. A compile failure at calibration, or evidence that the application offers a consensus control or link the adapter missed, would change this ruling.

**Conditions:**
- Reapply the seed before calibrating the 'new' target: during this binding run a 'Save draft' as test-gov stored an incomplete draft (question 1 score 9, no comments) for the second proponent of the seeded already-begun Sprint With Us opportunity, so that proponent reads 'Draft: incomplete' instead of 'Not started' until the seed is restored.

### Runner-owned typecheck evidence

Proposal revision: `2877c335d00d7b1e28b1789414741f8485d94858`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
