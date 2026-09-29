---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I rewrote the test for R-6.2 (notifications) as the ruling asked."
opened: 2026-09-29T07:12:38.025Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
