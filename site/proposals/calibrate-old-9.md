| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-28T06:42:19.124Z |
| holder | agent:product-owner |

# 9 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-5.1, R-6.1, R-6.5, R-7.17, R-1.27, R-2.29, R-5.29, R-5.37, R-1.55 with a calibration condition, so the next calibrate run can apply it.

9 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming the same person twice is rejected with the rule named, and the opportunity keeps the panel it had)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

```
no result recorded
```

### R-6.5 · v1

Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.

- given: a reader whose mail program shows plain text only
- when: they open any message from the service
- then: they see a readable plain-text rendering carrying the same words and links as the formatted version
- test: tests/acceptance/notifications/R-6.5.spec.ts

**Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.** — failed

```
Error: words of "[TEST] Our Terms and Conditions Have Been Updated" written in its plain text but nowhere in the formatted

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 3[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "updatedthe",[39m
[31m+ ][39m
```

### R-7.17 · v1

A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.

- test: tests/acceptance/content/R-7.17.spec.ts

**the same body renders identically on the page's own address and wherever another screen embeds it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"Formatting marks make these words bold. Raw markup tries to make these words bold and these words emphasised."[39m
Received: [31m"Formatting marks make these words bold. Raw markup tries to make [7m<strong>[27mthese words bold[7m</strong>[27m and [7m<em>[27mthese words emphasised[7m</em>[27m."[39m
```

### R-1.27 · v1

An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.

- given: an awarded opportunity
- when: a visitor who may not see proposal scores views it
- then: the successful proponent's name is shown and their contact details and score are withheld
- test: tests/acceptance/opportunities/R-1.27.spec.ts

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Code With Us: a visitor who may not see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/awarded/[39m
Received string:  [31m"completed"[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Code With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Sprint With Us: a visitor who may not see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/awarded/[39m
Received string:  [31m"completed"[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Sprint With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.29 · v1

After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.

- given: a Sprint With Us opportunity with six proposals scored on its questions, one of them below a question's minimum score
- when: the panel's agreed scores are finalised
- then: the proposal below the minimum is left behind, the remaining five are ranked by their question score and the top four move to the code challenge, while on a Team With Us opportunity the top three move to the challenge
- test: tests/acceptance/proposals/R-2.29.spec.ts

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Sprint With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/code challenge/[39m
Received string:  [31m"team questions score entered | team question scores were entered. q1: 5; q2: 5; q3: 5; q4: 5. | sep 27, 2026 11:29 pm pdt robin placeholder[39m
[31munder review (cc) | — | sep 27, 2026 11:29 pm pdt robin placeholder[39m
[31munder review (tq) | — | aug 29, 2026 11:29 pm pdt system[39m
[31msubmitted | — | aug 18, 2026 11:29 pm pdt blake placeholder[39m
[31mdraft | — | aug 8, 2026 11:29 pm pdt blake placeholder"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Team With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/challenge/[39m
Received string:  [31m"team questions score entered | resource question scores were entered. q1: 5; q2: 5; q3: 5; q4: 5. | sep 27, 2026 11:30 pm pdt robin placeholder[39m
[31munder review (c) | — | sep 27, 2026 11:30 pm pdt robin placeholder[39m
[31munder review (q) | — | aug 29, 2026 11:30 pm pdt system[39m
[31msubmitted | — | aug 18, 2026 11:30 pm pdt blake placeholder[39m
[31mdraft | — | aug 8, 2026 11:30 pm pdt blake placeholder"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-5.29 · v1

Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.

- given: an opportunity in consensus
- when: an evaluator who is not the chair tries to record an agreed score for a proponent, and the chair records a second consensus for a proponent they have already agreed
- then: the evaluator's attempt is refused, and the chair's second attempt is refused as a duplicate
- test: tests/acceptance/evaluation/R-5.29.spec.ts

**only the chair may record the consensus, and only one consensus per proponent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.37 · v1

A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation.

- test: tests/acceptance/evaluation/R-5.37.spec.ts

**A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

### R-1.55 · v1

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.

- test: tests/acceptance/opportunities/R-1.55.spec.ts

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: the same person twice)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: no chair)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: the same person twice)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: no chair)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
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
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: which of the nine calibration failures against old are the application's fault, which the spec's, and which the test's? Ruling: approve with eight conditions. Each was checked against the old source. Five are defects in old. R-5.1 and R-1.55: the service refuses a panel naming the same person twice with a panel-level message, but the panel form's error handler (swu-evaluation-panel.tsx setErrors) maps only per-member user and chair errors, so the panel-level reason never reaches the person; the service also has no check at all for a panel with no chair and relies on the form's separate chair field, and when the no-chair case is forced no reason is named. The criteria are right that a refused panel must say why, so the rebuild owes it. R-5.37: the only guard against a member who is neither evaluator nor chair is the evaluatorOrChair database constraint, with no service-level validation, which is exactly the defect the criterion was written to correct. R-7.17: the content page's own address renders the body with raw HTML enabled (content/view.tsx:118, escapeHtml={false}) while every embedding escapes it, so the same body renders two ways; the criterion's consistency requirement is the right contract. R-6.5: the plain text is generated from the HTML (html-to-text in transport.ts), so it is a rendering as the criterion requires, but the conversion runs words together ('updatedthe'), which breaks 'the same words'; the rebuild must render cleanly. Three are test faults, where old behaves as the criterion says. R-5.29: the service refuses a consensus from a non-chair (createTWUResourceQuestionResponseConsensus requires the chair) and refuses a second one for the same proposal, but the test reads only whether a form is offered and demands a message the criterion never promises. R-2.29: the carried proposals' histories record the move to the next stage under a shortened label, and the test required the literal words 'code challenge'. R-1.27: the old app deliberately shows the public a generic label for an awarded opportunity, and the test used the word 'awarded' as its precondition; it also required the score and contact details on the opportunity's own page, while the criterion does not say where permitted readers see them and old shows them where the proposal is read. R-6.1 is deliberately left unruled. The oracle was never started with notifications disabled, so no result exists and none of the three verbs is true of it; any verb would put a falsehood on the record. It is unblocked by starting an oracle copy with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 and exporting that setting to the test run, not by a product ruling. What would change this ruling: evidence that old names the panel refusal reasons somewhere the person can see them (R-5.1, R-1.55 would become test-wrong), or evidence that permitted readers never see the successful proponent's contact details anywhere (R-1.27 would become spec-wrong).

**Conditions:**
- defect-in-old R-5.1
- defect-in-old R-1.55
- defect-in-old R-5.37
- defect-in-old R-7.17
- defect-in-old R-6.5
- test-wrong R-5.29: the test reads whether the evaluator who is not the chair is offered somewhere to record a consensus, but the criterion says that person's attempt is refused, not that nothing is offered; have that evaluator make the attempt and establish afterwards that no consensus of theirs was recorded for the proponent. The criterion promises no message for the chair's second attempt either, and the chair may change the consensus they already agreed, so count the chair's second attempt as refused when exactly one consensus exists for that proponent afterwards, whether or not a notice is shown
- test-wrong R-2.29: the criterion names a stage, not the words shown for it; the test required the literal words 'code challenge' or 'challenge' in each proposal's history, but the history can record the move under a shortened label, so carried proposals read as left behind and a missing word proves nothing for the proposals left behind; establish from each proposal's history whether a new stage was entered after finalising, not whether a particular label appears
- test-wrong R-1.27: the test takes the word 'awarded' in the status a visitor sees as proof of the award, but the criterion names the award, not a label, and a visitor may be shown a different word for the same state; establish the award from the successful proponent being named. For the reader permitted to see scores, the test looks for the contact details and score only on the opportunity's own page, but the criterion does not say where they are shown; read them wherever that reader is shown the successful proposal, and keep checking that a visitor is shown neither anywhere they can reach
