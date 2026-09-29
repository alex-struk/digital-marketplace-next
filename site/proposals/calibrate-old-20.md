| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-29T17:11:39.956Z |
| holder | agent:product-owner |

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

**The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location. (by state)** — failed

```
Error: Timeout 15000ms exceeded while waiting on the predicate
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

The question is whether R-1.39's by-state failure against the old target is the application's fault, the spec's, or the test's. Ruling: approve, with test-wrong. The old list page offers government users and administrators a status chooser with Draft, Under Review, Published, Evaluation and Awarded (list.tsx:60-66, 662-675). Its filter removes every opportunity whose status does not match the chosen one (list.tsx:329-333, 346-387), and it applies the same filter to the Unpublished, Open and Closed groups alike (list.tsx:389-409). Drafts are always placed in the Unpublished group (list.tsx:165-189). No other reading of that code is possible, so the old application does narrow by state and defect-in-old would wrongly make a working behaviour the rebuild's obligation. The criterion's statement matches the code, so spec-wrong does not apply either. The failure is a bare predicate timeout that names no assertion. The reviewer's triage (calibrate-triage-old-29) left two causes open: the draft was never stored, or the list does not narrow. The source rules out the second, so the fault lies in the test's setup or reading. The test never establishes that the draft it saves is present and readable before it filters, and it folds the check that something remains and the check that something is gone into one wait, so a missing draft looks like a list that does not narrow. What would change this ruling: suppose a rewritten test shows the draft present before filtering, and the draft-only view still never shows it. Then the fault is in the adapter's reading of the list, and it goes to the reviewer as adapter-wrong, not back to this seat. A run where the draft is visibly present and the list demonstrably fails to narrow on a chosen status would make this defect-in-old.

**Conditions:**
- test-wrong R-1.39: the by-state case never checks that the draft it saves actually appears in the list before a state is chosen, so a draft that was not stored or could not be read looks the same as a list that does not narrow. Before filtering, confirm that both the saved draft and the published opportunity can be seen. Then check that the wanted opportunity remains, and separately that the other one is gone, after each state is chosen, so a failure says which half did not hold.
