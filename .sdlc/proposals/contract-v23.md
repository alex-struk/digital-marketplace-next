---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "**What this run added.** Everything else in the contract was already in place and is unchanged: the pages, personas, `openapi.yaml`, `observables.yaml` and the oracle override."
opened: 2026-09-29T03:10:00.755Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
