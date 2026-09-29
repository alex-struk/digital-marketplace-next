---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T07:14:10.242Z"
cost: 0.2782904
turns: 11
session: "3924ec0f-6849-4ca5-8bd0-81d45f2bb6d4"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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