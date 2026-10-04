---
gate: G3
question: "Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?"
recommendation: "I fixed the failure the ruling escalated, and `npm --prefix app run check` passes: typecheck plus all unit tests (16 migrations, 809 backend, 494 frontend)."
opened: 2026-10-04T17:07:52.367Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?

**Recommendation.** I fixed the failure the ruling escalated, and `npm --prefix app run check` passes: typecheck plus all unit tests (16 migrations, 809 backend, 494 frontend).

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed the failure the ruling escalated, and `npm --prefix app run check` passes: typecheck plus all unit tests (16 migrations, 809 backend, 494 frontend). Nothing else in slice 18 changed; its fifteen criteria had already passed verify.

**What was wrong.** When an evaluator submitted their individual scores (`submitIndividualQuestionEvaluations`), the service ignored which proposals the request named. It checked for completeness, and counted toward the automatic move to consensus, over every proponent under review of the opportunity. So a submission naming two complete proponents was refused as incomplete whenever a third proponent had no scores. That breaks R-5.25 v3, which refuses only a submitted set that contains an incomplete evaluation, and R-5.27 v2, which counts only the proponents named in the submission that triggers the check.

**What changed.**
- **Reading the request:** a new rule, `readNamedProposals` in `app/backend/src/rules/individual-evaluation.ts`, reads `value.proposals` as the contract describes it. The update route (`other-programs.service.ts`) now passes that value to `IndividualEvaluationsService.submitAll`.
- **Checking and submitting:** `submitAll` checks only the signed-in evaluator's evaluations of the named proposals and submits only those, or none of them. A named proposal the evaluator has not scored counts as incomplete.
- **Counting toward consensus:** the count is evaluators × named proposals × questions, as R-5.27 v2 says.
- **Refusals:** a named proposal that isn't a proponent of this opportunity under review of its questions is refused. So is a `proposals` that isn't a list of identifiers, and an empty list is refused as having no proponents to evaluate.
- **Notice unchanged:** the chair-and-owner notice is still one message visibly addressed to the service, with both of them as blind copies (R-6.15).

**One choice a reviewer should know about.** A request that names no proposals at all still means "every proponent under review", as before. I kept this because the application's own screen sends only the tag, and it offers submission only once every proponent is complete, so for that screen the two sets are the same. I didn't change the frontend. Decision record `docs/decisions/0064-an-individual-submission-covers-the-proposals-it-names.md` sets this out.

**Tests.**
- **Rules:** cases for `readNamedProposals`, plus a counting case where two evaluators submit two of three proponents and the opportunity moves to consensus.
- **End-to-end tests** against the in-process service and the seed now show that:
  - naming an incomplete draft is still refused;
  - naming a proposal from another opportunity is refused;
  - a `proposals` given as a string is refused;
  - naming only the one complete proponent submits it and leaves the other drafts alone.
- **The move to consensus:** that end-to-end test now has the last evaluator score and name only two of the three proponents. The opportunity moves to consensus and sends the single blind-copied notice to the chair and the owner.

I touched nothing outside `app/` and `docs/decisions/`. Nothing here needed a change to the spec, contract, plan or design. A later slice will find the submit screen still sending only the tag; if a screen ever submits fewer than every proponent, it will need to name them in `value.proposals`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Does slice 18 do what its criteria say? Approve. Verify recorded a current pass for build-slice-18-6, 15 of 15 claimed criteria met, against app tree 4108841, which matches HEAD:app on this branch. The only commit after the build adds the result file. The revision does what the escalated condition asked. IndividualEvaluationsService.submitAll now reads value.proposals through readNamedProposals and checks completeness over the signed-in evaluator's evaluations of the named proposals only. It submits all of them or none, refuses a named proposal that is not under review of this opportunity's questions, and refuses an unreadable list. It counts toward consensus as evaluators x named proposals x questions, per R-5.27 v2. The chair-and-owner notice stays one message visibly addressed to the service with both as blind copies (R-6.15). End-to-end tests cover each case, and decision record 0064 records the reading. A request naming no proposals still means every proponent under review, which fits R-5.25 v3 because only a set containing an incomplete evaluation is refused. Tier is STANDARD and no residual risk is marked unaccepted. What would change this ruling: a stale or failing verify result, or a named submission accepting an incomplete evaluation. The missing tests for R-1.1 and R-5.27, owed by calibrate, are not settled here and stay open.

**Conditions:**
- condition-met build-slice-18-5#1: submitAll in app/backend/src/evaluations/individual-evaluations.service.ts reads value.proposals via readNamedProposals (app/backend/src/rules/individual-evaluation.ts). It checks and submits only the signed-in evaluator's evaluations of the named proposals, all or none, and counts toward consensus over the named proposals (R-5.27 v2). The notice is still one blind-copied message (R-6.15). Covered by app/backend/tests/individual-evaluation-end-to-end.test.ts ('checks and submits only the proposals a submission names', and the move to consensus naming two of three proponents), and recorded in docs/decisions/0064-an-individual-submission-covers-the-proposals-it-names.md.
