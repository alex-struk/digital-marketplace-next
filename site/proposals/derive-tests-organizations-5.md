| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T05:51:04.347Z |
| holder | agent:reviewer |

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote the R-3.28 test the way the first condition asks and removed its not-testable entry.

I rewrote the R-3.28 test the way the first condition asks and removed its not-testable entry. I couldn't run the typecheck (the command needed approval that wasn't given), so the new file is unchecked until the runner's typecheck runs.

**Condition 1 (write the R-3.28 test): done.** I replaced `tests/acceptance/organizations/R-3.28.spec.ts`. The old file dated from an earlier spec and was sitting next to a not-testable entry, which contradicts itself. The new file has the same header as the other files in this proposal (`spec@2d9a83e…`), dated today, 2026-09-14. It uses only calls that are already bound: sign in, open `organizationEdit` for `seed.organizations.qualified.id`, `editServiceAreas`, `saveServiceAreas` and `serviceAreaCheckbox`. It holds two tests, one per outcome, each titled with the criterion's own wording:
- **Replacement:** an administrator opens the organization and the test waits until both seeded areas show. The administrator then saves a selection holding only the first area. When the approvals are read again, the kept area shows (the test waits for it) and the cleared area does not. If a save added to the approvals instead of replacing them, the cleared area would still show and the test would fail.
- **Owner refused:** it starts the same way, with the administrator keeping only one area. The organization's owner then tries to edit and to save a selection holding only the cleared area. As in R-3.13, a refused attempt is caught and ignored rather than treated as a failure. An administrator then reads the approvals: the kept area must show and the cleared one must not. That fails if the owner's save went through, whether it replaced the approvals or added to them.

**Refusal read caveat.** The reviewer noted that some refusal checks read the page once and would pass on a page that hasn't loaded. Both final checks here only run after the test has waited for the kept area to show, so they avoid that.

**Third area.** Neither test ticks a third area. No seed record or contract entry names one, so the test would have to invent it. A comment in the file says so. That example is the only part of the criterion left untested.

**Condition 2 (keep the block instead): not used.** It was the alternative to condition 1. I removed the R-3.28 entry from `tests/acceptance/not-testable.yaml`, so the criterion has a test and no entry. A search finds no R-3.28 left in that file, and the entries on either side are unchanged.

**Condition 3 (R-3.3, R-3.12, R-3.13 unchanged): honoured.** I didn't touch those three files or any other file in the domain, and no other not-testable entry changed.

**Missing from the contract.** Nothing names a third service area. A seed record approved for one, or an observation on the organization edit page listing the areas offered for selection, would let the criterion's third tick be tested. The reviewer's suggested refusal observation would still be a cleaner way to show the owner has no editing control than trying the change and confirming nothing moved.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised organizations tests follow from their criteria and nothing else? Ruling: approve. The new R-3.28 test does what the first condition of the last ruling asked. It starts from the two service areas approved on seed.organizations.qualified. An administrator saves a selection holding only the first. The test waits for that area to show, then asserts the second is gone, which fails if a save adds to the approvals instead of replacing them. The owner half has the owner try to edit and save only the second area, then an administrator reads the approvals again: the first must still show and the second must not. That fails whether the owner's save replaced the approvals or added to them. Both final reads run only after a wait, so neither passes on a page that has not loaded. Every assertion follows from the criterion, the test titles use its wording, and nothing about how the app is built leaks in. The only calls used are sign-in, organizationEdit.open, editServiceAreas, saveServiceAreas and serviceAreaCheckbox, all bound, and the runner's typecheck passed. The one part left untested is the criterion's example of ticking a third area, which no seed record or contract entry names. The test file says so in a comment. R-3.28 has no entry left in not-testable.yaml. The file's other changes only move entries or re-wrap lines, with no reason text changed. R-3.3, R-3.12 and R-3.13 differ from main only because the version approved last round was never merged. They were checked against that version's description, not with a line-by-line diff. The five warnings in the checks are about superseded tests in other domains. Caveat: the seed names service areas by code (FULL_STACK_DEVELOPER, AGILE_COACH), and whether the adapter matches those against the names the page shows is a question for calibration, not for this test. What would change the ruling: R-3.3, R-3.12 or R-3.13 differing from the approved version, or an assertion its criterion does not state.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `d464b9a313697b6a771d45a4e464b585f4e5d3b5`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
