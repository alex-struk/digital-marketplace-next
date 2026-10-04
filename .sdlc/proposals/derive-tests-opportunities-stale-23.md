---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "R-1.1 (v3) now has a test for every clause, and its entry is gone from `tests/acceptance/not-testable.yaml`."
opened: 2026-10-04T15:43:01.495Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** R-1.1 (v3) now has a test for every clause, and its entry is gone from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

R-1.1 (v3) now has a test for every clause, and its entry is gone from `tests/acceptance/not-testable.yaml`. I couldn't run the type-checker because the command needs an approval this session doesn't have, so nothing here has been compiled or run against a target.

**Why it was open.** The test in `tests/acceptance/opportunities/R-1.1.spec.ts` already covered most of the criterion:
- The opportunity moves to the first evaluation stage of its program.
- Closing leaves a note in each opportunity's history.
- The author of a Code With Us opportunity is told it is ready for evaluation.
- The evaluators on a Sprint With Us or Team With Us panel are told the same.

One part was missing: "every proposal submitted against it moves to review." On each of the Sprint With Us and Team With Us opportunities the test checked two of the three submitted proposals. The third proposal on each (`seed.proposals.sprintWithUsThree` and `seed.proposals.teamWithUsThree`) belongs to `users.proponentThree`, and no persona could sign in as that user. The only place a proposal's status can be read is the proponent's own proposal edit page, so those two proposals went unchecked.

**What changed.** The contract has added the `third-proponent` persona (`persona.thirdProponent`), which signs in as `users.proponentThree`. I checked that the seed gives both proposals to that user, on `seed.opportunities.closedSprintWithUs` and `seed.opportunities.closedTeamWithUs`. In the "every proposal submitted against it moves to review" test I added a step that:
1. signs out the previous proponent;
2. signs in as the third proponent;
3. reads the status of both proposals on the Sprint With Us and Team With Us proposal edit pages;
4. waits for each to say "review", the same way the other proposals are checked.

All three proposals on each of those opportunities, and the one on the lapsed Code With Us opportunity, are now checked. I also rewrote the file's header comment, which had said the third proposal could not be read.

**Counts.** One criterion was assigned, and it got a test. None remain untestable, and I found no surface action or observation still missing for this criterion. I changed nothing outside `tests/acceptance`.
