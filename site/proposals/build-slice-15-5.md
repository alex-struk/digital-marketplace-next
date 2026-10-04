| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T07:54:39.616Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does slice 15 (A vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made the one change the ruling asked for. A Sprint With Us opportunity whose phase budgets add up to more than its total budget can now be published. The application's check passes, with all unit tests green and no type errors.

**The cause.** The last build added its own rule in `app/backend/src/rules/other-program-content.ts` (the `phaseProblems` function). That rule refused any opportunity whose phase maximum budgets came to more than its total maximum budget. No criterion backs it, and the old application accepts such an opportunity. Verify's test for R-2.19 sets up phases of 200,000 and 300,000 against a 400,000 total. Because of that rule the opportunity could not be published, so the test stopped before it reached the proposal.

**The change.**
- **The refusal is gone.** I removed the sum check and its now-unused `total` parameter, and left a short comment saying why phase budgets are not held to the total.
- **The phase budget check stays.** A phase budget, if given, must still be a whole number of at least $1, and this is still checked only when the opportunity goes for review or is published.
- **The decision record is updated.** `docs/decisions/0059` no longer contains the rule. It now says phase budgets are not held to the total, and that a proposal is checked against each phase's budget and against the total separately.

**Unit tests.**
- **Opportunity test, changed.** The existing test in `app/backend/tests/other-program-content.test.ts` now expects the 200,000 + 300,000 against 400,000 opportunity to have no problems. It also checks that both phase budgets are kept as given.
- **Proposal test, new.** I added a test in `app/backend/tests/team-proposal-rules.test.ts` for the outcome the ruling describes. A proposal costing 190,000 + 290,000 against that opportunity produces exactly one problem, against the total, reading "The proposed cost exceeds the maximum budget for this opportunity." Neither phase gets an error.

The proposal side needed no change. It already checks each phase cost only against a recorded phase budget, and checks the total cost against the opportunity's total separately.

To run the check I first had to install the application's dependencies, because they were missing from this workspace. Nothing outside `app/` and `docs/decisions/` was touched, and nothing else in slice 15 changed. Nothing is outstanding from the ruling, and the next slice inherits nothing new from this fix.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 15 (a vendor can propose on Sprint With Us and Team With Us opportunities) do what its criteria say? Ruling: approve. The verify result is pass, current for build-slice-15-5 against application tree aa72129: all 17 claimed criteria were exercised and met, with nothing unasserted. The one instruction owed from build-slice-15-4 is carried out. phaseProblems in app/backend/src/rules/other-program-content.ts no longer refuses phase budgets that add up to more than the total, and it keeps the check that a phase budget is a whole number of at least $1. Decision record 0059 says phase budgets are not held to the total. other-program-content.test.ts now accepts the 200,000 + 300,000 against 400,000 opportunity, and team-proposal-rules.test.ts shows that a 190,000 + 290,000 proposal gets exactly one error, against the total. The rest of the diff stays within slice 15's criteria (R-2.7 to R-2.25, R-1.31, R-8.19/20/25). Raw SQL writes only fixed table names and binds every value, and no secret or personal data appears. The owed test for R-2.10 is satisfied: tests/acceptance/proposals/R-2.10.spec.ts now has an edit-path test, and both of its tests passed in this verify, so I withdraw it rather than letting it block. What would change this: a stale or failing verify, or a calibration run in which the R-2.10 edit-path test fails against the old application.

**Conditions:**
- condition-met build-slice-15-4#1: phaseProblems in app/backend/src/rules/other-program-content.ts no longer refuses phase maximum budgets that add up to more than the total, and keeps the whole-number check of at least $1. docs/decisions/0059 says phase budgets are not held to the total. app/backend/tests/other-program-content.test.ts expects the 200,000 + 300,000 against 400,000 opportunity to have no problems, and app/backend/tests/team-proposal-rules.test.ts expects a 190,000 + 290,000 proposal to get exactly one error, against the total. Verify passes R-2.19.
- condition-withdrawn missing-test/R-2.10: tests/acceptance/proposals/R-2.10.spec.ts now asserts the edit-path clause ('...is refused on the edit path') as well as the create path, and both tests ran and passed at v1 in this slice's verify (tests/results/new/slice-15.json). A test that runs now exists for every clause. The scheduled calibration run (scope: changed) will still run it against the oracle.
