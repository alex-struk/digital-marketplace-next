| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T14:39:14.589Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 18 (The chair agrees a consensus and the questions stage is finalised) do what its criteria say?

**Recommendation.** I made no changes to the application this round.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made no changes to the application this round. The ruling that sent slice 18 back puts the remaining failures in the tests and the contract, not the code. It also asks this stage for no change under `app/` or `docs/decisions/`, so the existing build stays as it is.

**Why R-5.31 and R-5.33 fail.** The application now does what the previous ruling asked. Every staff notice is one message whose only visible recipient is the service's own address, and every reader is a blind copy. That shape comes from `blindCopiedToStaff` in `app/backend/src/mail/message.ts`. The consensus, individual-evaluation, proposal-notice and deadline-closing services all use it, and decision record 0063 describes it. R-6.15 passed in the last verify. The R-5.31 test (the submitted-consensus notice to the owner and administrators) and the R-5.33 test (the finalised notice to the chair and owner) look for the notice by searching the visible To line for a reader's address. Under R-6.15 no reader's address is ever on that line, so both tests find nothing. Changing the application to pass them would break R-6.15, and that is the conflict the ruling sent to the other stages.

**Left for other stages.** The ruling addressed three conditions elsewhere, and I did not touch them:
- **R-5.31 test:** find the submitted-consensus notice another way and check the owner and both administrators in its blind-copy list. This belongs to the test-writing stage.
- **R-5.33 test:** the same change for the finalised notice, checking the chair and the owner. Also the test-writing stage's.
- **Contract mail note:** the note in `spec/contract/observables.yaml` (lines 152–154) should be restated to agree with R-6.15. This belongs to the contract stage.

**State of the build.**
- **Check:** the workspace had no installed dependencies, so the first check failed with `tsc` not found. After `npm install` under `app/`, `npm --prefix app run check` typechecks and passes every unit-test suite: 16, 805 and 494 tests across the three test runs. The error lines in its output are logged by tests that deliberately exercise failure paths, such as an undelivered welcome mail and failed deadline closings. They are not failures.
- **Criteria:** all fifteen are built as described in the previous rounds' entries: the consensus tab and per-proponent screens, reopen and resubmit, the explanation for an owner who is not on the panel, the single finalise action and its refusals, screening in the top proponents, the two notices, the blind-copy shape, who may read individual evaluations, and the one evaluation the two programs share.

**What would settle it.** Once the two tests read the blind-copy list instead of the visible recipient, a verify where all fifteen criteria pass is, by the ruling's own terms, enough to approve the slice as it stands. Nothing is missing from this slice for the next one to pick up.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 18 do what its criteria say, given that verify recorded a fail after three builds? Ruling: return, for tests to be written again, with no change asked of the application. All fifteen criteria the slice claims now pass, including R-5.31 and R-5.33, whose tests were rewritten to find the notice through the service's own address and check its blind-copy list. The fail verdict comes only from three earlier slices' criteria that regressed: R-1.1 (the evaluator clause), R-2.36 (the administrator clause) and R-5.27. Each of those tests looks the notice up with mail.messagesTo(reader) in tests/fixtures/mail.ts, which runs Mailpit's to: search and so only matches the visible To line. R-6.15, an accepted criterion that names panel and owner notices explicitly, requires every multi-recipient notice to carry its readers as blind copies with the service's address as the only visible recipient. A reader's address can therefore never be on that line, and the search returns nothing. None of R-1.1, R-2.36 or R-5.27 asks for a reader to be the visible recipient, only that they are notified or receive a notice. The build meets them in the shape R-6.15 requires (blindCopiedToStaff, decision record 0063), and its own unit and end-to-end tests show this. Making these tests pass by changing the application would break R-6.15. This is the same conflict the previous ruling sent to the test-writing stage for R-5.31 and R-5.33, and the escalation's account (that the fault may be in a test rather than the application) is what decided it. The contract-note request from that ruling is still open and is not repeated. What would change the ruling: once these three tests are rewritten to read the blind-copy list and a verify passes every claimed and rechecked criterion, the build is approvable as it stands. If the test-writing stage cannot rewrite them, for example because the shared mail helper cannot change, that is a pipeline matter and should be escalated rather than ruled here.

**Conditions:**
- test-overreaches R-1.1: the Sprint With Us / Team With Us clause looks for the ready-for-evaluation notice with mail.messagesTo(evaluator), a Mailpit to: search that only matches the visible To line, so it requires each evaluator to be a visible recipient. The criterion only says the evaluators on the panel are announced to, and R-6.15 requires a panel notice to carry them as blind copies with the service's own address as the only visible recipient. Find the notice through the service's address (or by subject) and check that each evaluator is in its blind-copy list, as the rewritten R-5.31 and R-5.33 tests do. The Code With Us author clause is unaffected.
- test-overreaches R-2.36: the withdrawal check polls mail.messagesTo(administratorOne), a Mailpit to: search on the visible To line, so it requires the administrator to be a visible recipient. The criterion only says a withdrawal notice is sent to every administrator, and R-6.15 requires that multi-recipient notice to carry the administrators as blind copies under the service's own address. Find the administrators' notice through the service's address and check its blind-copy list. Keep the vendor's own message checked by its To line, since it has a single recipient.
- test-overreaches R-5.27: the check polls mail.messagesTo for the chair and the owner, a Mailpit to: search on the visible To line, so it requires them to be visible recipients. The criterion only says the chair and the owner are notified, and R-6.15 names notices to a panel and to an opportunity's owner as ones that must carry their readers as blind copies with the service's own address as the only visible recipient. Find the ready-for-consensus notice through the service's address and check that both the chair and the owner are in its blind-copy list, as the rewritten R-5.31 and R-5.33 tests do.
