---
gate: G3
question: "Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?"
recommendation: "The ruling on slice 18 asked for no change to the application, and I made none: nothing under `app/` or `docs/decisions/` was edited in this revision."
opened: 2026-10-04T16:28:20.127Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?

**Recommendation.** The ruling on slice 18 asked for no change to the application, and I made none: nothing under `app/` or `docs/decisions/` was edited in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The ruling on slice 18 asked for no change to the application, and I made none: nothing under `app/` or `docs/decisions/` was edited in this revision.

**Why nothing changed.** All fifteen criteria this slice claims now pass. That includes R-5.31 and R-5.33, whose tests were rewritten to find the notice through the service's own address and check its blind-copy list. The fail verdict came from three earlier slices' criteria that went backwards: R-1.1 (the evaluator clause), R-2.36 (the administrator clause) and R-5.27. Their tests look notices up by the visible To line. R-6.15 requires every notice with several recipients to put its readers in blind copy, with the service's own address as the only visible recipient. The application does this (decision record 0063), so a reader's address can never appear on the To line those tests search. Changing the application to make them pass would break R-6.15. The three requests to rewrite those tests are filed with the test-writing stage, and I left them alone.

**What I checked.** The first run of `npm --prefix app run check` failed only because this workspace had no installed packages (`tsc: not found`). After `npm --prefix app ci` it passed:
- **Typechecks:** pass for the migrations, backend and frontend packages.
- **Migrations:** 16 of 16 unit tests pass.
- **Backend:** 805 of 805 pass across 50 files, including the slice's tests for blind-copy notices and the consensus and finalise rules.
- **Frontend:** 494 of 494 pass across 28 files.

**Still open:**
- Per the ruling, the build can be approved as it stands once those three tests read the blind-copy list and a verify passes every claimed and rechecked criterion.
- The earlier ruling's request for a contract note is still open with another stage.
- If the shared mail helper in `tests/fixtures/mail.ts` cannot be changed, that is a pipeline problem to escalate, not something to fix in the application.
- The next slice inherits slice 18 as it was, with nothing new missing.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Slice 18's fifteen claimed criteria all pass verify, but the escalated failure is R-5.27 (approved at slice 17), case 'only over the proponents named in the submission that triggers the check': a submission naming two of three proponents is refused as incomplete. That is the application's fault, not the test's. IndividualEvaluationsService.submitAll (app/backend/src/evaluations/individual-evaluations.service.ts:172-193) ignores the proposals the submission names: it checks completeness over every proponent under review of the questions, and counts toward the automatic move to consensus over all of them as well. R-5.25 v3 refuses only a submitted set containing an incomplete evaluation, and R-5.27 v2 counts only over the proponents named in the triggering submission. The proposal's account, that the failures come from tests reading the visible To line, does not hold for this case: the test stops at the refusal, before any mail is read. So the condition goes to build rather than derive-tests: the test asks for what the criterion says. Approvable once submitAll takes the named proposals and a verify passes every claimed and rechecked criterion.

**Conditions:**
- submitIndividualQuestionEvaluations must read the proposals named in the request's value, as the contract's tagged change specifies. In IndividualEvaluationsService.submitAll (app/backend/src/evaluations/individual-evaluations.service.ts), check completeness over the signed-in evaluator's evaluations of the named proposals only, and submit only those, so that a submission naming two complete proponents is accepted even when a third proponent of the opportunity has no scores at all (R-5.25 v3: the service refuses only a submitted set that contains an incomplete evaluation). Count toward the automatic move to consensus over the proponents named in the triggering submission (R-5.27 v2), and keep the chair-and-owner notice as blind copies of one message visibly addressed to the service (R-6.15). What showed it: verify's R-5.27 recheck sent a submission naming two of three proponents and received the refusal 'This evaluation could not be submitted for review because it is incomplete…'. Record the reading in a decision record under docs/decisions/.
