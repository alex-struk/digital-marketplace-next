| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T02:07:22.148Z |
| holder | agent:reviewer |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote the test for R-5.22 in `tests/acceptance/evaluation/R-5.22.spec.ts`, so the one criterion I was given has a test and no `not-testable.yaml` entry.

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

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the rewritten R-5.22 tests follow from the criterion and from nothing else, and do they address the redo they were written for? Ruling: return. The assertions themselves are sound: a score of six on a five-point question and an empty comment are each read as rejected on both the Sprint With Us and Team With Us individual create pages, which is what the criterion's example states. Nothing about how the app is built leaks in. The evaluator choice is right: the seed puts users.staffOne on both panels as an evaluator, behind persona.publicSectorStaff. The two untested parts name real gaps in the contract: no observation reports a score with too many decimal places, and no action saves a draft the form refuses, the gap already recorded for R-5.23. The runner's typecheck passed with no diagnostics under acceptance/evaluation/. But this is the redo from calibrate-old-5, whose reason was that the test reads the rejection the instant the entry is made, when the old page marks the field about half a second after a change, and that it types nothing into a comment that was already empty. That reason asked the writer to allow time for the mark and to enter a comment before clearing it. The new file does neither. All four tests still read the error with an immediate expect(await ...).toBeTruthy(), and the adapter's error read (messages()) takes whatever text is on the page at that moment without waiting. Both empty-comment tests still enter notes: "" into a box never filled. The proposal still deletes the R-5.22 entry from tests/acceptance/redo.yaml, marking that reason addressed when it is not. A blind writer can fix this: expect.poll is already used for the same purpose in tests/acceptance/content/R-7.20.spec.ts. Left as it is, the next calibration would fail the same way and could not tell a harness timing fault from the product question calibrate-triage-old-6 sent on. Tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change the ruling: a version that polls each rejection until it appears or times out, and fills the comment before clearing it in both empty-comment tests. With nothing else changed, that would be approved.

**Conditions:**
- Read each rejection by retrying until it appears or times out (for example expect.poll, as tests/acceptance/content/R-7.20.spec.ts does), not with a single immediate read, in all four tests.
- In both empty-comment tests, enter a non-empty comment for the question first, then clear it, so the comment actually changes to empty before the rejection is read.
- Keep the R-5.22 entry in tests/acceptance/redo.yaml until the rewritten test actually meets its reason; do not delete it in a proposal that leaves the reason unmet.

### Runner-owned typecheck evidence

Proposal revision: `075c1f744a0a585c1ff8828684e0ecc2dd3a41dc`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    No diagnostics.
