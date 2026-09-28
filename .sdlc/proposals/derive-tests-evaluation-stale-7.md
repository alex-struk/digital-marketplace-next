---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "I wrote a test for R-5.21's missing clause and removed its entry from `tests/acceptance/not-testable.yaml`, so the one criterion owed to this run now has a test."
opened: 2026-09-28T05:55:28.467Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

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
