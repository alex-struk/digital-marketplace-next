---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.1 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-30T04:15:11.391Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.1 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.1 · v3

A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity.

- given: a published opportunity whose proposal deadline has passed
- when: the service next handles any request
- then: the opportunity moves to its program's first evaluation stage with the note "This opportunity has closed.", its submitted proposals move to review, and its author receives a notification
- test: tests/acceptance/opportunities/R-1.1.spec.ts

**A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity. (a Sprint With Us or Team With Us opportunity is announced as ready for evaluation to the evaluators on its panel)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
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

