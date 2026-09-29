---
gate: G1
question: "2 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-6.1, R-3.24 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T11:13:13.173Z
---

# 2 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-3.24 with a calibration condition, so the next calibrate run can apply it.

2 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

**When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.** — failed

```
Error: messages sent with notifications switched off

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m11[39m
```

### R-3.24 · v1

When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.

- given: an active organization owned by a vendor
- when: an administrator archives it
- then: the owner receives a message telling them their organization has been archived by an administrator and that they can no longer use it, and no such message is sent when the owner archives their own organization
- test: tests/acceptance/organizations/R-3.24.spec.ts

**when an administrator archives an organization they do not own, its owner receives a message telling them it has been archived** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: which of R-6.1 and R-3.24, failing against old, are the application's fault, the spec's, or the test's? Ruling: approve with one condition, test-wrong R-3.24. R-6.1 is left unruled because none of the three forms is true of it. R-3.24: the old application does send the notice. The archive route notifies the owner whenever the person archiving is not the owner (sources/old/src/back-end/lib/resources/organization.ts:691-699), with the subject 'Your Organization Has Been Archived' (lib/mailer/notifications/organization.tsx:32). The same test file passed against the same old commit in 16 earlier results under tests/results/old/, several of them on 2026-09-29. A one-off miss on unchanged code is a timing failure in the test, not a product fact. The test reads the owner's mailbox exactly once, the instant the archive action returns (mail.messagesTo does a single lookup with no wait), so a message that arrives moments later is recorded as never sent. R-6.1: the old application honours the switch, because makeSend returns before sending anything when DISABLE_NOTIFICATIONS is set (sources/old/src/back-end/lib/mailer/transport.ts:54). The criterion is accurate and the test is correct as written for its tagged configuration (@notifications_disabled). Its 11 caught messages show it again ran against the default instance with notifications on, contrary to spec/contract/observables.yaml configurations.notifications_disabled, which says the default run must exclude it (--grep-invert). This is a harness fault that must be fixed in the calibrate stage. It needs a separate oracle instance started with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 that runs only the tagged test, and the default run must leave the test out. That second half matters beyond R-6.1: the test clears the shared mail catcher, so running it on the shared instance with four parallel workers can delete other tests' messages, and is a plausible contributor to R-3.24's lost message. What would change this ruling: if R-3.24 still fails after its test polls with a settling window on a catcher no other test clears, the next ruling on it is defect-in-old. If R-6.1 fails when run against a genuinely notifications-off instance, it becomes defect-in-old, and the transport.ts:54 reading would need re-examining.

**Conditions:**
- test-wrong R-3.24: the test reads the owner's mailbox once, immediately after the archive action returns, with no allowance for delivery time, so a notice that arrives a moment later is counted as never sent; it should wait for the message to arrive within a settling window (as the other mail tests do) before asserting that at least one message mentions archiving, and the negative case should likewise wait out the same window before asserting nothing arrived
