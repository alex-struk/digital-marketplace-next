| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-29T03:10:00.755Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** **What this run added.** Everything else in the contract was already in place and is unchanged: the pages, personas, `openapi.yaml`, `observables.yaml` and the oracle override.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've supplied both things the owed Team With Us test needed (item R-2.28) and checked them against the running oracle.

**What this run added.** Everything else in the contract was already in place and is unchanged: the pages, personas, `openapi.yaml`, `observables.yaml` and the oracle override. The owed item named two missing pieces, and I added one thing for each.

- **A way to see which score buttons a proposal page shows.** `proposal-swu-view` and `proposal-twu-view` in `spec/contract/surface.yaml` now have an `offered_score_actions` observation. It lists which of the page's own score actions the signed-in person is offered, across the stage tabs, or nothing when there are none. The rule comes from the old screen code (the per-tab action lists in `sources/old/src/front-end/.../proposal/*/view/tab/`):
  - A stage's score button appears on its tab only when the opportunity has reached that stage and the proposal is in it.
  - Until then the tab says the proposal "can be scored once" the opportunity reaches the stage.
  - A proposal that has moved past a stage no longer gets that stage's button.

  The comments name seeded examples on both programs: for Sprint With Us, a proposal with no score buttons next to one offered `score_code_challenge`; for Team With Us, an empty list next to `score_challenge`. This part is read from the old code only, not seen live. The old pages are built in the browser, so a plain request can't show which buttons appear.

- **A seeded Team With Us starting point.** `tests/seed/011-team-with-us-stages.sql` gains opportunity 38, handle `opportunities.twuConsensusWithChallengeScreenedIn`. It is still at the questions consensus and holds two proposals:
  - `proposals.twuScreenedIntoChallengeEarly` has already been moved into the challenge.
  - `proposals.twuStillAtQuestions` is still at the questions, as a comparison case.

  Both are in `tests/seed/manifest.yaml`, and `proposal-evaluation-request` now names them as the starting point for `score_challenge_by_request`.

**One judgement the gate should look at.** The old application's own screens no longer produce this Team With Us state:
- Finalising the consensus moves proposals into the challenge and advances the opportunity in the same database transaction.
- The service's separate screen-in action starts from the `EVALUATED_QUESTIONS` status. The Team With Us evaluation migration (20250506164908) removed that status from the database's allowed list.

I seeded it anyway, because the database schema allows it and it is the exact case the service's stage check exists to refuse. It sets up the starting condition, not the result: the refusal still comes from the application. The seed comment and the manifest note both say this. The Sprint With Us counterpart needs no such caveat, because there the application reaches that state on its own.

**Oracle.** It started with the existing override unchanged:
- The migration ran (78 migrations) and four copies started.
- The new records were readable through the application: the proposal is `UNDER_REVIEW_CHALLENGE` and its opportunity is `EVAL_QUESTIONS_CONSENSUS`.

Signed in as the administrator through `/auth/createsessionadmin`, I sent a challenge score of 80 directly to the service:
- For `twuScreenedIntoChallengeEarly` it answered 401 with "The opportunity is not in the correct stage of evaluation to perform that action."
- For `twuStillAtQuestions` it answered 401 with "You do not have permission to perform this action."

The oracle is down again.

**Sign-in, unchanged.** Personas sign in through the old application's session routes on the oracle (`/auth/createsessionadmin`, `/auth/createsessiongov`, `/auth/createsessionvendor/:n`) and as sandbox identity-provider usernames on the new target.

**What I could not do.** The shell refused commands containing a variable, so I ran the pipeline CLI by its path (`~/GitHub/agentic-sdlc/bin/sdlc.mjs`) instead of through `$SDLC_BIN`. I could not run a YAML parser or `git status`, so I checked the edited YAML by reading it back. The seed SQL was proven by the oracle loading it.

**For the test writer.** The request surface's score input stays loosely described. The live call that worked sent `{"tag":"scoreChallenge","value":80}`.

re-address missing-test/R-2.28 to derive-tests: offered_score_actions observation on proposal-swu-view and proposal-twu-view, and seed.proposals.twuScreenedIntoChallengeEarly (control seed.proposals.twuStillAtQuestions) on seed.opportunities.twuConsensusWithChallengeScreenedIn as the starting point for score_challenge_by_request on proposal-evaluation-request

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this contract gives the tests what they need to check R-2.28, the rule that a score for an evaluation stage the opportunity has not reached is neither offered on the proposal page nor accepted by the service. It does, so I approve. The run added the two pieces the owed-test condition named. First, both proposal pages (Sprint With Us and Team With Us) get an offered_score_actions observation, which lists the score buttons the page shows the signed-in person. It is described in the criterion's own terms: a stage's score is offered only once the opportunity has reached that stage and the proposal is in it; before that the tab says the proposal 'can be scored once' the opportunity gets there; and a proposal that has moved past a stage is no longer offered that stage's score. Each program has a seeded example on each side, and every one exists: swuScreenedIntoScenarioEarly and swuScreenedIntoCodeChallenge for Sprint With Us, and twuScreenedIntoChallengeEarly and twuChallengeLast (in tests/seed/manifest.yaml) for Team With Us. The action names it lists (score_code_challenge, score_team_scenario, score_challenge) are the pages' existing action names. Second, a seeded Team With Us opportunity (number 38) is still at the questions consensus. One of its proposals has already been moved into the challenge; the other is still at the questions and serves as a comparison case. The proposal says openly that the old application's screens can no longer produce this state. That is a stated judgement, not an assumption passed off as fact. The seed only sets up the starting condition, and the refusal still has to come from the application. It was checked live on the running old application (the oracle): the early proposal drew the stage message quoted in R-2.28, and the comparison proposal drew the general permission message. That also confirms that the service checks the proposal before the opportunity, as the seed comment says. One part is not yet proven: the rule for which buttons appear was read from the old screen code and not seen live, because those pages are built in the browser. That is an honest grade for this stage, and calibration will test it against the running application. The ruling would change if calibration shows the old pages offering a score before the opportunity reaches its stage. That would be a product question for this gate (defect-in-old or spec-wrong), not a return of this contract. It would also change if R-2.28 were reworded so that it no longer covers the service refusing a score sent to it directly, which would make the new seed unnecessary. Tier is STANDARD and the intent has only one plausible reading, so this does not need escalating.

**Conditions:**
none
