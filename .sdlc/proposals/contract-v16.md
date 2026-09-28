---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added the one thing the owed criterion R-5.29 was missing: a way to read and change a consensus."
opened: 2026-09-28T16:31:40.159Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added the one thing the owed criterion R-5.29 was missing: a way to read and change a consensus.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I added the one thing the owed criterion R-5.29 was missing: a way to read and change a consensus. A consensus is the chair's agreed score and note for each question on one proponent. The oracle then started cleanly with the migration and the new seed, and I took it down again afterwards.

**What was owed and why.** R-5.29 says only the chair may record and change a consensus, and only while the opportunity is at the consensus stage. The existing test covers recording. Two clauses had no test:
- an evaluator who is not the chair changing the chair's consensus;
- the chair changing a consensus after the opportunity has moved past consensus.

The test writer's reason was sound. The consensus screens show the status and the panel members' own scores, but never what the consensus itself holds. So a refused change could not be told apart from an accepted one. Neither change is offered by any screen to the person making it, so it has to be sent as a request.

**What I added.**
- **Two new pages** in `spec/contract/surface.yaml`:
  - `evaluation-consensus-request-swu` at `/api/proposal/sprint-with-us/:proposalId/team-questions/consensus/:userId`
  - `evaluation-consensus-request-twu` at `/api/proposal/team-with-us/:proposalId/resource-questions/consensus/:userId`
  - Each has one action, `change_consensus_by_request`, and five observations: `stored_scores`, `stored_notes`, `consensus_status`, `request_accepted` and `refused_when_not_permitted`.
  - These are the old application's own consensus routes (`consensus.ts` under each program's resources). `:userId` is the chair's account, which the seed names. The old code lets an administrator read a consensus at any stage, and on every seeded panel the chair is the administrator (`users.administratorOne`). So a test reads the result signed in as the administrator.
- **Four new seeded opportunities**, each with two proponents. The chair's consensus is submitted for both, with agreed scores 4,4,4,4 and 3,3,3,3:
  - Sprint With Us, still at consensus: `opportunities.swuConsensusAllAgreed`, proposals `swuAgreedOne` / `swuAgreedTwo` (in `010-sprint-with-us-stages.sql`).
  - Sprint With Us, moved on to the code challenge: `swuPastConsensus`, proposals `swuPastConsensusOne` / `swuPastConsensusTwo` (same file).
  - Team With Us, still at consensus: `twuConsensusAllAgreed`, proposals `twuAgreedOne` / `twuAgreedTwo` (in `011-team-with-us-stages.sql`).
  - Team With Us, moved on to the challenge: `twuPastConsensus`, proposals `twuPastConsensusOne` / `twuPastConsensusTwo` (same file).
  - They are kept separate from the records other criteria share, so a change, accepted or not, touches nothing another test reads. They set up the starting point only; whether a change is refused is left to the application.
- **An openapi correction.** `spec/contract/openapi.yaml` listed `edit` and `submit` as the accepted change types for the four individual-evaluation and consensus change requests. The old code accepts only `edit`, so each entry now lists `edit` alone.

**The oracle.** My first `oracle up` reused four copies that had been running for 11 hours, which proved nothing about the new seed. So I took it down and brought it up fresh:
- All 78 migrations ran, the seed loaded, and all four copies started.
- Signed in as the administrator through `/auth/createsessionadmin`, the application returned `swuPastConsensusOne`'s consensus with its seeded scores of 4. It also returned `twuPastConsensusTwo`'s with scores of 3.
- I then checked each clause through the new route:
  - The chair changing a consensus past consensus was refused: 401 with a permission error.
  - The chair changing one at consensus was accepted and read back.
  - The government evaluator, signed in through `/auth/createsessiongov`, changing the chair's consensus was refused: 401.

I changed nothing in `.sdlc/oracle/compose.yml`, and the oracle is down again. The `oracle up`/`down` commands may have added lines to the run log under `.sdlc/runs/`; that is the pipeline's own record, not a file I edited.

**Everything else is unchanged.** The pages, personas and sign-in methods, the other seed records, the observables and the compose override are as the earlier contract runs left them:
- The oracle signs people in through fixed session routes: `/auth/createsessionadmin`, `/auth/createsessiongov` and `/auth/createsessionvendor/N`.
- The new target signs people in through the sandbox identity provider, by username.
- I recovered nothing new beyond the above, and the gaps earlier runs recorded still stand. For example, a second staff account cannot be signed in on the oracle.

I could not run the YAML parser inline, because inline scripts need approval in this sandbox. The oracle loading the seed, and the application serving the new records, are the evidence that the SQL is valid. The manifest and surface edits follow the files' existing layout, but no parser has been run over them.

re-address missing-test/R-5.29 to derive-tests: added evaluation-consensus-request-swu and evaluation-consensus-request-twu (change_consensus_by_request; stored_scores, stored_notes, consensus_status, request_accepted, refused_when_not_permitted), plus the seeded opportunities swuConsensusAllAgreed, swuPastConsensus, twuConsensusAllAgreed and twuPastConsensus with their proposals, whose chair's consensus agreed scores are in the manifest

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether this contract gives the test writer what R-5.29 needs. R-5.29 says only the chair may record or change a consensus (the chair's agreed score and note for each question on one proponent), and only while the opportunity is at the consensus stage. The existing test covers recording. It does not cover an evaluator who is not the chair changing the chair's consensus, or the chair changing a consensus after the opportunity has moved on. The reason was that no screen shows what a consensus holds, so a refused change looked the same as an accepted one. I approve. The two new request pages, `evaluation-consensus-request-swu` and `evaluation-consensus-request-twu`, fill that gap. Each has the one change action and five observations: `stored_scores` and `stored_notes` (what the consensus holds), `consensus_status`, `request_accepted` and `refused_when_not_permitted`. With these a test can tell a refused change from an accepted one, which is what the owed condition asked for. The routes are the old application's own; both programs' `consensus.ts` files serve them. I checked the evidence against the files. First, the Sprint With Us `consensus.ts` update handler switches only on `case "edit"`, so removing `submit` from the four openapi change-type lists fixes the contract to match the code and assumes nothing. Second, in `011-team-with-us-stages.sql`, `seed_twu_proposal` writes the given scores as a SUBMITTED chair consensus through `put_evaluation`, and `put_evaluation` in both seed files writes notes reading "Seeded note on question N.". So the manifest's claims about agreed scores and notes match what the seed stores. Third, the oracle was brought up fresh (the running copies were not reused). It served the seeded scores, refused the past-consensus change and the non-chair change with 401, and accepted the chair's change at consensus. That is direct evidence the seed loads and that the setup lets the application make the decision. The new records are kept apart from shared fixtures, so a change made by one test touches nothing another test reads. One minor point, not a blocker: the two Team With Us manifest entries give their panel and owner only in prose ("the same panel") and not as structured fields like the Sprint With Us entries. A test writer can still resolve it, but a later contract run should fill them in. No criterion's wording or confidence changes here, so there are no condition lines. `missing-test/R-5.29` correctly stays open until derive-tests writes and runs the test. I would return this if a test written against these pages showed that the old application answers a refused consensus change with something other than a permission or not-found error, because then `refused_when_not_permitted` would be reading the wrong signal.

**Conditions:**
none
