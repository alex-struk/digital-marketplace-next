| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T15:21:47.454Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote the test for R-5.27 (v2), the one criterion in this run.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for R-5.27 (v2), the one criterion in this run. No criteria went to `tests/acceptance/not-testable.yaml`, and I could not type-check or run the test: the session was not allowed to run `tsc`.

The ruling was that the earlier test (spec@7a0d476…) found the notice by searching mail for the chair's and the owner's addresses on the visible To line. Under R-6.15 that is wrong: a notice to a panel and to an opportunity's owner shows only the service's own address as visible recipient and carries its readers as blind copies. The new file is `tests/acceptance/evaluation/R-5.27.spec.ts`, with the requested header for spec@658792c3… derived 2026-10-04. It no longer searches mail by the chair's or the owner's address. It now works like the rewritten R-5.31 and R-5.33 tests:

- **Finding the notice:** it collects every caught message from the caught-message list and from a mail search on the service address, `donotreply@example.test`.
- **Reading recipients:** it opens each message by its identifier and reads its blind-copy and visible-recipient lists.
- **Pass condition:** the chair (administratorOne) and the owner (staffOne) must each appear on some caught message.

The test does not require both to be on the same message, because the criterion only says both are told.

**What the test does:** it uses the seeded closed Sprint With Us opportunity, which has two evaluators, three proponents and four questions — the shape the criterion describes. It runs the scheduled transitions so the opportunity enters individual evaluation. The staff evaluator scores every proponent and submits; the administrator, who is the chair, scores every proponent. Just before the administrator's submission brings the count to twenty-four, the test empties the mail catcher and confirms it stays empty. After that submission it checks that the opportunity's status names consensus, then polls until both the chair and the owner have been reached. It asserts nothing beyond the criterion's single given/when/then, so it has one `test()`, titled with the criterion's statement.

**Things to know before ruling:**
- **Overlap with R-6.15:** a message counts as reaching someone whether they are a blind copy or a visible recipient, as in the sibling tests. This test therefore does not itself demand blind copies; that is R-6.15's job. It also no longer depends on the address being visible.
- **The old application will likely fail it:** the contract's mail notes say the old application sends its ready-for-consensus notice with the whole batch as visible recipients. Recognising those messages needs a search other than the service-address one, and only the caught-message list provides it. If that list returns nothing, this test fails against the old application, and the failure belongs to that application.
- **Unchecked counting rule:** the rule as the criterion states it is not checked from outside. That covers counting against the most recent version's panel and questions, and counting only over the proponents named in the triggering submission. Through the surface a test can only complete the count or leave it short, and leaving it short is R-5.25's subject. I don't treat this as an untested clause. It is how the move is computed, and the observable result is the move and the notice, which this test asserts. Separately testing that a change to the panel changes the count would need a surface action to edit the panel during individual evaluation, and I did not find one.

**What the contract lacks:** no surface action or observation that this criterion needs was missing. Nothing outside `tests/acceptance` was changed or asked to be changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Do these tests follow from the evaluation criteria and nothing else? Approve. The rewritten R-5.27 test does what the redo asked: it no longer finds the notice by searching the visible To line for the chair's and the owner's addresses. It collects every caught message (the caught-message list plus a search on the service's own address), opens each one, and counts the chair (administratorOne) and the owner (staffOne) as told when their address is among the blind copies or the visible recipients. That agrees with R-6.15 and with the approved R-5.31 and R-5.33 tests. Its assertions are the criterion's given/when/then and nothing more: the status names consensus, and both people were reached after the catcher was emptied just before the submission that brings the count to twenty-four. Its title quotes the criterion, and the runner's typecheck passed with no diagnostics. Two clauses of the statement are asserted by no test and have no not-testable entry: counting against the panel and questions of the most recent version, and counting only over the proponents named in the triggering submission. The writer could not assert either because the surface offers no action that would make them observable, not because they were skipped, so they are recorded as owed by contract rather than returned. A weakness I accept: the test does not identify the notice as the ready-for-consensus one, only that a message caught after the triggering submission reached each person. The approved siblings share that limitation. The ruling would change to a return if the surface already offered a way to change the panel or questions, or the set of proponents, during individual evaluation, or if the old application sends the submitting chair some other message on submission that would satisfy this check without the ready notice.

**Conditions:**
- missing-test R-5.27: the count is taken against the panel and the questions of the opportunity's most recent version — owed by contract: a surface action that changes an opportunity's evaluation panel or its questions (publishing a new version) while it is in individual evaluation, so a test can show that the most recent version's panel and questions decide when the move happens
- missing-test R-5.27: the count is taken only over the proponents named in the submission that triggers the check — owed by contract: a surface action or seeded state in which the proponents named in the triggering submission differ from the opportunity's full set of proponents (for example a proposal withdrawn or disqualified between evaluators' submissions), so a test can show that the count is taken over the named proponents only

### Runner-owned typecheck evidence

Proposal revision: `603ecc74d8f58e493d78133662cbba4d52e710cd`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
