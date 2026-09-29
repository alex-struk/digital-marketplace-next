---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "Four of them (R-2.16, R-2.21, R-2.22, R-2.31) now have a test for every clause and nothing left in `tests/acceptance/not-testable.yaml`."
opened: 2026-09-29T02:53:56.150Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** Four of them (R-2.16, R-2.21, R-2.22, R-2.31) now have a test for every clause and nothing left in `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've written tests for all five criteria. Four of them (R-2.16, R-2.21, R-2.22, R-2.31) now have a test for every clause and nothing left in `tests/acceptance/not-testable.yaml`. R-2.28 still has part of it owed, so it keeps a narrower entry. None of this has been run or even type-checked: the workspace has no installed dependencies and no app, so I checked the edits by reading them.

**What changed, by criterion:**

- **R-2.22:** the edit now goes through the management screen's own controls: start editing, choose the other organization, name the team again from its members, save. On a submitted proposal, on both programs, the test reads `field_error` for the message "Organization cannot be changed once the proposal has been submitted". It reads `organization` to check the proposal still names the original organization. On a draft or withdrawn proposal it checks the change took. Before, it passed the whole organization and team to `save_changes` in a shape the contract never described. The entry is removed.
- **R-2.16:** the "naming no organization" test used to check only that no proposal appeared on the vendor's dashboard. It now sends a complete Sprint With Us submission through `proposal-team-request` with the organization left out. It checks the service refuses it with "An organization must be specified before submitting." The test where the organization stops qualifying before submission is unchanged. The entry is removed.
- **R-2.21:** an empty answer and an over-long answer must each be refused with "Response must be between 1 and 30 words long.". An answer to a question the opportunity doesn't ask must be refused with "No matching opportunity question.". Each message must appear in both `refusal_messages` and `refusal_by_field`. I also updated its header to the current spec commit. It had no entry to remove.
- **R-2.31:** two tests read the administrator's new `rank` observation while evaluation is still going on:
  - **Sprint With Us** (`swuTeamScenarioLastToScoreB`): the lower bid holds a rank and the higher bid holds none. Once the higher bid's team scenario score is entered, it holds one too.
  - **Team With Us** (`twuChallengeLastToScore`): the proposal scored on the challenge holds a rank and the other holds none. The test does not enter the missing score, because the seed notes that the old application refuses the move to processing that the last score triggers.

  The existing tests of the weighted total and the award ranking stay. The header is updated and the entry removed.
- **R-2.28:** a new test sends a team scenario score for `swuScreenedIntoScenarioEarly` through the new `proposal-evaluation-request` surface, signed in as the administrator. It checks the refusal with "The opportunity is not in the correct stage of evaluation to perform that action." The two page tests are unchanged. They check that the page says the proposal "can be scored once" the stage is reached, and that no score is taken.

**R-2.28's remaining entry** (blocked, owner `contract`) names two clauses:
- **The page does not offer the score, on either program.** Nothing on `proposal-swu-view` or `proposal-twu-view` reports which score actions the page offers, so the control's absence can't be read.
- **The Team With Us direct refusal.** No seeded Team With Us proposal has been screened into the challenge while its opportunity is still short of it. According to the contract, the service answers any other seeded proposal with its general permission message, not the stage message. I chose not to build that state by screening a proposal in at question consensus, because the contract doesn't say that is allowed.

**Needed from the contract, and not found:**
- An observation on `proposal-swu-view` and `proposal-twu-view` reporting which score actions the page offers.
- A seeded Team With Us proposal screened into the challenge on an opportunity still at question consensus (the counterpart of `seed.proposals.swuScreenedIntoScenarioEarly`), named as the starting point for `score_challenge_by_request`.

**One guess to check:** the contract describes `score_team_scenario_by_request`'s input only as "a score out of 100". I passed `{ score: 80 }`, matching how the existing tests call `score_team_scenario` on the proposal page. If the adapter expects a bare number, that call needs changing.

I didn't touch anything outside `tests/acceptance/` (the five spec files and `not-testable.yaml`), and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the tests for R-2.16, R-2.21, R-2.22, R-2.28 and R-2.31 follow from those criteria and from nothing else? Ruling: approve. Each test asserts what its criterion says, through the contract. R-2.16 sends a Sprint With Us submission with no organization through proposal-team-request and reads the quoted refusal. R-2.21 reads the empty, over-limit and unmatched-question refusals, each against its response, in refusal_by_field. The word-limit wording comes from the contract (spec/contract/surface.yaml), not from the implementation. R-2.22 drives the edit screen's own controls and reads the quoted message in field_error. It also checks that the submitted proposal keeps its organization, and that the same change on a draft or withdrawn proposal is accepted. R-2.28 adds the Sprint With Us direct-score refusal with the quoted stage message. R-2.31 reads the administrator's rank observation to show that a proposal lacking a stage score holds no rank beside one that holds every score. It also shows that the Sprint With Us proposal takes a rank once its last score is entered. Nothing about how the application is built leaks into the tests: no selector, route, table or status code. The runner's typecheck failed, but it reports no errors under acceptance/proposals/, only two under adapters/new/, which this proposal does not answer for. R-2.28's remaining not-testable entry is real. It names a missing observation of which score actions the page offers, and a missing Team With Us seed state; neither is a writer's omission. Those clauses stay owed by the contract stage, below. The owed tests for R-2.16, R-2.21, R-2.22, R-2.28 and R-2.31 close when their tests run; this ruling does not close them. What would change the ruling: a failing typecheck under acceptance/proposals/, or evidence that the Sprint With Us team scenario score input is not the one the contract describes.

**Conditions:**
- missing-test R-2.28: a proposal's page does not offer a score for a stage the opportunity has not yet reached (both programs); and, for Team With Us, the service refuses such a score sent to it directly with "The opportunity is not in the correct stage of evaluation to perform that action." — owed by contract: an observation on proposal-swu-view and proposal-twu-view reporting which score actions the page offers, and a seeded Team With Us proposal screened into the challenge on an opportunity still at question consensus, named as the starting point for score_challenge_by_request

### Runner-owned typecheck evidence

Proposal revision: `5ac7c568e23dcaf72f2f06b0a6552eb2c9f11787`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
