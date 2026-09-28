---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T16:43:31.513Z"
cost: 0.9358388000000001
turns: 29
session: "dbaab5af-213c-4f9e-9db8-0fb01065a9ea"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I added two new clauses to R-5.29's test in `tests/acceptance/evaluation/R-5.29.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`. The criterion now has a test file and no entry. No TypeScript compiler is installed here and there is no app to run against, so the new tests have not been type-checked or run.

**What was missing.** The entry had kept two clauses open: an evaluator who is not the chair changing the chair's consensus, and the chair changing a consensus after the opportunity has moved past consensus. The contract has now added:
- consensus-by-request pages for both programs, `evaluationConsensusRequestSwu` and `evaluationConsensusRequestTwu`. They let a test send a change (`changeConsensusByRequest`) and read what the consensus holds (`storedScores`, `storedNotes`, `requestAccepted`).
- seeded opportunities in two starting states, for both Sprint With Us and Team With Us: still in consensus with the chair's consensus submitted (`swuConsensusAllAgreed`, `twuConsensusAllAgreed`), and moved past consensus with it still standing (`swuPastConsensus`, `twuPastConsensus`).

**The four new tests.** Two per program, each titled with the criterion's statement plus which clause it covers:
- **An evaluator who is not the chair changes the chair's consensus.** The administrator first reads the stored scores and notes and checks the seeded note is there. The evaluator then sends a change, and it must not be reported as accepted. Signed back in as administrator, the test checks the scores and notes are exactly as before.
- **The chair changes a consensus past consensus.** Same approach: read what is stored, send the change, expect it not to be accepted, and read back the same scores and notes.

Both tests end with a control step: the chair changes a consensus on the opportunity that is still in consensus, the change is accepted, and the new note is read back. So a refusal only counts as a refusal if the same write can be seen to succeed.

**Choices worth knowing about:**
- **Change format.** The page says the change is "an agreed score and note for each of the four questions, by question order". I used the same `{ questions: [{ order, score, notes }] }` shape the individual-evaluation request page already uses in R-5.23.
- **Comparing whole strings.** The format of `storedScores` isn't specified, so the tests compare the scores and notes as whole strings before and after, instead of picking out numbers.
- **The chair is also an administrator.** On the seeded panels the chair is `users.administratorOne`, so "the chair" in these tests is also an administrator. If administrators get extra permissions, this seed can't separate a refusal made because of the chair's role from one made because of the administrator's role. That only matters for the past-consensus clause.

**Unchanged.** The three tests already in the file (a non-chair recording a consensus, the chair recording a duplicate, and the chair recording before consensus) are as they were. I updated the header comment to describe the new coverage.

Nothing else was missing from the surface for this criterion, so I have no further additions to ask the contract stage for. I did not touch any file outside `tests/acceptance`.

## Fix turn

I fixed the failed check in `tests/acceptance/evaluation/R-5.29.spec.ts`. Lines 203–224 were flagged for touching the page object because three helper functions (`storedConsensus`, `attemptChange` and `chairChangesInConsensus`) named their parameter `page`. That parameter was always the surface's consensus-by-request page for the Sprint With Us (SWU) or Team With Us (TWU) program, never Playwright's page object, but calls like `page.open(...)` and `page.storedNotes()` looked like it to the check. I renamed the parameter to `consensusPage` in those three helpers and changed nothing else. A search now finds no `page.` anywhere in the file. The test bodies still name a local variable `page` and pass it to these helpers without calling anything on it, so none of those lines contains `page.` and none was flagged. I left them as they were. I did not rerun the separation check myself, so it still has to confirm the fix. The criterion's coverage, and the removal of its entry from `not-testable.yaml`, are the same as in the earlier journal.