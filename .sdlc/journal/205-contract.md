---
stage: "contract"
title: "contract"
at: "2026-09-28T22:30:07.235Z"
cost: 3.0349702000000005
turns: 74
session: "568f1354-116b-4b1d-a3b9-ddbf2ba06fd9"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

Both owed items are now covered. I checked each one against the running oracle: the refusal and the history entry both show up through the application, not just in the files.

This contract was already on its nineteenth revision. The pages, personas, sign-ins, mail observables and the oracle override were complete and had passed earlier gates, so this run only added what the two owed criteria were missing. Nothing was deleted or renamed, and `personas.yaml`, `observables.yaml` and `.sdlc/oracle/compose.yml` are unchanged.

**What was added**

- **Refusing a second evaluation (R-5.3).**
  - The pages `evaluation-individual-request-swu` and `-twu` now have an action, `create_evaluation_by_request`, and two observations: `evaluation_created` and `creation_refusal_message`.
  - The create request goes to the proponent's evaluations collection and takes the evaluator from the session, so the action ignores `:userId`. The content request page already works this way.
  - `openapi.yaml` now gives each create operation's request body, a 400 for invalid input, and a 409 for the duplicate. The 409 answer is `{"conflict": ["You already have a team question evaluation for this proposal."]}`, with "resource question" for Team With Us. From reading the old handler I expected a 400; the running service answers 409, so the file says 409.
- **Finalising records every proponent's agreed scores (R-5.32).**
  - The pages `proposal-swu-view` and `proposal-twu-view` now have a `history_entries` observation. Each entry has its kind (a status or an event), its note, who made it and when.
  - When the consensus is finalised, the service writes a note such as "Team question scores were entered. Q1: 5; Q2: 5; Q3: 4; Q4: 4." for every proponent, including one below a minimum score that is not moved forward.
  - That note and the screened-in status carry the same timestamp, so a test should find the entry by its kind, not by its position in the list. The page entry says this.
  - Only an administrator or the opportunity's owner can read a proposal's history.

**What the seed gained**

- **Opportunities 28 (Sprint With Us) and 36 (Team With Us), for R-5.3.** Both are at individual evaluation. `users.staffOne` already holds a draft evaluation of the first proponent, scored 3, 3, 3, 3; the second proponent has no evaluation. The draft is the starting condition, not the result being tested.
  - Handles: `opportunities.swuEvaluationAlreadyBegun` / `twuEvaluationAlreadyBegun`, and `proposals.swuAlreadyBegunEvaluated` / `…Untouched` (and the `twu` equivalents).
- **Opportunities 29 and 37, for R-5.32.** These copy the six-proponent and five-proponent consensus opportunities. They need their own copies because R-2.29 finalises the originals, and finalising cannot be undone.
  - Handles: `opportunities.swuConsensusSixProponentsForHistory` / `twuConsensusFiveProponentsForHistory`, and `proposals.swuHistoryOne…Six` / `twuHistoryOne…Five`, each listing its agreed scores.
- No score-entry history is seeded; the only such entries are the ones finalising writes.

**The oracle**

The first `oracle up` did nothing, because copies from an earlier session were still running, so none of the new rows had been loaded. I took it down and brought it up fresh, which ran the migration and the whole seed without errors on the first attempt; no changes to the override were needed. Then, through the application:

- Signed in as the government account, I could read the seeded draft.
- A second create request was refused with 409 and the exact message, for both programs.
- A create request for the untouched proponent returned 201.
- Signed in as the administrator, I finalised both history copies. The proponents' histories showed the expected notes, Q1–Q4 in order. I checked Sprint With Us proposal 2 and the Team With Us proponent that is below the minimum.

I ran `oracle down` afterwards and nothing is left running. `$SDLC_BIN` could not be expanded under this session's permissions, so I ran the same CLI by its path, `~/GitHub/agentic-sdlc/bin/sdlc.mjs`.

**Not done or not recoverable**

- I could not tell a test how to check "no second evaluation is created" by listing evaluations. The service only lists a proponent's evaluations for the consensus stage. Instead, the test reads `stored_scores` for `users.staffOne` and sees the seeded 3, 3, 3, 3 is still the evaluation held.
- I did not check the YAML files with a parser, because running scripts needed approval here. The seed loaded cleanly and the application answered for every new record, so the SQL and handles are consistent; the YAML edits follow the surrounding structure.
- Nothing else from earlier revisions was reopened.

re-address missing-test/R-5.3 to derive-tests: `create_evaluation_by_request`, `evaluation_created` and `creation_refusal_message` on `evaluation-individual-request-swu` and `-twu`, the 409 conflict answer in openapi.yaml, and the seeded `opportunities.swuEvaluationAlreadyBegun` / `twuEvaluationAlreadyBegun`, where `users.staffOne` already holds a draft of the first proponent.

re-address missing-test/R-5.32 to derive-tests: `history_entries` on `proposal-swu-view` and `proposal-twu-view`, and the seeded `opportunities.swuConsensusSixProponentsForHistory` / `twuConsensusFiveProponentsForHistory`, copies held apart from R-2.29's opportunities whose proposals list their agreed scores.