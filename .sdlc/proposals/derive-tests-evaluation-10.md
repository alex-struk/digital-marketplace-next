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
