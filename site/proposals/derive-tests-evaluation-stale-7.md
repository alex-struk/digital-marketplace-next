| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T05:55:28.467Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I wrote a test for R-5.21's missing clause and removed its entry from `tests/acceptance/not-testable.yaml`, so the one criterion owed to this run now has a test.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I wrote a test for R-5.21's missing clause and removed its entry from `tests/acceptance/not-testable.yaml`, so the one criterion owed to this run now has a test. I could not type-check or run it: the workspace would not approve `tsc`, and there is no app to run against.

**The criterion.** R-5.21 (v1) says only an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation. The existing file `tests/acceptance/evaluation/R-5.21.spec.ts` already had three tests. Two check that a chair who is not an evaluator, and an owner who is not on the panel, are refused. The third checks that an evaluator on the panel can score. The "only while in individual question evaluation" clause was recorded as blocked, because no seeded opportunity outside that stage had an evaluator on its panel with nothing evaluated.

**What changed.** The contract stage has since added `seed.opportunities.swuOpenWithSubmittedProposal` and `seed.proposals.swuOpenSubmitted`. The opportunity is published with its deadline thirty days ahead, and `users.staffOne` (signed in as `persona.publicSectorStaff`) is an evaluator on its panel with nothing evaluated. I added a fourth test using these records:
- **Given:** it signs in as that persona, opens `surface.opportunitySwuView`, and asserts that `status()` is not empty and does not read as individual question evaluation.
- **When:** it attempts to score the first question through `surface.evaluationIndividualCreateSwu` (enter a score and notes, then save a draft).
- **Then:** the attempt counts as refused if the form fails on any step. If the form goes through, `surface.evaluationIndividualRequestSwu`, opened for `users.staffOne`, must show no evaluation status and no stored score.
- Finally it checks the opportunity still does not read as in individual question evaluation, so the refusal cannot be put down to the attempt having moved the stage.

It reuses the file's existing helpers and is titled with the criterion's own words plus a short note of which case it covers, like the other three. The file imports only from `../../fixtures`; it has no selectors, routes or raw ids.

**Nothing left out.** R-5.21 no longer has any entry in `not-testable.yaml`, and I found no surface action or observation missing for this criterion.

**One weak point.** The check that the opportunity is not in individual question evaluation matches the wording of the status text, as the existing helper does. The surface has no way to read the stage directly. If the app words the published status in an unexpected way, that check could give a false result, and a stage observation in the contract would make it firmer.

I changed nothing outside `tests/acceptance/`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does the new R-5.21 test follow from the criterion and nothing else? Approve. The added test asserts the clause that no test covered, 'only while the opportunity is in individual question evaluation'. It uses seed.opportunities.swuOpenWithSubmittedProposal and seed.proposals.swuOpenSubmitted, both present in tests/seed/manifest.yaml: the opportunity is published with its deadline ahead, and users.staffOne is an evaluator on its panel who has evaluated nothing, so a refusal can only be put down to the stage. The test establishes that the opportunity is not in individual question evaluation, reuses the file's existing refusal check (the form is withheld, or no evaluation by that user exists afterwards), and confirms the attempt did not move the stage. Each assertion follows from the criterion, and nothing about how the application is built appears: the file imports only from ../../fixtures. The runner's typecheck reports no diagnostics under acceptance/evaluation/; its failures are in adapters/new/, which this proposal does not touch. Removing the R-5.21 not-testable entry is correct because the clause is now asserted. The missing-test/R-5.21 record closes when this test runs. Remaining weakness: the stage is read from status wording, since the surface exposes no stage observation. That is an improvement for the contract stage, not a defect in this test. The ruling would change if this test's first run showed the seeded opportunity or the scoring form could not be reached.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `bb5d492b332781c06b294f9909179010b3ea8668`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
