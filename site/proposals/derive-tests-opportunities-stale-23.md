| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T15:43:01.495Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: do the R-1.1 tests follow from the criterion and nothing else, and is every clause now asserted? Approve. The one clause previously recorded as untestable — every submitted proposal moves to review, for the third proposal on the Sprint With Us and Team With Us opportunities — is now asserted: the test signs in as persona.thirdProponent and polls both proposals' status for 'review', the same observation already used for the other proposals. The branch confirms the seed assigns proposals.sprintWithUsThree and proposals.teamWithUsThree to users.proponentThree on the closed SWU and TWU opportunities, and tests/generated/personas.ts defines thirdProponent as able to read the status of their own proposal; the runner's typecheck passed with no diagnostics. The added assertions follow from the criterion's own words and leak no route, selector or status code. Removing the R-1.1 not-testable entry is correct since no clause is left unasserted, and the header comment now matches. The missing test for R-1.1 is not withdrawn: it closes when this test produces a result row at v3. R-5.27's owed test concerns another criterion and is unaffected. This would become a return if the test's first run reports the persona unbound or the status it reads is not the proposal's own.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `dadf8b7556732fca2aa31df5eea9140e7f1ebaa7`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
