---
gate: G1
question: "8 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-8.1, R-7.18, R-8.18, R-6.19, R-5.20, R-6.23, R-6.27, R-6.28 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-14T19:28:22.765Z
---

# 8 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-8.1, R-7.18, R-8.18, R-6.19, R-5.20, R-6.23, R-6.27, R-6.28 with a calibration condition, so the next calibrate run can apply it.

8 criterion(s) failed against the **old** target at http://localhost:3000, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-8.1 · v1

Any person who is signed in may upload a file, and a visitor who is not signed in cannot.

- given: a visitor who is not signed in
- when: they submit a file for upload
- then: the upload is refused as not permitted and no file is stored
- test: tests/acceptance/files/R-8.1.spec.ts

**any person who is signed in may upload a file** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.18 · v1

The service level agreement page is one the service creates for itself, so every screen that links to it — the learn-more index, the program cards, and the Code With Us, Sprint With Us and Team With Us opportunity forms — resolves on a fresh installation.

- test: tests/acceptance/content/R-7.18.spec.ts

**the service level agreement page is one the service creates for itself** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.18 · v1

A submission carrying no file part, or read-access information that is not well-formed, is refused as a bad request naming what was wrong with it, and is not recorded in the service's error log as a fault of the service; any working copy already written is removed whether the upload succeeds or fails.

- test: tests/acceptance/files/R-8.18.spec.ts

**a submission carrying no file part is refused as a bad request rather than as a fault of the service** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"500 No file uploaded"[39m
```

**a submission carrying read-access information that is not well-formed is refused as a bad request naming what was wrong with it, rather than as a fault of the service** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"500 Invalid `metadata` field."[39m
```

### R-6.19 · v1

The administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it.

- test: tests/acceptance/notifications/R-6.19.spec.ts

**the administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"evaluation panel"[39m
Received string:    [31m"account registered[39m
[31mterms & conditions updated[39m
[31muser invited to join team[39m
[31man organization invites someone who has not registered[39m
[31muser account deactivated[39m
[31muser account reactivated[39m
[31muser approved request to join organization[39m
[31muser rejected request to join organization[39m
[31muser leaves an organization[39m
[31mcwu opportunity published[39m
[31mcwu opportunity updated[39m
[31mcwu opportunity cancelled[39m
[31mcwu opportunity ready for evaluation[39m
[31mcwu proposal submitted[39m
[31mcwu proposal awarded[39m
[31mcwu proposal withdrawn[39m
[31mswu opportunity published[39m
… 66 more line(s)
```

### R-5.20 · v1

When an opportunity closes it enters individual question evaluation, and every evaluator on its panel is told it is ready to evaluate.

- given: a published opportunity with a panel of two evaluators and a separate chair, and submitted proposals against it
- when: its proposal deadline passes
- then: the opportunity moves to individual question evaluation and the two evaluators are notified, while the chair who is not an evaluator is not
- test: tests/acceptance/evaluation/R-5.20.spec.ts

**when an opportunity closes it enters individual question evaluation and its evaluators are told** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-6.23 · v1

An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.

- given: an administrator on the page holding the service's terms and conditions, and a mix of active and deactivated vendors who had all accepted the previous terms
- when: the administrator chooses to notify vendors and confirms
- then: every vendor's acceptance is withdrawn and each active vendor receives a message naming the change and offering a link to read and accept the new terms
- test: tests/acceptance/notifications/R-6.23.spec.ts

**an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-6.27 · v1

The choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop.

- test: tests/acceptance/notifications/R-6.27.spec.ts

**the choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-6.28 · v1

The service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach.

- test: tests/acceptance/notifications/R-6.28.spec.ts

**the service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
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

