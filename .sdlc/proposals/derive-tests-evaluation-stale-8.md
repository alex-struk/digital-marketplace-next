---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "I rewrote the R-5.29 test in `tests/acceptance/evaluation/R-5.29.spec.ts` and added an entry to `tests/acceptance/not-testable.yaml` for the parts of the criterion no test can reach."
opened: 2026-09-28T16:17:46.387Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote the R-5.29 test in `tests/acceptance/evaluation/R-5.29.spec.ts` and added an entry to `tests/acceptance/not-testable.yaml` for the parts of the criterion no test can reach.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote the R-5.29 test in `tests/acceptance/evaluation/R-5.29.spec.ts` and added an entry to `tests/acceptance/not-testable.yaml` for the parts of the criterion no test can reach. I could not type-check the test or parse the YAML: the workspace has no TypeScript compiler, and running a YAML check needed approval that nobody was there to give. The new entry follows the same layout as the ones already in that file.

**What changed from the rejected test.** The old test checked whether the evaluator who is not the chair was *offered* a place to record a consensus, and it required a duplicate-error notice for the chair's second attempt. The new test does neither. In both cases the person actually makes the attempt: they enter a score and a note for every question and save. If the screen won't let them, that also counts as a refusal. Each test then decides pass or fail from what exists afterwards, not from whether a message appeared.

**The starting state.** The old test walked the closed Team With Us opportunity through individual evaluation to reach consensus. The new one uses the seeded Sprint With Us opportunity that is already in consensus. The chair has agreed a consensus for its first two proponents and not started one for the third. The seed is reset before every test, so each test starts from that state. The panel is the government account as an evaluator who is not the chair, and the administrator as chair.

The criterion has one given/when/then with two outcomes, and it also states a stage clause. That makes three tests, each titled with the criterion's own statement plus a short parenthetical:

1. **Evaluator who is not the chair.** They try to record a consensus for the third proponent. The chair then opens that evaluator's consensus for the proponent and must find no status. Before that, the chair reads their own consensus for the first proponent and must find one. This guards against a screen that shows no consensus to anybody, which would otherwise make the test pass without proving anything.
2. **Chair's second attempt.** The chair tries to record a second consensus for the first proponent, which they have already agreed. Because the chair may change their own consensus, the test does not compare its scores or status. It counts the attempt as refused if both of these hold:
   - the chair's consensus for that proponent still exists;
   - the consensus list names the proponents the same number of times before and after the attempt, meaning no extra consensus appeared.

   Two assumptions sit under this check:
   - The count relies on the anonymous "Proponent N" names the seed writes.
   - The contract does not say whether `proponentRow()` returns every row or only the first. If it returns only the first, this check is weak, though it will not fail wrongly.
3. **Before consensus.** On the closed Sprint With Us opportunity, after running the pending scheduled transitions so that it closes into individual evaluation, the chair tries to record a consensus. Afterwards none must exist for that proponent.

**Clauses written down instead of tested.** The not-testable entry, marked `blocked:` and owned by `contract`, names two clauses of R-5.29:
- an evaluator who is not the chair changing the chair's consensus;
- the chair changing a consensus after the opportunity has moved past consensus. By then every proponent already has a consensus, so a change is the only attempt left to make.

Neither can be checked because no observation returns the scores and notes stored in a consensus. The consensus edit screens only expose `consensus_status`, `editable_after_submitted`, and the panel members' own scores and notes, so a refused change looks the same as an accepted one.

**Additions the contract would need:**
- Agreed-score and agreed-note observations on `evaluation-consensus-edit-swu` and `evaluation-consensus-edit-twu`, for example `agreed_scores` and `agreed_notes`. A consensus-by-request page beside `evaluation-individual-request-swu`/`-twu`, with `stored_scores` and `stored_notes`, would do instead.
- A definition of what `proponent_row` on the consensus list returns, or a direct observation such as a consensus count per proponent. Test 2 currently has to count name mentions instead.

**Left alone.** `tests/acceptance/redo.yaml` still has the R-5.29 item open. I did not close it, because that is not this stage's to rule on.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Do these tests follow from R-5.29 and nothing else? They assert nothing the criterion does not say, the duplicate-notice demand is gone, the not-testable entry's reason is real (evaluation-consensus-edit-swu/-twu expose no agreed score or note, so a refused change is indistinguishable from an accepted one), and the typecheck reports no diagnostics under acceptance/evaluation/. Returned because the criterion's clause that the chair may record the consensus while the opportunity is in consensus is neither asserted nor named in not-testable.yaml, though the surface reaches it; and because every attempt swallows its own failure and the only guard read is of seeded state, all three refusal tests pass against an application whose consensus-create screen does nothing or cannot be driven, so none of them demonstrates a refusal. Test 1 also reads for the evaluator's attempt only under the evaluator's user id, so an accepted attempt stored as the proponent's consensus under the chair would go unseen. Adding a positive control where the chair records the outstanding proponent's consensus and reads it back, and checking the outstanding proponent under the chair's id before that, would change the ruling.

**Conditions:**
- tests/acceptance/evaluation/R-5.29.spec.ts: the clause 'only the chair may record ... while the opportunity is in consensus' has its permitted half unasserted — in the evaluator test, after the evaluator's attempt, have the chair record a consensus for the outstanding (third) proponent through evaluationConsensusCreateSwu without swallowing failure, and assert consensusStatusOf(chair, outstanding) is non-empty afterwards, so the refusals in this file are measured against a write that is shown to succeed
- tests/acceptance/evaluation/R-5.29.spec.ts: in the evaluator test, before the chair records, assert that the outstanding proponent has no consensus under the chair's user id as well as under the evaluator's (the seed leaves it not begun), so an evaluator attempt that was accepted and stored as the proponent's consensus cannot pass unseen
- tests/acceptance/evaluation/R-5.29.spec.ts: note — the duplicate test's Proponent-name count is weak if proponentRow returns one row; the missing definition of proponent_row is already carried by the not-testable entry's contract addition and needs no change here

### Runner-owned typecheck evidence

Proposal revision: `e736f84d649044391d71769ebf61ec9fe5592653`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
