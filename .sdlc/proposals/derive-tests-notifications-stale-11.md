---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I rewrote one test this run, for the one criterion listed: `tests/acceptance/notifications/R-6.17.spec.ts`."
opened: 2026-10-02T14:35:58.357Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I rewrote one test this run, for the one criterion listed: `tests/acceptance/notifications/R-6.17.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote one test this run, for the one criterion listed: `tests/acceptance/notifications/R-6.17.spec.ts`. The ruling said the earlier version was wrong. I couldn't type-check or run it, because the compiler command needed an approval that never came.

**What was wrong.** The old test cleared the mail catcher straight after deactivating the account, then counted every message sent to the deactivated address. R-4.30 says deactivating someone's account sends them a notice, and that notice can reach the catcher after the screen has already answered. If it arrived after the clear, the old test counted it as a leak. The reactivation test had the same flaw the other way round: a late notice about the reactivation could have made it pass when the watch had not actually come back.

**What the new test does.** It leaves that notice out rather than waiting for it. A message only counts if its subject, plain-text body or formatted body names the watched opportunity, which here is the seeded published Code With Us opportunity. For each such message the test reads both the visible recipients and the blind copies. The deactivation and reactivation notices don't name the opportunity, so it no longer matters when they land. The test also doesn't depend on the deactivation notice ever arriving, since that is R-4.30's business, not R-6.17's.

The set-up is unchanged. Two vendors watch the opportunity, then an administrator deactivates one of them; the other stays active. There are three tests:
- **Opportunity changed:** the active watcher receives a notice about it (which also shows the catcher is working), and the deactivated account appears nowhere among that notice's recipients, visible or blind-copied.
- **Addendum added:** the same check.
- **Account reactivated:** after reactivation, the next addendum's notice reaches that account even though nobody asked to watch again. That is how the test shows the watch was kept.

**Coverage and gaps.** No criterion was found untestable, and nothing was added to `not-testable.yaml`. The surface already had everything needed: watching an opportunity, deactivating and reactivating an account, editing and adding an addendum, and reading a caught message's subject, bodies and both recipient lists. I found no missing surface action or observation.

The test checks the "no notification of any kind" clause only through notices about the watched opportunity, which is what this ruling and the earlier one asked for. I did not add a partial-clause entry for other kinds of message, because the earlier ruling treated a test of another kind (an organization invitation) as overreach. Whoever rules this should decide whether "of any kind" needs its own entry.

I changed no file outside `tests/acceptance`.
