| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T10:02:49.680Z |
| holder | agent:reviewer |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote all 20 opportunities criteria as tests, and none of them went into `not-testable.yaml`.

I wrote all 20 opportunities criteria as tests, and none of them went into `not-testable.yaml`. I could not typecheck or run anything: `tests/` has no `node_modules`, and running a check script needed approval I didn't have. I checked the files by hand, and a search found none of the tokens the separation check refuses.

**Ten tests rewritten after the ruling.** Each one now checks its starting state before it reads the outcome.
- **R-1.8, R-1.13, R-1.48, R-1.53, R-1.56:** each confirms the record was stored (the screen it lands on has an identifier and its own view shows the expected state) before going further. R-1.13 also confirms the Team With Us opportunity reads as published with its budget before looking at the list.
- **R-1.53:** "not an administrator" now comes from the account type on the staff member's own profile, which every account shows. Each program is its own test, so one blocked Team With Us case no longer stops the other two.
- **R-1.56:** the opportunity must read as published before its author tries to change it.
- **R-1.10:** it no longer insists on seeing an error message. A publish button that stays unavailable counts as the refusal. If the form does accept an over-long value, the test waits for the field error, and in every case it checks that nothing was published.
- **R-1.18:** a value the form doesn't offer counts as refused. So does a stored draft that shows a different value from the one the case names. Only when the draft shows the named value does the test publish it and expect the publication to be refused.
- **R-1.21:** the draft is first saved with a location of its own, then the location is emptied. The test confirms the saved location is gone before submitting and reading the "incomplete" message.
- **R-1.24:** before closing, the test checks that the opportunity's title appears in the administrator's list and that its view shows a state.
- **R-1.55:** each faulty panel is built and checked by who it names before it is submitted. The names come from each person's profile, read by the administrator. A chair that moves instead of doubling counts as refused, and naming the same person twice still requires the reason to be shown.

"Blocked rather than failed" has no existing convention in the suite, so I used `test.skip(true, "blocked: …")` inside the test body. It is applied in three situations:
- The target doesn't store a Team With Us opportunity.
- The seeded Team With Us opportunity can't be read.
- An administrator's publication doesn't take effect (R-1.56). Publishing isn't what that criterion covers, so this case is blocked in all three programs.

Whoever collects results needs to count these skips as blocked, not passed.

**Ten owed tests written** from the handles the contract stage supplied: R-1.25, R-1.26, R-1.27, R-1.35, R-1.40, R-1.41, R-1.42, R-1.43, R-1.49, R-1.50. Their ten `not-testable.yaml` entries are removed. R-1.51 is the only opportunities entry left there.

**Two tests are expected to fail on the old application, and the failures are genuine.** The seed notes say the old database refuses "processing" for Team With Us. So the Team With Us case of R-1.25 and both tests of R-1.49 should fail there. That is the behaviour these criteria correct, so I left them as real assertions, not blocked.

**Parts no test covers:**
- **R-1.50:** the "exactly one path" half would mean proving that no other action exists, and nothing on the surface can show that. The test only checks that both routes the surface offers for leaving consensus refuse.
- **R-1.41, R-1.43, R-1.26:** these are only tested where the seed has a record: Sprint With Us for R-1.41, both programs for R-1.43, and Code With Us and Sprint With Us for R-1.26.
- **R-1.40:** only tested in Code With Us.

**For the contract stage.** These are the surface actions and observations I needed and didn't find:
- `opportunity-swu-edit` has no observation of why moving to the team scenario was refused (R-1.42), so only the refusal is asserted.
- The panel screens have no action that leaves nobody as chair, such as `clear_panel_chair` or choosing nobody. If the adapter can't do that, the no-chair case of R-1.55 records itself as blocked.
- The panel screens have no observation of the reason for more than one chair, such as `multiple_chairs_error`.
- The opportunity views have no observation of the location on its own (R-1.21 reads the whole opportunity tab).
- Nothing in the generated TypeScript gives the service's own sending address. R-1.35 hard-codes `donotreply@example.test`, taken from `observables.yaml`.
- A seeded Team With Us opportunity in processing (R-1.26) and Team With Us consensus records like the Sprint With Us ones (R-1.41) would let those criteria be tested in all programs.

I did not touch `redo.yaml` or anything outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Do these tests follow from the opportunities criteria and from nothing else? Assertion by assertion they do, but the suite cannot be accepted yet. The compiler reports no errors under acceptance/opportunities (its one error is in adapters/new/, outside this proposal) and the separation check passes. The ten rewritten tests now confirm their starting state before reading the outcome. The ten owed tests assert only what their criteria state, or less where they say so: R-1.35 checks each person was reached but not 'once', R-1.49 checks award and cancel are both offered but not that they are the only changes, and R-1.50 checks only that both routes the surface offers for leaving consensus refuse. Each blocked skip names something outside its criterion that the target is missing. Return because three tests change one seeded record that is loaded once and never reset: seed.opportunities.twuChallengeLastToScore. R-1.25's Team With Us case scores proposals.twuChallengeLast and first requires the opportunity not yet to be in processing. Both R-1.49 tests score the same proposal again, and R-1.49's second test awards twuChallengeScored, which leaves the opportunity awarded. On a correct application, whichever test runs later finds the proposal already scored or the opportunity already awarded, and fails for a reason neither criterion governs. The test writer cannot add a seed record, and R-1.49 must award while R-1.25 needs the record untouched, so the contract stage must seed a separate record. What would change the ruling: R-1.49 moved onto a Team With Us record of its own, with its offered-changes reading and its award put in an order that no longer depends on which test runs first.

**Conditions:**
- addressed-to contract: seed a second Team With Us opportunity at the challenge stage with one proponent scored and one still to score (like opportunities.twuChallengeLastToScore) for R-1.49 alone. Evidence: tests/seed/manifest.yaml:770 holds one such record, and R-1.25's Team With Us case, R-1.49's offered-changes test and R-1.49's award test all score proposals.twuChallengeLast on it. R-1.49's award test then leaves it awarded. The seed is loaded once and never reset, so on a correct application those results depend on run order.
- R-1.49: once the contract stage has supplied a Team With Us record of its own, move both R-1.49 tests onto it so that no other test scores or awards it. Make the reading of offered state changes independent of the award test: put the reading first in one test, or give the two tests separate records. As written, the award leaves the opportunity awarded and the offered-changes test then fails for a reason R-1.49 does not govern.

### Runner-owned typecheck evidence

Proposal revision: `8c2943ac6592674315efaff9afd663b41b326cf6`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
