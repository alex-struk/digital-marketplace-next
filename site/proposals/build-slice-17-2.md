| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T12:41:29.215Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 17 (Panel evaluators score proponents individually) do what its criteria say?

**Recommendation.** I fixed all three failures the ruling put on the application, and `npm --prefix app run check` passes (typecheck, then 16 + 765 + 484 tests).

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed all three failures the ruling put on the application, and `npm --prefix app run check` passes (typecheck, then 16 + 765 + 484 tests). I couldn't run the application in a browser here, so each fix is proven only by tests that start the service in-process. The real proof is the next verify run. The three conditions sent to contract and plan (R-2.5, R-5.28, R-5.36) belong to other stages, and I didn't touch them.

**R-5.19 — a panel member's draft was missing from their dashboard.** The dashboard's Evaluations list is filled from the opportunity list. That list filtered Sprint With Us and Team With Us opportunities by the general reading rule, which shows a draft only to its author and to administrators. Opening one opportunity used a broader rule that also lets in a public sector employee on its panel. That is why the member could open the draft but never saw it listed. The list now uses the same rule as opening one (`app/backend/src/opportunities/other-programs.service.ts`). A new end-to-end test covers it: an administrator creates a draft and seats a staff member on its panel. The member then finds it in the list with their seat. After being swapped off the panel, they no longer see it. I swapped them out rather than removing them because an earlier slice's rule refuses a one-member panel.

**R-5.26 — the refusal didn't say "unrecognised".** There were two problems:
- **Wording:** the service's refusal now reads "Unrecognised request: "submit" is not recognised for an evaluation. …". The text comes from `unrecognisedEvaluationRequest` in `rules/individual-evaluation.ts`.
- **Who answers:** a test that goes through the request checker against `openapi.yaml` showed the checker refuses `tag: "submit"` first, in its own words ("/body/tag must be equal to one of the allowed values: edit"). That never says "unrecognised". A new helper, `withAnyEvaluationTag` in `common/contract.ts`, makes the checker leave the tag to the service on just the two single-evaluation routes (Sprint With Us and Team With Us). It still requires a tagged body there.

The end-to-end test now asserts the exact answer and that the evaluation stays a draft. A contract test checks the helper changes only those two routes' change body.

**R-5.27 — the consensus notice didn't reach the chair or the owner.** The mail was being sent, but as one message with both people only as blind copies, so neither was a visible recipient. Slice 16's closing notice had the same problem and was fixed by sending each person their own copy (decision record 0060). The R-5.20 test that passed reads exactly that shape. I made the same change here: the chair and the owner now each get their own message addressed to them alone, and neither sees the other. The end-to-end test asserts two messages, each visibly to one reader and never naming the other.

**Open question on R-6.15:** R-6.15 literally asks for the service's own address as the visible recipient with everyone else blind-copied. The one-copy-each shape protects what it is about (nobody sees who else was told) but not its wording. Slice 18 answers for R-6.15, so it needs to settle whether that shape is acceptable for these small staff notices.

I updated decision record 0062 to describe all three corrections. Nothing else changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 17 do what its criteria say, now that the three failures returned on build-slice-17 have been worked? Ruling: approve. The verify result is pass and current: recorded against this proposal's application tree 46ed0a7, with all 15 criteria the slice claims exercised against the application and met, including R-5.19, R-5.26 and R-5.27, which failed before. Each fix matches its criterion. R-5.19: the Sprint With Us and Team With Us opportunity list now uses the same reading rule as opening one opportunity (other-programs.service.ts), so a panel member's draft is listed under Evaluations, and the panel is carried on the list only to whoever maySeePanel allows. R-5.26: the service answers with an 'Unrecognised request' refusal from unrecognisedEvaluationRequest, and withAnyEvaluationTag leaves only the tag's value to the service on the two single-evaluation routes, still requiring a tagged body; contract.test.ts asserts nothing else on those routes changed. R-5.27: the chair and the owner each receive their own message addressed to them alone, matching slice 16's closing notice (decision record 0060). mayReadIndividualEvaluation follows R-5.28: the evaluator only before consensus, the whole panel from consensus on, and an owner or administrator off the panel only once the question stages are over. The raw SQL builds table names only from the file's own constants and binds every value as a parameter. No secret, credential or personal data is in the code, and the one error log records the error's name only. The new seams are covered by rules unit tests, an end-to-end test against a real database and a contract test. The literal R-6.15 shape (the service's own address visible, everyone else blind-copied) is owned by slice 18, and the proposal raised it openly; it does not bear on this slice's criteria. What would change the ruling: a verify failure on a newer tree, or slice 18 deciding that one copy each does not satisfy R-6.15.

**Conditions:**
- condition-met build-slice-17#1: other-programs.service.ts list() now filters with mayReadOther (the same rule as reading one opportunity), and the list carries the panel to whoever maySeePanel allows, so the dashboard's Evaluations section lists a draft to its panel members; verify on tree 46ed0a7 passes R-5.19, and individual-evaluation-end-to-end.test.ts asserts a draft is listed to its panel member and no longer listed after they are swapped off the panel.
- condition-met build-slice-17#2: unrecognisedEvaluationRequest in rules/individual-evaluation.ts gives the 'Unrecognised request' wording, and withAnyEvaluationTag in common/contract.ts leaves the tag's value to the service on the two single-evaluation routes; verify on tree 46ed0a7 passes R-5.26, and the end-to-end test asserts the exact refusal and that the evaluation stays a draft.
- condition-met build-slice-17#3: tellOfConsensus in individual-evaluations.service.ts sends the chair and the owner each their own message, addressed to them alone, through addressedToEach; verify on tree 46ed0a7 passes R-5.27, and the end-to-end test asserts two messages, each visibly addressed to its one reader and never naming the other.
