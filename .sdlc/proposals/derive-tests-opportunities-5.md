---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I couldn't run the compiler in this session, so the file has not been typechecked."
opened: 2026-09-25T10:25:35.243Z
---

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
