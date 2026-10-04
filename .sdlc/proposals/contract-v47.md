---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I also ran it against the old application: when a submission names fewer than every proponent, the move to consensus is counted over the named proponents only."
opened: 2026-10-04T16:10:42.789Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I also ran it against the old application: when a submission names fewer than every proponent, the move to consensus is counted over the named proponents only.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've supplied what the owed criterion R-5.27 was missing. I also ran it against the old application: when a submission names fewer than every proponent, the move to consensus is counted over the named proponents only. The oracle started on the first attempt with the override unchanged, and I took it down again before finishing.

**What R-5.27 was missing, and what I found.** The test writer could not reach the clause "but only over the proponents named in the submission that triggers the check". The only submission the contract offered named every proponent at once, so a count over the named proponents and a count over all of them always gave the same answer. In the old code, the request to submit scores for consensus carries a free list of proposal ids (`proposals` in the body), and the service checks and submits the evaluator's evaluation of each one named and no other. Nothing requires every proposal to be named. The count that decides the move (`allSWUTeamQuestionResponseEvaluatorEvaluationsSubmitted`) is then taken over that list. The screen never sends a partial list: it names every proposal the evaluator holds an evaluation of, and only offers the button once they hold one for every proponent. So the clause is real, but only a direct request can reach it. It does not need to go back to ratify.

**What I added:**
- **Seed:** a new Sprint With Us opportunity, number 42, in `tests/seed/010-sprint-with-us-stages.sql`. Its manifest handle is `opportunities.swuSubmissionNamesTwoOfThree`, with proposals `proposals.swuNamedOne`, `proposals.swuNamedTwo` and `proposals.swuLeftOut`.
  - It is in individual evaluation, with the usual panel: the government account as evaluator, the administrator as chair and evaluator. It has four questions.
  - The administrator has already submitted scores for the first two proponents. The government account holds complete drafts of the same two. Nobody has started on the third.
  - This seeds only the starting conditions; the move itself is left to the application.
- **Surface page:** `evaluation-individual-submission-request-swu` in `spec/contract/surface.yaml`.
  - Route: `/api/opportunities/sprint-with-us/:opportunityId`.
  - Action: `submit_scores_for_consensus_naming`, which takes the proponents to name.
  - Observations: `request_accepted`, `refusal_messages` and `stored_status`.
  - Its test ids are left null for the design gate to fill.
- **API description:** a description on the Sprint With Us opportunity update request in `spec/contract/openapi.yaml`, giving the body shape `{ note, proposals }` and saying that a subset is accepted.

**Proving it on the oracle.** I signed in through `/auth/createsessiongov` and the new opportunity read back through the API with its title, panel, four questions and three proposals, so the migration and seed had both worked. I then sent the two-of-three submission as the government account. The service answered 200 and the opportunity moved to `EVAL_QUESTIONS_CONSENSUS`, even though the third proponent had no scores. The mail catcher received "[TEST] A Sprint With Us Opportunity Is Ready for Question Consensus", addressed to the chair and the owner.

**Running the pipeline tool.** This session refused to expand the variable holding the tool's path, so I couldn't run `node $SDLC_BIN oracle up` as given. I ran the same tool by its literal path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`, and assumed it is the copy the variable names. I ran `oracle down` first to clear anything left over, then `oracle up`: 78 migrations ran, the seed loaded, and four copies started on port 3100, with the mail API on 8025. `oracle down` has since been run, so nothing is left running. I couldn't run the YAML parse check either, because the session refused `python3`. The edited YAML follows the forms already used in those files, and the oracle loaded the edited seed SQL without error.

**The rest of the contract.** Apart from the additions above, nothing changed and nothing was removed:
- The pages and personas are as the last approved contract run left them.
- The sign-in methods are unchanged. Every persona has a session route on the oracle (for example `/auth/createsessiongov` for the evaluator and `/auth/createsessionadmin` for the chair) and a sandbox username on the rebuilt target. The anonymous visitor has `sign_in: null`.
- The third-evaluator persona still has no oracle sign-in, for the reason recorded in `personas.yaml`.
- The override in `.sdlc/oracle/compose.yml` is untouched.

**What I did not cover.** The criterion also cites Team With Us, but the owed item asked for one case and I seeded Sprint With Us only. A Team With Us version would be the same pattern, using its resource-questions request and fixture helpers.

re-address missing-test/R-5.27 to derive-tests: seeded opportunities.swuSubmissionNamesTwoOfThree (proposals swuNamedOne, swuNamedTwo, swuLeftOut) and added surface page evaluation-individual-submission-request-swu with action submit_scores_for_consensus_naming and observations request_accepted, refusal_messages, stored_status; on the oracle, submitting as users.staffOne naming only the first two moves the opportunity to EVAL_QUESTIONS_CONSENSUS and sends the consensus-ready notice to the chair and owner
