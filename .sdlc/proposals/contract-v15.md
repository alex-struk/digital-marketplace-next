---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added one seeded record that the untestable clause of R-5.21 was waiting for, and checked it against the running oracle."
opened: 2026-09-28T05:50:55.859Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added one seeded record that the untestable clause of R-5.21 was waiting for, and checked it against the running oracle.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I added one seeded record that the untestable clause of R-5.21 was waiting for, and checked it against the running oracle. The oracle is down again. Only two files changed: `tests/seed/010-sprint-with-us-stages.sql` and `tests/seed/manifest.yaml`.

**What was owed.** R-5.21 says only an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation. Its test already covers the "only an evaluator" part. The "only at that stage" clause had no starting point in the seed:
- Every Sprint With Us opportunity past that stage already has every evaluation submitted, so a refusal there would only be refusing a duplicate.
- Every one before that stage with a submitted proposal has a deadline that has passed. Opening the scoring form makes the application close it into individual evaluation, which is the very stage the test needs to be outside.

**What I added.** Opportunity 25, handle `opportunities.swuOpenWithSubmittedProposal`, titled "Seeded open Sprint With Us opportunity with a submitted proposal":
- It is published, with its proposal deadline thirty days after the seed is applied, so scheduled closing never moves it. The seed is reapplied before every test, so the deadline stays in the future.
- It has one submitted proposal, handle `proposals.swuOpenSubmitted`, from `users.proponentTwo`'s organization.
- The panel is `users.staffOne` as an evaluator and `users.administratorOne` as chair and evaluator. `staffOne` is the government account, reachable through the `session-route` sign-in `/auth/createsessiongov` on the oracle and as `test-gov` through the sandbox sign-in on the rebuilt target.
- No evaluation is seeded.

This sets up the conditions and not the result. A published opportunity with a proposal in before its deadline is an ordinary state the application reaches on its own; the refusal is left to the application.

I took the second of the two shapes the derive-tests stage offered. The first, an opportunity at consensus or later with an evaluation still missing, is a state the old service may never produce by itself. Seeding it would risk testing my fixture rather than the system.

**Proof on the oracle.** I took the oracle down first, because a leftover running oracle makes `up` do nothing, then brought it up.
- **Startup:** the migration ran all 78 steps, the seed loaded without error, and four copies of the application started.
- **Seeded record:** signed in through `/auth/createsessiongov`, the application's own API returned the new opportunity as `PUBLISHED`, with deadline 2026-10-28, the panel as seeded, and `numProposals: 1`.
- **Refusal:** an individual evaluation posted by that same evaluator for the new proposal came back 401, "You do not have permission to perform this action."
- **Why it is the stage:** in the old code, `permissions.createSWUTeamQuestionResponseEvaluation` requires the opportunity's status to be `EvaluationTeamQuestionsIndividual`. The government account passes every other condition there, so the refusal comes from the stage alone.

**Things I left alone, and why:**
- **Other contract files:** I changed none of the pages, personas, API description, observables or Compose override; this item needed none of them.
- **Surface:** the scoring page, `evaluation-individual-create-swu`, already takes both route parameters from manifest handles.
- **Refusal observation:** it still has no design-gate binding (`refused_when_not_permitted` is `test_id: null`). The test writer's workaround still applies: a refusal is either a step on the form failing, or no stored evaluation afterwards for that person.
- **Other tests:** one more published Sprint With Us opportunity now exists. A test that counts published opportunities, or proponentTwo's proposals, without filtering by title will see one more.

**Tool limits.** The shell refused variable expansion, so I ran the CLI by its resolved path `~/GitHub/agentic-sdlc/bin/sdlc.mjs` rather than through `$SDLC_BIN`. A standalone YAML parse of the manifest needed an approval nobody was here to give; the new entries follow the file's existing shapes and were checked by eye.

re-address missing-test/R-5.21 to derive-tests: seed.opportunities.swuOpenWithSubmittedProposal (published, deadline thirty days ahead, users.staffOne an evaluator on its panel with nothing evaluated) and seed.proposals.swuOpenSubmitted, so an evaluator's attempt on evaluation-individual-create-swu can be made outside individual question evaluation; the oracle refuses it (401) on the stage check alone
