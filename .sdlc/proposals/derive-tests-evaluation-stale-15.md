---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "I added a test for the one remaining gap in R-5.27 (v2) and left the existing test alone."
opened: 2026-10-04T15:47:19.640Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I added a test for the one remaining gap in R-5.27 (v2) and left the existing test alone.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added a test for the one remaining gap in R-5.27 (v2) and left the existing test alone. The new test has not been run or type-checked: there's no app in this workspace, and the type-check command needed an approval that nobody was here to give.

**What was owed.** The criterion's clause "counted against the panel and the questions of the opportunity's most recent version" had been recorded as untestable. The contract has since added a `start_editing` action to `evaluation-panel-swu` and `evaluation-panel-twu`. It also documents that the panel can be changed during individual evaluation and that saving it publishes a new version. Questions cannot change at that stage, so changing the panel is the only version change a test can make. `tests/acceptance/not-testable.yaml` already had no entry for R-5.27, so there was nothing to remove.

**What I wrote.** `tests/acceptance/evaluation/R-5.27.spec.ts` now holds two tests:

- **The existing test**, kept as it was. It covers the main given/when/then on the seeded closed Sprint With Us opportunity: two evaluators submit the twenty-four scores, the opportunity moves to consensus, and the chair and the owner are told. That check finds the notice through the service's own address and accepts either a visible recipient or a blind copy. That is the fix an earlier redo entry asked for, and it is already marked met.
- **A new test** for the most-recent-version clause, on the seeded closed Team With Us opportunity, so the two tests don't share a record.
  1. It triggers the pending scheduled transitions so the opportunity is closed into individual evaluation.
  2. The owner signs in as `persona.publicSectorStaff`, opens `evaluationPanelTwu`, calls `startEditing`, seats `seed.users.staffPanelEvaluator` as a third evaluator, and saves. Neither the minimum-members error nor the missing-chair error may appear.
  3. Each of the two seeded evaluators scores all three proponents on all four questions and submits — the same twenty-four submissions that move the opportunity on in the first test.
  4. After a short wait, it asserts the opportunity's status does not mention consensus.

  To stop this negative check passing just because a submission quietly failed, each submission must leave the evaluation status on `evaluationIndividualListTwu` changed and show no incomplete-evaluation error. Two test titles in one file can't be the same, so the new one is titled with the criterion's version clause and the note's wording ("changing the panel during individual evaluation changes how many submissions are awaited") instead of the full statement.

**What the surface still doesn't give a test.**
- No persona signs in as `users.staffPanelEvaluator`; on both targets that persona signs in as `users.staffOne`. So no test can have the third evaluator submit and show that the move happens once the newer, larger count is reached. The test shows only that the old count no longer triggers the move. It would take a sign-in route for that account.
- The status is read with a substring check for "consensus", because the contract doesn't name the status's display text.
- Nothing lets a test reset the seed between tests, and both closed opportunities are also changed by other evaluation tests. Whether these tests can share the seed depends on how the runner orders them.

I didn't add a `not-testable.yaml` entry for these points. The clause is asserted from the side the contract offers, and none of them is a clause that goes unasserted. If the ruling says the clause also needs the move to be shown happening under the newer count, the missing piece belongs to `contract`: a persona that signs in as `users.staffPanelEvaluator`.

I changed nothing outside `tests/acceptance`.
