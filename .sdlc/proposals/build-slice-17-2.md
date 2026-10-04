---
gate: G3
question: "Does slice 17 (Panel evaluators score proponents individually) do what its criteria say?"
recommendation: "I fixed all three failures the ruling put on the application, and `npm --prefix app run check` passes (typecheck, then 16 + 765 + 484 tests)."
opened: 2026-10-04T12:41:29.215Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

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
