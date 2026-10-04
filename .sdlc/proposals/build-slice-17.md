---
gate: G3
question: "Does slice 17 (Panel evaluators score proponents individually) do what its criteria say?"
recommendation: "I built slice 17: panel evaluators can now score proponents individually, in both Sprint With Us and Team With Us."
opened: 2026-10-04T12:01:07.530Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 17 (Panel evaluators score proponents individually) do what its criteria say?

**Recommendation.** I built slice 17: panel evaluators can now score proponents individually, in both Sprint With Us and Team With Us.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 17: panel evaluators can now score proponents individually, in both Sprint With Us and Team With Us. `npm --prefix app run check` passes: 16 migrations tests, 763 backend tests and 484 frontend tests. Nothing ran against the docker sandbox or a browser, so the acceptance suite has not seen it yet.

**Three criteria earlier slices had already built.** I checked these and changed nothing:
- **R-1.24, R-2.5:** the closing hook already moves submitted proposals to the first review stage and names them "Proponent 1", "Proponent 2" and so on.
- **R-5.16:** the panel can already be changed until consensus begins. My end-to-end test changes the panel during individual evaluation (accepted), then tries again after consensus (refused).

**New in the service** (`app/backend/src/evaluations/`, rules in `app/backend/src/rules/individual-evaluation.ts`):
- **Evaluation addresses.** The contract's routes for both programs: start an evaluation, read one, edit one (only the `edit` tag), list a proponent's evaluations, and list the reader's own evaluations for an opportunity.
- **Recording (R-5.21, R-5.24).** Only an evaluator on the current panel may record, only during individual evaluation, and only for a proposal under review of its questions. A draft can be changed only by its own evaluator. A submitted one is fixed.
- **Drafts (R-5.23).** Drafts are kept as sent, out of range or not. A question with a comment but no score yet is stored as `NaN`, because the score column cannot be empty.
- **Second evaluation (R-5.3).** Refused with 409 and the exact sentence the contract gives.
- **Submitting one evaluation alone (R-5.26).** Refused by the contract check at the boundary.
- **Submitting the whole set (R-5.25).** Uses `submitIndividualQuestionEvaluations` on the opportunity. It requires a complete evaluation for every proponent under review, or nothing is submitted and the answer is R-5.25's sentence.
- **Move to consensus (R-5.27).** In the same locked transaction, once there is one submitted score per question per proponent per evaluator, the opportunity moves to consensus. The chair and the owner get one blind-copied email.
- **What the panel sees on the opportunity (R-5.35, R-5.19).** Once it has closed, panel members get the proponents by anonymous name, in order, with their answers and no organization. The opportunity list now also carries each panel to whoever may see it, so the dashboard can find the ones a person evaluates.

**New on screen:**
- **Dashboard (R-5.19).** An "Evaluations" section with a link to it, a table showing the person's role on each panel, and an empty message.
- **Manage page (R-5.34).**
  - An evaluator gets Instructions and Evaluation, and opens on Instructions if they don't manage the opportunity. The chair, the owner and administrators get a Consensus tab once it has closed. Anyone offered no tab, or asking by address for a tab they aren't offered, gets the not-found page.
  - The Evaluation tab lists proponents in order with each evaluation's status. Its submit button stays disabled until every evaluation is complete, and a refusal shows in an alert.
- **Scoring screens.** Four new routes, built from the catalogue stories: one score and one comment per question beside the proponent's answer. Saving never refuses; it lists what is still wrong. "Save and go to next/previous" moves through proponents in anonymous order. A submitted evaluation is read-only.

**Decisions I made, recorded in `docs/decisions/0062`:**
- **Who reads an individual evaluation.** R-5.11 and R-5.28 contradict each other (design gap 3). I chose: the evaluator always; every panel member from consensus on; the owner and administrators off the panel only after the question stages; nobody unconnected, ever. This follows R-5.28's text, not its note saying an administrator can read at any stage. If that ruling goes the other way, only `mayReadIndividualEvaluation` changes.
- **When the chair sees Consensus.** The design's table offers it to a non-evaluating chair only from the consensus stage. I offer it from closing, because R-5.34's seeded case asks what the chair sees during individual evaluation. This departs from the catalogue.

**For you to decide:**
- The Consensus tab only says which stage the opportunity is at. The consensus list, the consensus routes and finalising belong to slice 18, which can build on the evaluations service.
- The design leaves a few things open that I didn't settle with you. The status words and the empty-dashboard wording are the design's own. Gap 10 doesn't say what "next" or "previous" does at the first and last proponent; I send the evaluator back to the Evaluation tab.
- Nothing in this slice needed a change outside `app/` and `docs/decisions/`.

**Tests added:**
- `individual-evaluation-rules.test.ts`: the rules on their own.
- `individual-evaluation-end-to-end.test.ts`: the real service over the migrated schema with the acceptance seed applied, taking `closedSprintWithUs` from closing through to consensus and the notice, plus permission cases on the other seeded opportunities.
- `individual-evaluation.test.tsx`: the screens against a stand-in service.
- The every-message mail test now covers the new consensus notice for both programs.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 17 do what its criteria say? Not yet: verify failed six of the 17 criteria the slice claims, so this goes back. I sorted each failure against the page captured when it failed, the adapter and the plan. Three are the application's. R-5.19: the dashboard's Evaluations region shows its empty message to a panel member, while the same spec's first case shows that member opening the draft, so the panel was saved and the list does not carry the draft to them. R-5.27: the opportunity reached consensus but no mail reached the chair or the owner, and the same mail reader found the blind-copied closing notice in slice 16 (R-5.20 passed), so the notice was not delivered. R-5.26: the single-evaluation submit is refused as '"submit" is not something an evaluation can be asked to do.', which the adapter does not read as the 'rejected as unrecognised' the criterion names. The refusal should say the request is unrecognised. One belongs to contract: R-2.5 signs in as the evaluation-panel-evaluator persona, which on the new target is users.staffPanelEvaluator (…0104). The seed seats that user on no panel, so the closed opportunity's evaluation tab correctly answers not found. Two belong to plan: R-5.28 and R-5.36 open the chair's per-proponent consensus create page, which plan/tasks.md gives to Slice 18 ('per-proponent consensus screens for the chair'). Apart from these, the diff stays within the slice and I found nothing else to return it for. The ruling changes to an approval once a current verify is green after the build fixes the three application failures and the contract and plan requests are answered.

**Conditions:**
- R-5.19, in the case "A panel member's opportunity is listed for them under a separate heading for work they are evaluating": Error: expect(received).toContain(expected) // indexOf — Expected substring: "R-5.19 draft opportunity listed for the people evaluating it" — Received string:    "" — at tests/acceptance/evaluation/R-5.19.spec.ts:109 — its last steps: evaluationPanelDashboard.panelOpportunitiesTable() at /dashboard read "" → evaluationPanelDashboard.panelOpportunitiesTable() at /dashboard read "" → evaluationPanelDashboard.panelOpportunitiesTable() at /dashboard read "" → evaluationPanelDashboard.panelOpportunitiesTable() at /dashboard read "" — the page as it failed: .sdlc/evidence/slice-17/R-5.19.png, .sdlc/evidence/slice-17/R-5.19.txt
- R-5.26: Error: expect(received).toBeTruthy() — Received: "" — at tests/acceptance/evaluation/R-5.26.spec.ts:51 — its last steps: …evaluations/00000000-0000-4000-8000-000000000102/edit?saved=draft read "" → evaluationIndividualRequestSwu.refusedAsUnrecognised() at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/proposals/00000000-0000-4000-8000-000000000741/team-questions/evaluations/00000000-0000-4000-8000-000000000102/edit?saved=draft read "" → evaluationIndividualRequestSwu.refusedAsUnrecognised() at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/proposals/00000000-0000-4000-8000-000000000741/team-questions/evaluations/00000000-0000-4000-8000-000000000102/edit?saved=draft read "" — the page as it failed: .sdlc/evidence/slice-17/R-5.26.png, .sdlc/evidence/slice-17/R-5.26.txt
- R-5.27: Error: expect(received).toBeGreaterThan(expected) — Expected: > 0 — Received:   0 — at tests/acceptance/evaluation/R-5.27.spec.ts:80 — its last steps: evaluationIndividualListSwu.open({opportunityId}) at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation → evaluationIndividualListSwu.submitScoresForConsensus() at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation → opportunitySwuView.open({opportunityId}) at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701 → opportunitySwuView.status() at /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701 read "Team questions: consensus" — the page as it failed: .sdlc/evidence/slice-17/R-5.27.png, .sdlc/evidence/slice-17/R-5.27.txt
- addressed-to contract: R-2.5: the evaluation-panel-evaluator persona signs in on the new target as users.staffPanelEvaluator (00000000-0000-4000-8000-000000000104, per tests/seed/manifest.yaml), and no seeded panel includes that account, the panel of opportunities.closedSprintWithUs included, so the evaluation list the R-2.5 test opens for that persona on closedSprintWithUs correctly answers 'Page not found' (.sdlc/evidence/slice-17/R-2.5.txt). Seat the persona's account as an evaluator on that seeded panel, or map the persona to an account already seated there, without changing the two-evaluator count R-5.27's test relies on.
- addressed-to plan: R-5.28: its test opens the chair's per-proponent consensus create page (/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create), and plan/tasks.md has Slice 18 make it ('the consensus tab and per-proponent consensus screens for the chair'), while Slice 17 claims R-5.28. Move R-5.28 to Slice 18, or say it is answered there.
- addressed-to plan: R-5.36: both of its cases open the per-proponent consensus create pages (sprint-with-us team-questions/consensus/create and team-with-us resource-questions/consensus/create) and go on through finalising, which plan/tasks.md gives to Slice 18 ('per-proponent consensus screens for the chair' and 'the single finalise action'), while Slice 17 claims R-5.36. Move R-5.36 to Slice 18, or say it is answered there.
