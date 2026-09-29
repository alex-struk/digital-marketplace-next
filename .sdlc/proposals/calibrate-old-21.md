---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.39 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T23:29:24.611Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.39 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location. (by program)** — failed

```
Error: "Seeded closed Sprint With Us opportunity" is listed

Timeout 15000ms exceeded while waiting on the predicate
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

