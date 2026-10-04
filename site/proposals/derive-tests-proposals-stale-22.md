| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T22:49:22.646Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote the test for the one criterion in this run, R-2.36 v1, at `tests/acceptance/proposals/R-2.36.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for the one criterion in this run, R-2.36 v1, at `tests/acceptance/proposals/R-2.36.spec.ts`. It is the only criterion listed, so one of one has a test, and nothing went into `not-testable.yaml`. I couldn't run a type-check because the command needed an approval this session can't give, so the file has only been checked by reading.

**The fix.** The ruling said the withdrawal test only counted administrators who appeared as blind copies on messages addressed to the service's own address, so a notice that reached an administrator any other way was missed. That check is gone. Each administrator (`seed.users.administratorOne` and `seed.users.administratorTwo`, the only two the seed defines) and the vendor must now each be reached by at least one caught message, as either a visible or a blind-copied recipient. I removed the special case that found the vendor's notice only by its To line for the same reason: the criterion says who the notice reaches, not how it is addressed.

**Finding the messages.** I widened the shared helper that decides whether a message reached someone. It now gathers candidates from three places: every message in the catcher's listing (`surface.caughtMessageList.messageIdentifiers()`), messages found by the person's own address, and messages found by the service's address. It opens each one with `surface.caughtMessage` and keeps it only if the person appears in `visibleRecipients()` or `copiedRecipients()`. Including the full listing means a notice is counted however it was addressed. The ruling pointed to the awarding case as the model, and that case now uses the same helper, as does the submitting case.

**What each test asserts.** There are still three tests, one for each act the criterion names, and each is titled with the criterion's own statement:
- **Submitting:** a message reaches the submitting vendor.
- **Awarding:** a notice reaches the winner and none of the other proponents, and every other proponent is reached.
- **Withdrawing:** the vendor and every administrator are each reached.

None of them asserts anything about addressing, subject or content, because the criterion states none of that.

I needed no surface actions or observations that the contract doesn't already provide, and I changed nothing outside `tests/acceptance/`.

## Ruling

**Verdict:** approve
**By:** runner:checks

Approved by the runner's checks, which policy.gates.G3.auto_approve lets settle derive-tests proposals: the acceptance typecheck of 6ee673cfd5 is clean; no condition is open against it; no escalation stands on it; no test file was deleted, no changed test asserts less than before and no new test asserts nothing.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `6ee673cfd5c5d771c02fb8693d780975e4329911`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
