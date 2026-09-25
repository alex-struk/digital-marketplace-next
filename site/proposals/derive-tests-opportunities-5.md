| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T10:25:35.243Z |
| holder | agent:reviewer |

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I couldn't run the compiler in this session, so the file has not been typechecked.

I've addressed the ruling's one condition for this stage: R-1.49 now runs on its own record. I couldn't run the compiler in this session, so the file has not been typechecked.

**The condition (R-1.49).** Before I started, the contract stage had already added the record the reviewer asked for: `seed.opportunities.twuChallengeLastToScoreForAward`, with the proposals `twuAwardChallengeScored` and `twuAwardChallengeLast`. It is marked for R-1.49 alone, and all three handles are in `tests/generated/seed.ts`. I moved R-1.49 onto it, so nothing in the test touches `twuChallengeLastToScore` or its proposals any more, and R-1.25's Team With Us case now has that record to itself.

To make reading the offered state changes independent of the award, I used the condition's first option: put the reading first in one test. There is only one record for R-1.49, so two tests on it would still depend on which ran first. Separate records for each would have needed a third seed record, and adding one isn't this stage's job.

`tests/acceptance/opportunities/R-1.49.spec.ts` now holds one test, titled with the criterion's statement. It:
1. signs in as the administrator,
2. scores the last proponent on the challenge,
3. confirms the opportunity reads as in processing,
4. reads the offered state changes and requires both award and cancel among them,
5. awards the proposal scored first and confirms the opportunity reads as awarded.

The criterion's statement is itself about the offered changes and the award path agreeing, so checking both in one test is a fair reading of it. The assertions are the same as before, and the test still does not check that award and cancel are the *only* changes offered. The header is unchanged apart from the file content. Its "derived" date is today, which is what it already said.

**What I didn't touch.** No other file under `tests/acceptance/opportunities/` and no entry in `tests/acceptance/not-testable.yaml`. The seed request addressed to the contract stage was theirs, and it turned out to be done already. I wrote nothing under `tests/seed`, `tests/fixtures` or any other read-only path.

**Checks.** Permission to run `tsc` was declined in this session. Instead I checked the three new seed handles against `tests/generated/seed.ts`. The surface calls and fixture imports are the same ones the previous version used, which that review compiled cleanly. Whoever rules next should still run the compiler and the separation check over this file.

**Surface.** For this condition I needed no surface action or observation that doesn't already exist.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Do the revised opportunities tests now follow from their criteria and from nothing else? Returned. The condition left on R-1.49 is met: it now runs only on seed.opportunities.twuChallengeLastToScoreForAward with twuAwardChallengeLast and twuAwardChallengeScored. It is one test that scores the last proponent, confirms processing, requires award and cancel among the offered state changes, and only then awards and confirms awarded. Its assertions follow from the criterion and it no longer shares a record with R-1.25. The runner's typecheck reports no diagnostics under acceptance/opportunities/; its one diagnostic is in adapters/new/, outside this proposal. The newly written R-1.25, R-1.26, R-1.27, R-1.40, R-1.41, R-1.42, R-1.43 and R-1.50 assert what their criteria state, or less where their comments say so. R-1.35 repeats the defect the last round was returned for. Both of its tests call arrangeWatcherAndProponent on seed.opportunities.publishedCodeWithUs, and that record is loaded once and never reset. The watch action is a toggle, so the second test's toggleWatch as persona.competingVendor turns the watch the first test set back off. Its poll that watchers exceed the earlier count then fails on a correct application. The same vendor also submits a second proposal to the same opportunity, which the proposal-count poll depends on. Those failures come from run order, not from anything R-1.35 governs. What would change the ruling: R-1.35 reworked so that the watcher and the proponent are set up only once on the shared record.

**Conditions:**
- condition-met derive-tests-opportunities-stale-3#2: R-1.49 now uses only seed.opportunities.twuChallengeLastToScoreForAward and its proposals twuAwardChallengeLast and twuAwardChallengeScored. It is one test in tests/acceptance/opportunities/R-1.49.spec.ts that reads offered_state_changes (award and cancel) before awarding, so the reading no longer depends on run order.
- R-1.35: the two tests each call arrangeWatcherAndProponent (tests/acceptance/opportunities/R-1.35.spec.ts:53) on seed.opportunities.publishedCodeWithUs, a record loaded once and never reset. toggleWatch as persona.competingVendor (line 70) is a toggle, so the second test's call turns the watch off again. Its poll that the watcher count exceeds the earlier count (line 76) then fails on a correct application, and persona.vendor submitting a second proposal to the same opportunity puts the proposal-count poll (line 77) at the same risk. Set up the watcher and the proponent once: for example, one test that sets them up and then makes the details change and adds the addendum in turn, clearing the mail catcher before each and checking all three people are reached after each.

### Runner-owned typecheck evidence

Proposal revision: `0e8c62106f94141fdae1e68cfcb1d159bff32b04`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
