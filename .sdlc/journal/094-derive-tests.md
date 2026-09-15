---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-15T02:10:21.576Z"
cost: 0.6145955
turns: 14
session: "fe4f9045-d1b1-445a-8a74-2411d7f000fd"
---

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