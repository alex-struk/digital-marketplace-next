---
gate: G3
question: "Do the revised evaluation tests now follow from their criteria and from nothing else?"
recommendation: "I acted on the one condition."
opened: 2026-09-25T11:51:59.162Z
---

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on the one condition.

I acted on the one condition. I did not change any other file.

**Condition 1, `tests/acceptance/evaluation/R-5.9.spec.ts`:** I removed the assertion that checked whether the refusal text contained "chair" (`expect((await request.missingChairError()).toLowerCase()).toContain("chair")`). The reviewer is right that R-5.9 only requires the service to reject a panel with no chair. The criterion says nothing about how the refusal is worded. The word "chair" came from the contract's description of the observation, not from the criterion. So a service that refused the panel in other words would meet R-5.9 but still fail the test.

The two checks the reviewer asked to keep are unchanged:
- The test waits until `missingChairError()` returns text, which shows a refusal was reported.
- After reopening `evaluationPanelRequest` for the same opportunity, `panelAsStored()` still matches the reading taken before the submission.

The file's header comment described the refusal as "naming the missing chair", which would now be wrong. I changed it to say the refusal counts "whatever its wording". Nothing else in the file changed: the title, the sign-in, the draft opportunity, the members and the rest of the flow are all as they were. The header's derived date was already 2026-09-25, which is today, so I left it alone.

Nothing else was touched. The other files in `tests/acceptance/evaluation/`, every entry in `tests/acceptance/not-testable.yaml` and `tests/generated` are byte-for-byte as I found them. R-5.9 still has no entry in `not-testable.yaml`, which matches the reviewer's finding that the contract now provides the action and observation it needs.

I did not run the typecheck or the tests after this edit. Removing one assertion does not add any new call to `surface`. Every condition was acted on, and I needed no new surface actions or observations. As the reviewer noted, missing-test/R-5.9 stays open until this test actually runs.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the revised evaluation tests follow from their criteria and nothing else. They do, so I approve. R-5.9 says only that the service must reject a panel that names no chair. The test now asserts two things. First, it polls until missing_chair_error returns any text, which shows a refusal was reported. Second, after reopening evaluation-panel-request for the same opportunity, panel_as_stored reads exactly what it read before the submission, which shows nothing was stored. The earlier check on the refusal's wording is gone, and the header comment now says the refusal counts whatever its wording. The panel goes through evaluation-panel-request, so any refusal it reads comes from the service and not the browser form, which is the distinction the criterion draws. Nothing about how the application is built leaks in: the only inputs are the contract's program/opportunityId parameters, seeded members and a draft title. The runner's typecheck reports no diagnostics under acceptance/evaluation/. The one failure is in adapters/new/, which this proposal is not answerable for. In not-testable.yaml, R-5.9's entry is removed, which is right now that the contract provides submit_panel_with_no_chair and missing_chair_error. R-5.34's entry is moved but its text is unchanged. Its reason is real: the target signs in only two public sector accounts, so the four distinct roles the criterion needs cannot all be reached. The surface.d.ts additions are regenerated contract output and pass the generated check. One weakness is not an overreach: if panel_as_stored could not be read either time, the before/after comparison would pass on two empty readings. It asserts nothing the criterion does not ask for. What would change this ruling: a typecheck diagnostic under acceptance/evaluation/, or the contract showing that missing_chair_error or submit_panel_with_no_chair does something other than what the test relies on. missing-test/R-5.9 stays open until this test actually runs, which no ruling can settle.

**Conditions:**
- condition-met derive-tests-evaluation-stale-4#1: the assertion that the refusal's text contains 'chair' is removed from tests/acceptance/evaluation/R-5.9.spec.ts; the test keeps the poll that missing_chair_error returns text and the check that panel_as_stored after reopening evaluation-panel-request equals the reading taken before the submission, and the header comment now reads 'a refusal, whatever its wording'.

### Runner-owned typecheck evidence

Proposal revision: `2f018119129de2999616f18ee9016b31e40b8fad`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
