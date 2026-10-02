---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-02T16:37:02.646Z"
cost: 0.6340716
turns: 18
session: "063c2601-00be-4fb9-b263-23fcd518440b"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've finished R-6.17, the one criterion in scope. It is now covered entirely by tests, and nothing about it remains in `tests/acceptance/not-testable.yaml`. I couldn't run the type checker or the tests here, because the shell refused both without approval. Nothing has been run against a target yet.

**What I found.** `tests/acceptance/notifications/R-6.17.spec.ts` already existed from an earlier derivation, and the yaml had no entry for R-6.17 left to remove. That file had three tests, all about one kind of notice: the one sent to people watching an opportunity. Two checked that a deactivated watcher gets nothing when the opportunity is changed or given an addendum. They read the blind-copy lists too, and use an active watcher to show the catcher is reachable. The third checked that reactivating the account brings the watch back. None of them showed that "no notification of any kind" covers anything beyond watch notices, and that was the part handed back as owed.

**What I added.** The contract has since added `email.received_by_an_active_vendor` to `observables.yaml`, and I used it for a fourth test in the same file, titled with the criterion's statement and suffixed "a new opportunity is announced":
- An administrator (`persona.administrator`) publishes `seed.opportunities.draftOfOtherStaff` through `surface.opportunityCwuEdit.publish()`.
- The test collects every caught message whose subject contains "A New Code With Us Opportunity Has Been Posted", found through `caughtMessageList` and `mail.messagesTo`, and opens each with `caughtMessage`.
- It reads both the visible and the blind-copy recipients of each.
- It waits until `seed.users.vendorOne` (active, has asked for these notices) appears, which proves the announcement went out. It then checks that `seed.users.vendorDeactivated` appears on none of them.

**Why that seeded account.** `vendorDeactivated` has asked for these notices and is already deactivated in the seed, so the test never deactivates anyone. That means the account's own deactivation notice can't get mixed into the result. I left the other three tests and the file's header lines as they were, and added a comment explaining the new test.

**Gaps.** For this criterion I needed no action or observation the surface lacks, so the contract has nothing more to add. I changed nothing outside `tests/acceptance/`.