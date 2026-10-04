---
stage: "contract"
title: "contract"
at: "2026-10-04T15:59:08.504Z"
cost: 2.7819548000000003
turns: 73
session: "5c084929-ba15-41cb-a3ca-d43e27ebd330"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

## Journal: contract run for the owed third-evaluator test (R-5.27)

I owed one item: R-5.27, the rule that an opportunity moves from individual evaluation to consensus once every evaluator has submitted a score for every question of every proponent, counted against the opportunity's **most recent version**. The test writer needed a third evaluator who could submit scores, so the count rises to 3 evaluators × 3 proponents × 4 questions = 36. I supplied that, and played it through on the oracle to confirm it works.

**Why a sign-in can't supply it on the oracle.** The old application's test sign-in routes are fixed. `/auth/createsessiongov` (`src/back-end/lib/routers/auth.ts:198`) always signs in the account whose identity is `test-gov`, and the administrator route is fixed to `test-admin`. Only the vendor route takes a parameter. So the oracle can act as exactly two public sector accounts, and no amount of searching will find a third. I recorded that as an explicit gap rather than leaving it to look like an omission.

**What I used instead: a seeded starting condition.** The old count logic (`src/back-end/lib/db/evaluations/sprint-with-us/team-questions.ts:339`) takes the number of evaluators and questions from the newest version. It counts submitted scores only by status and by the proposals named in the submission that triggers the check; it does not check who wrote them. So a third evaluator's scores, already submitted, are a fair starting point: the application still does the counting, the move and the notice itself.

**Changes, by file:**
- **`tests/seed/010-sprint-with-us-stages.sql`** gains opportunity block 41, `opportunities.swuNewestVersionSeatsThirdEvaluator`:
  - Status is individual evaluation, with three proposals and four questions on both versions.
  - The first version seats the usual panel: `users.staffOne` as an evaluator and `users.administratorOne` as chair and evaluator.
  - A second version, published a day after closing, adds `users.staffPanelEvaluator` as a third evaluator. It carries the `EDITED` history row the application writes whenever it publishes a new version.
  - The third evaluator's scores (4, 4, 4, 4) for all three proponents are seeded as submitted. The other two evaluators haven't started.
- **`tests/seed/manifest.yaml`** names the opportunity and both version ids, a new `evaluation_panels.sprintWithUsThreeEvaluators`, and the proposals `swuThirdEvaluatorOne`/`Two`/`Three`. It also corrects the panel-evaluator account's note, which said that account sat on no panel.
- **`spec/contract/personas.yaml`** adds `evaluation-panel-third-evaluator`:
  - On the rebuilt target it signs in through the sandbox identity provider as `gov-panel-evaluator`.
  - On the oracle its session-route sign-in is marked `unavailable`, with the reason above.
  - A test for R-5.27 should **not** use this persona on the oracle. It acts as `public-sector-staff` and then `administrator`, as the existing R-5.27 test already does.
- **`spec/contract/surface.yaml`**: the evaluation-panel comment now points to the new fixture and names the pages and fields a test reads. The move is read from `status` on `opportunity-swu-view`, after each evaluator submits on `evaluation-individual-list-swu`.

No page, persona or seed record was removed. The API description, observables and Compose override are unchanged.

**The oracle started, and the fixture worked.** `oracle up` ran all 78 migrations, loaded the seed and started four copies; the existing override needed no change. Reading the new opportunity through the application's own API returned:
- status individual evaluation,
- three evaluators on the newest panel, including `panel.evaluator@example.test`,
- four questions, three proposals and the `EDITED` history entry.

I then played the criterion through the API on the default copy:
1. The government account scored and submitted all three proponents. The count reached 24, the whole of what the first version would have needed, and the status stayed at `EVAL_QUESTIONS_INDIVIDUAL`.
2. The administrator scored and submitted. The count reached 36, and the response came back `EVAL_QUESTIONS_CONSENSUS`.
3. The mail catcher held "[TEST] A Sprint With Us Opportunity Is Ready for Question Consensus".

I ran `oracle down` afterwards and confirmed no containers remain.

**Two limits on what I checked:**
- This session wasn't allowed to run a YAML parser or query the database directly. I checked the database side through the application's API instead; the edited YAML files haven't been run through a parser.
- I didn't open the notice to confirm who it went to. Its recipients are the chair (`admin.one@example.test`) and the owner (`staff.one@example.test`), as blind copies.

re-address missing-test/R-5.27 to derive-tests: tests/seed adds opportunities.swuNewestVersionSeatsThirdEvaluator (evaluation_panels.sprintWithUsThreeEvaluators, proposals swuThirdEvaluatorOne/Two/Three). Its newest version seats users.staffPanelEvaluator as a third evaluator whose scores are already submitted. Acting as public-sector-staff and then administrator on evaluation-individual-list-swu, the first submission leaves the status on opportunity-swu-view at individual evaluation (24 of 36) and the second moves it to consensus and sends the ready-for-consensus notice. On the rebuilt target, personas.yaml also adds evaluation-panel-third-evaluator (sandbox-idp: gov-panel-evaluator); on the oracle it is marked unavailable.