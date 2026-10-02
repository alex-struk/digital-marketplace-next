| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T16:37:02.686Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** It is now covered entirely by tests, and nothing about it remains in `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've finished R-6.17, the one criterion in scope. It is now covered entirely by tests, and nothing about it remains in `tests/acceptance/not-testable.yaml`. I couldn't run the type checker or the tests here, because the shell refused both without approval. Nothing has been run against a target yet.

**What I found.** `tests/acceptance/notifications/R-6.17.spec.ts` already existed from an earlier derivation, and the yaml had no entry for R-6.17 left to remove. That file had three tests, all about one kind of notice: the one sent to people watching an opportunity. Two checked that a deactivated watcher gets nothing when the opportunity is changed or given an addendum. They read the blind-copy lists too, and use an active watcher to show the catcher is reachable. The third checked that reactivating the account brings the watch back. None of them showed that "no notification of any kind" covers anything beyond watch notices, and that was the part handed back as owed.

**What I added.** The contract has since added `email.received_by_an_active_vendor` to `observables.yaml`, and I used it for a fourth test in the same file, titled with the criterion's statement and suffixed "a new opportunity is announced":
- An administrator (`persona.administrator`) publishes `seed.opportunities.draftOfOtherStaff` through `surface.opportunityCwuEdit.publish()`.
- The test collects every caught message whose subject contains "A New Code With Us Opportunity Has Been Posted", found through `caughtMessageList` and `mail.messagesTo`, and opens each with `caughtMessage`.
- It reads both the visible and the blind-copy recipients of each.
- It waits until `seed.users.vendorOne` (active, has asked for these notices) appears, which proves the announcement went out. It then checks that `seed.users.vendorDeactivated` appears on none of them.

**Why that seeded account.** `vendorDeactivated` has asked for these notices and is already deactivated in the seed, so the test never deactivates anyone. That means the account's own deactivation notice can't get mixed into the result. I left the other three tests and the file's header lines as they were, and added a comment explaining the new test.

**Gaps.** For this criterion I needed no action or observation the surface lacks, so the contract has nothing more to add. I changed nothing outside `tests/acceptance/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-6.17 tests follow from the criterion and nothing else? Approve. The added test covers the clause the earlier ruling left owed (no notification of any kind beyond watch notices) using one other kind of notification, which is what that ruling asked for. The subject text, the trigger (an administrator publishing seed.opportunities.draftOfOtherStaff through opportunity-cwu-edit.publish) and the recipient rule are all taken from email.received_by_an_active_vendor in spec/contract/observables.yaml. The seed has users.vendorDeactivated with the setting on and already deactivated, so no deactivation notice can get mixed in, and the active control users.vendorOne proves the announcement was sent and the catcher is reachable. The test checks both visible and blind-copied recipients, and no route, selector, status code or table name appears. The runner's typecheck passed and the diff touches only tests/acceptance. The three existing tests are unchanged. missing-test/R-6.17 stays open until this test runs, which a ruling cannot settle. build-slice-9-3#6 is unrelated to this proposal and stays open. What would change the ruling: a first run in which the announcement never reaches vendorOne, which would mean the test cannot show the deactivated account was excluded.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `ea53bbf9be919869e9509e3aab35078935cd2906`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    No diagnostics.
