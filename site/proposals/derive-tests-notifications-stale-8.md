| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T07:12:38.025Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I rewrote the test for R-6.2 (notifications) as the ruling asked.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for R-6.2 (notifications) as the ruling asked. It is the only criterion in this run, so one criterion has a test. I also added one entry to `not-testable.yaml` for the part of it the contract cannot reach. Nothing was run or type-checked: `tests/` has no `node_modules`, so the file has not been checked by the compiler, and I could not run a YAML check on the new entry either.

**What the ruling found.** The old test restored mail delivery without first showing that the announcements had already been tried and refused. It then treated anything else in the mail catcher as a repeat. A notice still waiting for its first try when delivery came back would arrive once, and that is not a repeat.

**How the new test answers it** (`tests/acceptance/notifications/R-6.2.spec.ts`), in order:

1. **Refuse and publish.** The catcher starts refusing all mail. An administrator publishes a Code With Us opportunity, which should announce it to everyone who asked for new-opportunity notices.
2. **Hold before restoring.** The refusal stays on for 20 seconds after the publish is answered. The test then checks the refusal is still on and that the catcher holds nothing, which is the "no notice reaches anybody" part. The service opens a fresh connection for each message and a refusal ends it straight away, so every announcement should have been tried and refused inside that window.
3. **Restore, in a `finally`**, so the refusal is lifted whether the test passes or fails.
4. **Check the publish.** The opportunity reads as published, the form showed no error, and its history records no failed delivery.
5. **Show mail works again.** An organization owner invites a vendor to their organization. The test waits for that invitation to arrive, then waits 10 more seconds.
6. **Final checks.** Every caught message is read in full:
   - None may be about the published opportunity. Because all of them had already been refused, one arriving now was sent again.
   - No one may receive the same message twice.
   - The test does not require the catcher to hold only the invitation. Unrelated mail does not fail it.

**One limit.** No surface reports how many deliveries the catcher refused, so "every announcement has been tried" rests on the fixed 20-second hold, not on anything the test can observe. An observation on `mail-delivery-fault` giving the number of refused attempts would let the test wait for that count to stop changing instead of waiting a fixed time.

**The part without a test.** The new entry names the clause "When a message cannot be composed". It is marked `blocked:` and owned by `contract`. No seeded record and no fault-injecting surface creates a message the service cannot compose, so only the delivery half can be tested. To reach it, the contract would need to supply a seeded record, with a handle, that makes one named notice fail to render, plus the existing action that triggers that notice. If no such state can exist, ratify should restate the clause in terms something can observe.

**Surface pieces the contract lacks:**
- a starting state in which a message cannot be composed;
- an observation of how many delivery attempts the catcher has refused.

I made no changes outside `tests/acceptance`, and nothing asked me to.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-6.2 tests follow from the criterion and from nothing else? Ruling: return. The rewrite fixes the problem the previous ruling raised. Delivery stays refused for a fixed hold after the publish is answered, and the test checks the fault is still on and the catcher is empty before restoring. After the restore it fails on any message about the published opportunity. The published status, the form with no error and the history with no failed delivery answer the remaining 'then' clauses. The composition clause is recorded in not-testable.yaml as blocked, owned by contract, and that reason is real. The runner's compiler check reports no errors in acceptance/notifications. But the test's last block fails when any caught message reached one person twice. Any message about the opportunity already fails the check before it, so this block only ever judges unrelated mail, such as the organization invitation used to show delivery is working again. It asserts something R-6.2 does not say: a duplicated invitation would fail this criterion. It also contradicts the proposal's own statement that unrelated mail does not fail the test. Removing that block, and the 'recipients' field kept only to serve it, would change the ruling to approve.

**Conditions:**
- tests/acceptance/notifications/R-6.2.spec.ts: remove the final assertion that no message reached the same person more than once, which checks every caught message including the organization invitation. R-6.2 says nothing about mail unrelated to the triggering action, and any notice about the published opportunity is already caught by the check before it. Keep only the assertion that no message about the published opportunity arrives after delivery is restored, and drop the per-message recipient collection if nothing else uses it.

### Runner-owned typecheck evidence

Proposal revision: `da71f2ad813a92a8f08d058d2030b4e3298d5dc4`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
