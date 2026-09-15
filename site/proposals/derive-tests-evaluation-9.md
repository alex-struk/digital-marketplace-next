| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T02:10:21.592Z |
| holder | agent:reviewer |

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** I fixed the R-5.22 test in `tests/acceptance/evaluation/R-5.22.spec.ts` for all three conditions.

I fixed the R-5.22 test in `tests/acceptance/evaluation/R-5.22.spec.ts` for all three conditions. Nothing else in the workspace changed. I couldn't run a typecheck: the workspace has a `tests/tsconfig.json` but no TypeScript compiler or `node_modules`. The file only uses types the returned version already passed with, but the runner's typecheck still needs to confirm it.

**Condition 1: wait for each rejection.** All four tests now retry the error read until it shows up or a 15-second wait runs out. They use `expect.poll`, as `tests/acceptance/content/R-7.20.spec.ts` does. The wait time is one shared constant, `settle`. Afterwards, no immediate `expect(await …)` read was left in the file. The things the tests check are unchanged: `scoreOutOfRangeError()` for a score of six and `emptyNotesError()` for an empty comment, on both the Sprint With Us and Team With Us individual create pages.

**Condition 2: fill the comment, then clear it.** In both empty-comment tests the comment for question 0 is first set to "A full answer to the first question." and then set to "", so it really changes to empty before the error is read. The score of four is still entered first, so the comment is the only thing wrong. I added a short note to the file's opening comment explaining why each read waits and why the comment is filled before it is cleared.

**Condition 3: keep the R-5.22 entry in `tests/acceptance/redo.yaml`.** The entry is still there, because the workspace started from the last approved version, not the returned proposal. I left the file untouched.

Everything else stays as it was:
- **Header:** I left both header lines as they were, including the "derived 2026-09-15" date. This is a repair to what was written against that spec version, not a new derivation, and I wasn't given a new header.
- **Other files:** no other file under `tests/acceptance/evaluation/` changed. R-5.22 has no entry in `tests/acceptance/not-testable.yaml`, and that file is unchanged.

The two parts of the criterion that still aren't tested are the same, and the file's comments still explain them:
- **Too many decimal places:** no observation on either individual create page reports a score with too many decimal places. Something like `scoreTooManyDecimalPlacesError` would reach it.
- **Submitting an incomplete evaluation:** no action saves a draft the form refuses, which is the same gap recorded for R-5.23.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised R-5.22 tests follow from their criterion and from nothing else, and do they meet the three conditions from derive-tests-evaluation-stale-1? Ruling: approve. Against the returned version (075c1f7), the only changes to tests/acceptance/evaluation/R-5.22.spec.ts are the requested fixes. First, all four tests now read the rejection with expect.poll and a shared 15-second timeout instead of one immediate read. Second, both empty-comment tests enter 'A full answer to the first question.' before setting the comment to '', so the comment really changes to empty, and the score of 4 still makes the comment the only thing wrong. The assertions are unchanged and follow from the criterion's example: scoreOutOfRangeError after six on a five-point question, and emptyNotesError after an empty comment, on both the Sprint With Us and Team With Us individual create pages. Nothing about how the app is built leaks in. The two untested parts still name real gaps: no observation reports a score with too many decimal places, and no action saves a draft the form refuses, the same gap recorded for R-5.23. Third, the branch leaves tests/acceptance/redo.yaml alone and the R-5.22 entry is still there, so the calibration can confirm the redo's reason is met. The runner's typecheck passed with no diagnostics under acceptance/evaluation/. One inaccuracy: the writer says tests/acceptance/not-testable.yaml is unchanged, but the proposal commit rewrote it. Sorting both versions gives identical lines: the R-5.11, R-5.21, R-5.23, R-5.26, R-5.34 and R-5.37 entries moved to the end of the file with no text changed, so it changes nothing and is not a reason to return. No protected path is touched, the tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change the ruling: finding that not-testable.yaml changed more than its order, or a test asserting something the criterion does not state.

**Conditions:**
- Not the writer's: the not-testable.yaml change in this commit only reorders entries (the six evaluation entries moved to the end, no text changed). Whoever owns the proposal tooling should find out why the file was rewritten when the writer reports leaving it alone, so later diffs don't carry reorders that change nothing.

### Runner-owned typecheck evidence

Proposal revision: `2043f7fae5f4979525907aa5245b16ed43862806`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
