---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-04T15:19:43.559Z"
cost: 0.886594
turns: 17
session: "035ce96c-6a24-4d56-88e8-1b17f176d384"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I rewrote the test for R-2.36 (v1) in `tests/acceptance/proposals/R-2.36.spec.ts`. It is the only criterion in this run, so one criterion has a test and nothing went to `not-testable.yaml`. I didn't run it, and didn't type-check it either: there is no target here and no TypeScript compiler installed in the workspace.

**What the ruling asked for.** The old test looked for the administrators' withdrawal notice by their address on the visible To line. The new withdrawal test finds that notice through the service's own address, `donotreply@example.test`, which is the sender address named in `observables.yaml`. It opens each message sent there through `surface.caughtMessage` and requires both seeded administrators, `seed.users.administratorOne` and `administratorTwo`, to be on its blind-copy list. As the ruling asked, the vendor's own withdrawal notice is still found by its To line because it has one recipient.

**What changed beyond the ruling.** The old test had two tests: submission and withdrawal. It skipped the award clause because it believed the surface could not carry a proposal as far as an award. It left no `not-testable.yaml` entry for that clause, so a passing run would have counted as the whole criterion met. The seed now has a Code With Us opportunity already in processing, `seed.opportunities.cwuInProcessing`, with two evaluated proposals. `surface.proposalCwuView.awardProposal()` awards one of them directly. So the file now has three tests, one for each act, each titled with the criterion's statement and a suffix naming the act:

- **Submitting:** an administrator publishes an opportunity and the vendor submits a proposal to it. The vendor's confirmation is found by its To line.
- **Awarding:** the administrator awards the organization owner's proposal. The decision notice may go to several people as blind copies, so each proponent's messages are found both by their own address and through the service's address, then opened. A message counts only if that proponent is a visible or blind-copied recipient. The winner must get a notice that reaches no other proponent, and the other proponent must be reached.
- **Withdrawing:** as described above.

**What the tests don't check.** None of them checks message wording, subject lines or links, because the criterion only says who is notified.

**Unchanged from the old test.** In the withdrawal test, `withdrawProposal()` is called on the edit page straight after `submitProposal()`, as the old test did. The ruling didn't question that step, but if submitting does not land the vendor on the edit page, that is the first place to look.

**Missing from the surface.** I found no surface action or observation that I needed and could not reach.

**Outside this stage.** Nothing asked me to change paths outside `tests/acceptance` or `tests/generated`, and I touched none.