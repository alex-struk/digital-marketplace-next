| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T07:14:10.278Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised notifications tests now follow from their criteria and from nothing else?

**Recommendation.** I changed one file for the one condition.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed one file for the one condition. Nothing else in `tests/acceptance/notifications/` or `tests/acceptance/not-testable.yaml` was touched.

**Condition 1 (`tests/acceptance/notifications/R-6.2.spec.ts`):** I removed the last assertion in the test, the one that failed if any caught message reached the same person more than once. That check covered every message in the catcher, including the organization invitation used to show delivery is working again. R-6.2 says nothing about mail the triggering action didn't cause.

I also removed the parts that existed only to serve that check:
- the `recipients` field on the per-message record and the line that built it;
- the read of each message's copied recipients, which nothing else used.

I kept the read of visible recipients, because the check that a message is about the published opportunity still uses it. That check passes if a message comes from the service's own sending address.

I cut the last sentence of the file's opening comment, which promised the removed check, so the comment now ends at "no message about the published opportunity may be in the catcher".

Everything else in the test is unchanged:
- delivery is refused for a fixed hold, then the test confirms the fault is still on and the catcher is empty;
- delivery is restored in a `finally`;
- the test checks the published status, a form with no error, and a history with no failed delivery;
- the invitation shows delivery works again;
- the final assertion is that no message about the published opportunity arrived after the restore.

The header keeps its derived date of 2026-09-29, which is today, the date this content changed. The not-testable entry for R-6.2's composition clause ("cannot be composed") is still there as it was: blocked, owned by `contract`.

**Not verified:** I couldn't run the TypeScript compiler, because the session didn't approve the shell commands. Instead I searched the file for leftover uses of the removed names and found none. Every helper still in the file is still used. The runner's own compiler check should confirm the file has no errors before this is ruled on.

The test needed no new surface actions or observations.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised R-6.2 test follows from its criterion and nothing else. Approve. The owed condition is carried out: the final check that no one received a message twice is gone, and so are the per-message recipient collection and the copied-recipient read that served it (a search of the branch file finds neither). The remaining assertions map one to one onto R-6.2's then-clauses. The opportunity shows as published and the form shows no error, so the action succeeded and the person is told it succeeded. The catcher stays empty while the fault is held, so no notice reaches anybody. The history shows no failed delivery, so nothing records a failure for that person. No notice about the opportunity arrives after delivery is restored, so no further attempt is made. The sending address the test compares against comes from the contract's observables, not the implementation. The composition clause is not asserted; it carries a not-testable entry with a real reason (no seeded state or fault makes composition fail) and is already owed by contract as missing-test/R-6.2. The runner's typecheck shows no diagnostics under acceptance/notifications/; its two errors are in adapters/new/, which this proposal does not touch. Two things would change the ruling: a compiler error in this file, or evidence that the invitation is addressed to the service address, which would make the resend check match it and fail wrongly.

**Conditions:**
- condition-met derive-tests-notifications-stale-8#1: tests/acceptance/notifications/R-6.2.spec.ts no longer has the check that no one received a message twice, the per-message recipients field or the copied-recipient read; its final assertion only filters caught messages that are about the published opportunity (aboutOpportunity) and expects none after delivery is restored

### Runner-owned typecheck evidence

Proposal revision: `9ce05471c5d22e2a91f6f23072712c8ee00ae42a`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
