---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-04T16:23:46.331Z"
cost: 0.6423928
turns: 17
session: "5abe1c47-4bbb-4258-ae8e-20bdcbd65edc"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

R-5.27 (v2), the one criterion handed back to me, now has a test for its remaining clause. Its entry is gone from `tests/acceptance/not-testable.yaml`, so the criterion no longer carries a partial-coverage record beside its test. I could not type-check or run anything: both the TypeScript compiler and the test runner needed permission that wasn't given here, so the test has never been compiled or run against a target.

**What was owed.** `tests/acceptance/evaluation/R-5.27.spec.ts` already had three tests from the last approved derivation. They cover the move to consensus, the chair and owner being told, and the rule that the most recent version's panel decides the count (once on Team With Us, once on Sprint With Us with a third evaluator). The open entry named one clause: "but only over the proponents named in the submission that triggers the check". It could not be tested before because the only submission the surface offered named every proponent. When every proponent is named, a count over the named ones and a count over all of them always agree.

**What the contract added.** The contract stage supplied two things. One is the seeded opportunity `seed.opportunities.swuSubmissionNamesTwoOfThree` with proposals `swuNamedOne`, `swuNamedTwo` and `swuLeftOut`. The other is the request page `evaluationIndividualSubmissionRequestSwu`, with the action `submitScoresForConsensusNaming` and the observations `requestAccepted`, `refusalMessages` and `storedStatus`.

**The new test.** It is a fourth `test()` in the existing file, titled with the clause's own words:
1. It signs in as `persona.evaluationPanelEvaluator` (users.staffOne).
2. It reads `storedStatus` to confirm the opportunity starts in `EVAL_QUESTIONS_INDIVIDUAL`, then empties the mail catcher using the file's existing helper.
3. It submits naming only `seed.proposals.swuNamedOne.id` and `seed.proposals.swuNamedTwo.id`, and asserts the request was accepted. If it was refused, the failure message shows the service's refusal text.
4. It polls `storedStatus` until it reads `EVAL_QUESTIONS_CONSENSUS`.
5. It confirms through the caught messages that both the chair (administratorOne) and the owner (staffOne) were reached.

Counted over the two named proponents the scores are complete (16 of 16). Counted over all three they would be 16 of 24, because `swuLeftOut` has no scores at all. So the move and the notice can only happen if the count was limited to the named proponents.

**One input-shape assumption.** The surface describes the action's input only as the proponents to name, "as seed.proposals handles (or proposal identifiers)". I passed `{ proposals: [<ids>] }`. The input is untyped, so the adapter has to read that key; if it expects another one, this test will fail on that rather than on the behaviour.

No criteria are left untestable in this run, and I needed no surface action or observation that the contract does not already provide. I changed nothing outside `tests/acceptance`.