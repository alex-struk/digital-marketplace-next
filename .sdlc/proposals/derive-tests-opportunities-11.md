---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I added two acceptance tests to `tests/acceptance/opportunities/R-1.17.spec.ts`, one for each condition, but I could not typecheck them: running `tsc` needed approval, and nobody was here to give it."
opened: 2026-09-30T06:58:27.405Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I added two acceptance tests to `tests/acceptance/opportunities/R-1.17.spec.ts`, one for each condition, but I could not typecheck them: running `tsc` needed approval, and nobody was here to give it.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added two acceptance tests to `tests/acceptance/opportunities/R-1.17.spec.ts`, one for each condition, but I could not typecheck them: running `tsc` needed approval, and nobody was here to give it. The new code only reuses types, helpers and surface calls the file and neighbouring tests already use, but that is not a typecheck.

Both tests use a new helper that tests acceptance, the opposite of the refusal tests already in the file. It signs in as public sector staff and builds a Sprint With Us opportunity through the existing setup, complete in every other respect. It then submits it for review and reads the new opportunity's identifier from the edit screen. Last, it opens the opportunity's own page and waits for `opportunitySwuView.status()` to read "review". R-1.19 and R-1.48 use this same pattern to show an opportunity has left draft. The edit screen has no status observation of its own, so the status is read on the opportunity's view page, which the contract gives one. So an application that required a minimum score, or refused the question at position 100, would now fail.

**Condition 1 (the minimum score is optional):** a new test submits a Sprint With Us opportunity whose only question is the well-formed baseline question, which has no minimum score. It expects the opportunity to read as under review. The clause is now tested, so it needs no not-testable entry.

**Condition 2 (position 100 is allowed):** a new test submits an opportunity holding 101 questions, the last at position 100, and expects the same acceptance. It has the same 20-minute time limit as the existing test that goes one past the limit. That existing refusal test is unchanged.

**Other changes:**
- I added a short comment at the top of the file saying why these two tests expect acceptance.
- Because the file's content changed, I set the header's "derived" date to 2026-09-29, which is today. It had read 2026-09-30, a day in the future. The criterion line and spec sha are unchanged.
- No other file under `tests/acceptance/opportunities/` changed, and I did not edit `tests/acceptance/not-testable.yaml`. Its existing R-1.17 entry, for the clause "its position is never entered by the person", stays as it was.

**Left alone:** the reviewer's rationale also mentions two other in-range edges: a question or guideline of exactly 1,000 characters, and a word limit of exactly 3,000. Neither condition asks for them, and I was told to change only what the conditions name, so there are still no tests for them. A later round should add them the same way.

No surface actions or observations were missing for this work.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised R-1.17 tests follow from the criterion and nothing else, and are the two owed conditions met? Ruling: approve. Condition 1 is met: a new test submits a Sprint With Us opportunity whose only question has no minimum score and expects it to read as under review, the state R-1.19 names. Condition 2 is met: a new test submits 101 questions, the last at position 100, and expects the same acceptance. The refusal test for a question beyond position 100 still passes the limit by exactly one question. Every clause of R-1.17 v3 is asserted: refusal on submission for review for each limit, the minimum-score clause on both programs, refusal on publication by an administrator on each program, the offending field named, a draft saved while holding an out-of-limit question on both programs, and positions following the order of addition. The one clause no observation reaches, that the person never enters a position, has a real not-testable entry owed by contract. The test's statement string matches the spec's v3 text word for word. The completeness setup (dates, weights, panel) exists only so a refusal has a single cause, and nothing asserts on it. The runner's typecheck passed with no diagnostics. What would change the ruling: an assertion that R-1.17 does not state, or a clause left without a test or a not-testable entry.

**Conditions:**
- condition-met derive-tests-opportunities-stale-12#1: tests/acceptance/opportunities/R-1.17.spec.ts adds 'a Sprint With Us question with no minimum score is accepted on submission for review', which submits an otherwise complete opportunity and polls the opportunity's view-page status for 'review'
- condition-met derive-tests-opportunities-stale-12#2: tests/acceptance/opportunities/R-1.17.spec.ts adds 'an opportunity holding 101 questions, the last at position 100, is accepted on submission for review', which uses the same acceptance check

### Runner-owned typecheck evidence

Proposal revision: `2770b288b5f06b096b95cbb454005ee6d95ba0de`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
