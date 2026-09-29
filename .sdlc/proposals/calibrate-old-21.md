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


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether R-1.39's by-program failure against the old target, a timeout waiting for the seeded closed Sprint With Us opportunity to be listed, is the application's fault, the spec's, or the test's. Ruling: approve, with test-wrong. The old list page offers a program chooser with Code With Us, Sprint With Us and Team With Us (list.tsx:224-228). Its filter drops only opportunities whose program differs from the one chosen (list.tsx:323-325), and it applies that filter the same way to the Unpublished, Open and Closed groups (list.tsx:389-410). So choosing Sprint With Us keeps a closed Sprint With Us opportunity. The code allows no other reading, which rules out defect-in-old. The criterion describes this behaviour accurately, which rules out spec-wrong. The reviewer's triage (calibrate-triage-old-30) already showed that the adapter can read this seeded title from the Closed group, because R-1.38 reads it there and passed in the same run. What is left is how the case is built. It is the only R-1.39 case that relies on an opportunity it did not put in place itself: one shared with every other test running at the same time, which sits in a group the page keeps folded by default. And its failure message does not say which step failed, so a missing opportunity before filtering looks the same as a list that did not narrow after Sprint With Us was chosen. My last ruling on this criterion (calibrate-old-20) found the same weakness in the by-state case. What would change this ruling: suppose a rewritten case confirms both opportunities are listed before filtering, and the Sprint With Us one then disappears once Sprint With Us is chosen. The fault is then in how the adapter reads the list after filtering, and it goes to the reviewer as adapter-wrong. A correctly read list that still leaves out a matching Sprint With Us opportunity would make this defect-in-old.

**Conditions:**
- test-wrong R-1.39: the by-program case relies on a closed Sprint With Us opportunity that exists before the test starts and that other tests share, instead of opportunities it puts in place and can vouch for itself, and its failure message does not say whether the opportunity was missing before any program was chosen or disappeared after Sprint With Us was chosen. Compare opportunities in two programs whose presence the case establishes itself. Confirm each one is listed before choosing a program. Then, after each program is chosen, check separately that the matching opportunity remains and that the other one is gone, and have each check's message name the program chosen and which half failed.
