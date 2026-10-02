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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the rewritten R-6.17 test follows from R-6.17 and nothing else. I approve it. It fixes what the last test-overreaches condition named. It no longer counts every message to the deactivated address after clearing the catcher. It counts only messages whose subject or bodies name the watched opportunity, so the deactivation and reactivation notices that R-4.30 requires are left out whenever they arrive, as that condition allowed. This narrowing cannot hide a leak. A notice to a group is a single message with the watchers blind-copied, so the active watcher's notice passing the filter proves that the same message is the one checked for the deactivated account. Every assertion comes from the criterion: the active watcher is notified (a positive control); the deactivated watcher is not among the visible or blind-copied recipients of a notice about the opportunity, for both an edit and an addendum; and after reactivation the next addendum reaches that account although nobody asked to watch again, which shows the watch was kept. No selector, route, status or table leaks in. Only tests/acceptance changed, and the runner's typecheck passed with no diagnostics. One clause is asserted only in part. 'No notification of any kind' is checked only through notices about the watched opportunity. The earlier ruling held that using another kind of notice, an organization invitation, was overreach, and the organization screens do not exist on the new build. So the writer cannot assert another kind until the contract names one that reaches a vendor account and that the surface can trigger. I keep that clause owed below instead of returning. The open build-slice-9-3#6 is not touched by this proposal and stays open. What would change the ruling: evidence that notices about the opportunity do not name its title, which would make the filter judge nothing; or a contracted second notification kind the surface already exposes, which would make the partial clause a return.

**Conditions:**
- missing-test R-6.17: a deactivated account receives no notification of any kind beyond notices about an opportunity it was watching — owed by contract: name at least one other kind of notification an active vendor account receives, and a surface action that triggers it without the organization screens, so that its absence for a deactivated account can be asserted

### Runner-owned typecheck evidence

Proposal revision: `492a311df1df2471f29ee6fdef6062f8fb2c5b65`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    No diagnostics.
