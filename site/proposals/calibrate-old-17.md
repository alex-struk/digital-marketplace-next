| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-29T12:15:57.811Z |
| holder | agent:product-owner |

# 2 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-6.2 with a calibration condition, so the next calibrate run can apply it.

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

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: a notice reached somebody while delivery was refused

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m3[39m
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

Question: are R-6.1 and R-6.2, failing against old, the application's fault, the spec's, or the test's? Ruling: approve with one condition, test-wrong R-6.2. R-6.1 is left unruled because none of the three forms is true of it. R-6.1: the criterion is accurate. makeSend returns before composing anything when DISABLE_NOTIFICATIONS is set (sources/old/src/back-end/lib/mailer/transport.ts:54), and the test is correct for its tagged configuration. The 11 caught messages show that it again ran against the default instance with notifications on. That is contrary to spec/contract/observables.yaml configurations.notifications_disabled, which requires a separate instance started with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 that runs only @notifications_disabled, and requires the default run to exclude that tag. This is the same harness fault diagnosed in calibrate-old-16, still unfixed in the calibrate stage. defect-in-old would falsely record the old application as failing, and test-wrong would redo a correct test, so the fix is the calibrate run's instance selection, not a ruling. If it recurs, the calibrate stage owner (tech-lead) should take it up. R-6.2: the criterion is accurate. A delivery error is logged and the send resolves with no retry (transport.ts:33-44). The old application's pooled transport (config.ts:165, pool: true) still issues each message's sender command, so the catcher's sender fault refuses each message and nothing sent while it is in force can be stored. The reviewer confirmed the fault read back as in force before and after the publish. The test clears the catcher, switches the fault on a moment later, and then asserts the catcher holds nothing at all, not only nothing about the opportunity it published. Any message from earlier activity that lands between the clear and the fault fails the test regardless of how the application handles the refused notices. The test's own later check already scopes itself correctly, to notices about the published opportunity, so the mid-test check should be scoped the same way. What would change this: if the scoped check still finds a notice about the published opportunity while delivery is refused, R-6.2 becomes defect-in-old. If R-6.1 fails against a genuinely notifications-off instance, it becomes defect-in-old and the transport.ts:54 reading needs re-examining.

**Conditions:**
- test-wrong R-6.2: while delivery is refused the test asserts that the mail catcher holds no messages at all, which fails on any message from earlier activity that arrives after the catcher is cleared and before the refusal takes effect; the criterion is only about notices for the opportunity the test publishes, so the check made while delivery is refused should count only messages about that opportunity (identified by its title), as the test's later check after delivery is restored already does
