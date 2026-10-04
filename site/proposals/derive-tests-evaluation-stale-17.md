| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T16:23:46.376Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** R-5.27 (v2), the one criterion handed back to me, now has a test for its remaining clause.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

R-5.27 (v2), the one criterion handed back to me, now has a test for its remaining clause. Its entry is gone from `tests/acceptance/not-testable.yaml`, so the criterion no longer carries a partial-coverage record beside its test. I could not type-check or run anything: both the TypeScript compiler and the test runner needed permission that wasn't given here, so the test has never been compiled or run against a target.

**What was owed.** `tests/acceptance/evaluation/R-5.27.spec.ts` already had three tests from the last approved derivation. They cover the move to consensus, the chair and owner being told, and the rule that the most recent version's panel decides the count (once on Team With Us, once on Sprint With Us with a third evaluator). The open entry named one clause: "but only over the proponents named in the submission that triggers the check". It could not be tested before because the only submission the surface offered named every proponent. When every proponent is named, a count over the named ones and a count over all of them always agree.

**What the contract added.** The contract stage supplied two things. One is the seeded opportunity `seed.opportunities.swuSubmissionNamesTwoOfThree` with proposals `swuNamedOne`, `swuNamedTwo` and `swuLeftOut`. The other is the request page `evaluationIndividualSubmissionRequestSwu`, with the action `submitScoresForConsensusNaming` and the observations `requestAccepted`, `refusalMessages` and `storedStatus`.

**The new test.** It is a fourth `test()` in the existing file, titled with the clause's own words:
1. It signs in as `persona.evaluationPanelEvaluator` (users.staffOne).
2. It reads `storedStatus` to confirm the opportunity starts in `EVAL_QUESTIONS_INDIVIDUAL`, then empties the mail catcher using the file's existing helper.
3. It submits naming only `seed.proposals.swuNamedOne.id` and `seed.proposals.swuNamedTwo.id`, and asserts the request was accepted. If it was refused, the failure message shows the service's refusal text.
4. It polls `storedStatus` until it reads `EVAL_QUESTIONS_CONSENSUS`.
5. It confirms through the caught messages that both the chair (administratorOne) and the owner (staffOne) were reached.

Counted over the two named proponents the scores are complete (16 of 16). Counted over all three they would be 16 of 24, because `swuLeftOut` has no scores at all. So the move and the notice can only happen if the count was limited to the named proponents.

**One input-shape assumption.** The surface describes the action's input only as the proponents to name, "as seed.proposals handles (or proposal identifiers)". I passed `{ proposals: [<ids>] }`. The input is untyped, so the adapter has to read that key; if it expects another one, this test will fail on that rather than on the behaviour.

No criteria are left untestable in this run, and I needed no surface action or observation that the contract does not already provide. I changed nothing outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new R-5.27 (v2) test follow from the criterion and nothing else, and does it close the clause 'but only over the proponents named in the submission that triggers the check' that not-testable.yaml recorded as unasserted? Ruling: approve. The test uses the contract's seeded opportunity swuSubmissionNamesTwoOfThree, where the chair's scores for two proponents are submitted, the evaluator holds complete drafts of the same two, and the third proponent has no scores at all. It submits naming only those two, then asserts that the opportunity moves to consensus and that the chair and the owner are told. Counted over the named proponents the scores are complete (16 of 16); counted over all three they would not be (16 of 24). So the assertions can only pass if the count was taken over the named proponents, which is exactly the clause, together with the criterion's own move and notice. The only other assertions are preconditions: the starting status, and the request being accepted so that a refusal is reported clearly instead of being mistaken for a behavioural failure. The status values EVAL_QUESTIONS_INDIVIDUAL and EVAL_QUESTIONS_CONSENSUS are the ones the contract's stored_status observation names, not anything taken from the implementation. The input key 'proposals' is read by both the old and new adapters' submitScoresForConsensusNaming bindings, so the input-shape risk the author raised does not apply. Removing the R-5.27 clause entry from not-testable.yaml is correct, because the clause is now asserted. The runner's typecheck passed with no diagnostics. The owed missing test for R-5.27 closes when this test runs, so no condition is attached. What would change the ruling: a run showing the opportunity moving to consensus for a reason other than the count over the named proponents, or a binding that could not carry the named proposals through.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `716896377ed21841e9b84066cfd0be04da5355e3`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
