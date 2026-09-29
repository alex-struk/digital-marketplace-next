| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T03:19:25.504Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I wrote the test for R-2.28 (v2), the one criterion I was given.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote the test for R-2.28 (v2), the one criterion I was given. Its entry is removed from `tests/acceptance/not-testable.yaml`, so the criterion now has a test file and no entry. Nothing was left untestable. I did not run the tests or type-check the file: the command that would have checked it also rewrote the yaml, and it needed an approval that nobody was here to give, so I edited the yaml by hand instead.

The entry had been blocked on two gaps the contract has now filled. The first was an observation on each program's proposal page listing which score actions it offers, now `offeredScoreActions()` on both `proposalSwuView` and `proposalTwuView`. The second was a seeded Team With Us proposal already in the challenge while its opportunity is still at question consensus. That is now `seed.proposals.twuScreenedIntoChallengeEarly` on `seed.opportunities.twuConsensusWithChallengeScreenedIn`.

`tests/acceptance/proposals/R-2.28.spec.ts` now has four tests. Each is titled with the criterion's statement, and all run as the administrator, who may score any stage once it is reached, so a refusal cannot be about who is asking.

- **Sprint With Us page:** opens `swuScreenedIntoScenarioEarly`, which is already in the team scenario while its opportunity is still at the code challenge. It checks that `offeredScoreActions()` does not contain `score_team_scenario`, and that the team scenario tab or the wrong-stage error says the proposal "can be scored once" the opportunity gets there. It first reads `swuScreenedIntoCodeChallenge` and expects `score_code_challenge`, so an empty list is known to mean "not offered" rather than "not reported".
- **Team With Us page:** the same checks on `twuScreenedIntoChallengeEarly` for `score_challenge` and the challenge tab. The control is `twuChallengeLast`, on an opportunity that has reached the challenge, and it must show `score_challenge`.
- **Sprint With Us, sent directly:** a team scenario score for `swuScreenedIntoScenarioEarly` through `proposalEvaluationRequest.scoreTeamScenarioByRequest`. The service must not accept it, and the refusal must contain "The opportunity is not in the correct stage of evaluation to perform that action."
- **Team With Us, sent directly:** the same for a challenge score on `twuScreenedIntoChallengeEarly` through `scoreChallengeByRequest`.

This replaces the previous version, which tried to score through the page and then checked that no score appeared. Now that the page reports which score actions it offers, I read that list and no longer attempt a score through the page. That also fits the closed v1 redo note in `redo.yaml`: the test should not fail just because a control is missing from the screen. I did not use the seeded control `twuStillAtQuestions`. The contract says it is refused with the general permission message, and the criterion asserts nothing about that.

No surface actions or observations were missing for this criterion, and nothing asked me to change any read-only path.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-2.28 tests follow from R-2.28 v2 and nothing else? Approve. The criterion claims that a proposal's page does not offer a score for a stage its opportunity has not reached (both programs), that the page says instead the proposal can be scored once the opportunity reaches that stage, and that the service refuses such a score sent directly with 'The opportunity is not in the correct stage of evaluation to perform that action.' The Sprint With Us and Team With Us page tests read offeredScoreActions() and assert that score_team_scenario or score_challenge is absent for swuScreenedIntoScenarioEarly and twuScreenedIntoChallengeEarly, then assert the 'can be scored once' wording. The two direct-request tests assert non-acceptance and the exact stage message for both programs, so every clause is asserted and the removed not-testable entry, whose two gaps the contract has since filled, is justified. The control reads, which expect a stage's score to be offered once its opportunity has reached it, follow from 'can be scored once the opportunity reaches that stage' and only make sure an empty list means 'not offered'. Nothing about how the application is built leaks in: the action and seed names are contract vocabulary. Leaving out twuStillAtQuestions is correct because the criterion asserts nothing about the general permission message. The runner's typecheck reports no diagnostics under acceptance/proposals; its failure comes from adapters/new, which this proposal does not answer for. missing-test/R-2.28 is neither met nor withdrawn by this ruling: a test is now derived for every clause it names, and it closes when that test runs at v2. What would change the ruling: a typecheck diagnostic in R-2.28.spec.ts, or evidence that the control expectations assert something the criterion does not imply.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cf4098bbc78afa5a93b6d85b6a017eb00a6401cf`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
