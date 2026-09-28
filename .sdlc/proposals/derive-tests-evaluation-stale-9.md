---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "I added two new clauses to R-5.29's test in `tests/acceptance/evaluation/R-5.29.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`."
opened: 2026-09-28T16:43:31.556Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I added two new clauses to R-5.29's test in `tests/acceptance/evaluation/R-5.29.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: do the added R-5.29 tests follow from the criterion and nothing else? Approve. The criterion says only the chair may record and change the consensus, one per proponent, and only while the opportunity is in consensus. The three existing tests cover recording by a non-chair, the chair's duplicate, and recording before consensus. The four new tests, two per program, cover the two clauses the not-testable entry held open. A non-chair evaluator's change to the chair's consensus is not reported accepted and leaves the stored scores and notes unchanged. The chair's change once the opportunity is past consensus is refused the same way. Each is measured against the chair's accepted change on the in-consensus opportunity, which the criterion's 'only the chair may change' implies. Every step uses contract actions and observations (change_consensus_by_request, stored_scores, stored_notes, request_accepted) and the seeded starting points in the seed manifest (swuConsensusAllAgreed/twuConsensusAllAgreed, swuPastConsensus/twuPastConsensus). Nothing implementation-shaped leaks in, and the check on the seeded note text is a precondition guard, not an extra claim. Every clause of the criterion is now asserted, so removing the not-testable entry is right. The runner's typecheck reports no diagnostics under acceptance/evaluation; its failures are in adapters/new, which this proposal does not answer for. The seeded chair also being an administrator does not weaken the past-consensus test, because the criterion refuses that change whoever makes it. This would change to a return if typecheck diagnostics appeared under acceptance/evaluation, or if the seed no longer made staffOne a non-chair evaluator or were not reset between tests.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `826473c6e54dc5b76c7ca1f8e47ca52742b8a3c8`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
