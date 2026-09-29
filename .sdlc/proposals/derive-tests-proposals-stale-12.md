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
