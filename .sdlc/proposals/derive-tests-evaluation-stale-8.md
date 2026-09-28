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
