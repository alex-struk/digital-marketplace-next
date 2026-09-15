---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-15T02:07:22.133Z"
cost: 0.9621934999999999
turns: 24
session: "0713c0d3-3008-45fe-9851-854f192487e0"
---

I rewrote the test for R-5.22 in `tests/acceptance/evaluation/R-5.22.spec.ts`, so the one criterion I was given has a test and no `not-testable.yaml` entry. The test covers two of the criterion's three examples, a score of six and an empty comment. Nothing has been run or type-checked: `tests/` has no installed dependencies, so there is no TypeScript compiler available.

**What the file does.** The criterion is about an evaluator scoring a proponent on a question worth five points. It's rejected if they enter six, enter a score with three decimal places, or leave the comment empty, and the evaluation can't be submitted until every question has a score in range and a comment. The seed makes every question on both closed opportunities worth five points, so six works exactly as the criterion says. The evaluator is the seeded staff user who sits on both evaluation panels, reached through `persona.publicSectorStaff`. I didn't use `persona.evaluationPanelEvaluator`: on the rebuilt target that persona is a different seeded user who isn't on either panel.

Each test runs the pending scheduled transitions to close the opportunity, signs in and opens the individual evaluation create page. It then enters one of the two bad values and reads the matching refusal:
- **Sprint With Us, score of six:** `scoreOutOfRangeError`.
- **Sprint With Us, empty comment:** `emptyNotesError`.
- **Team With Us, score of six:** `scoreOutOfRangeError`.
- **Team With Us, empty comment:** `emptyNotesError`.

**Changes from the last approved version.** The earlier file covered Sprint With Us only; I added Team With Us because the criterion cites the validation for both programs. Each test's title is now the criterion's own statement plus a short note of which case it checks, because Playwright refuses two tests with the same title in one file. The header now carries the new spec sha and date.

**Two parts of the criterion aren't tested, both for lack of something in the contract:**
- **A score with three decimal places.** The create pages only report a rejected score as out of range, and 4.125 isn't out of range. No observation says a too-precise score was refused. This needs a new observation on `evaluation-individual-create-swu` and `evaluation-individual-create-twu`, for example `score_too_many_decimal_places_error`.
- **Submission blocked until every question is complete.** To show this, a test has to save a draft containing a rejected entry and then try to submit it. The form won't save that draft, and no action saves what the form refuses. That is the same gap already recorded for R-5.23 in `not-testable.yaml`: an action on the create page that saves a refused draft. I didn't use the individual list's `submitDisabledUntilComplete` observation instead. The criterion says nothing about a disabled control, and R-5.25 already submits an incomplete set from that list.

These gaps are explained in comments at the top of the file.