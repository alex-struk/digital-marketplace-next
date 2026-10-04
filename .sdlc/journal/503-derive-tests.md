---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-04T15:21:47.412Z"
cost: 0.4547156
turns: 8
session: "4fab4793-8e57-4b75-8fe3-6e93871b339c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

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