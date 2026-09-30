---
gate: G1
question: "1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.17 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-30T20:37:43.256Z
---

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.17 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.17 · v3

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (a question whose position would fall beyond 100 is refused on submission for review)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question|position|order/i[39m
Received string:  [31m"Unable to Submit Opportunity[39m
[31mSprint With Us opportunity could not be submitted. Please try again later."[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does R-1.17's failure against old (an opportunity with a question at position 101, submitted for review, gets 'could not be submitted. Please try again later.' instead of a message naming the question limit) belong to the application, the spec or the test? Ruling: approve, with R-1.17 ruled defect-in-old. Reason: the old source shows the server does refuse it. validateTeamQuestionOrder (src/shared/lib/validation/opportunity/sprint-with-us.ts:367) limits each question's position to 0 to MAX_TEAM_QUESTIONS = 100 and returns an error keyed on 'order'. But the person never enters a position, so the form has no field to show that error against, and the front end shows a generic toast telling them to try again later. That advice is false because the rejection is deterministic. The criterion's 'refused' half matches the old app and its 'offending field is named' half is the correct requirement, so this is a defect in the old app and not a misdescription. The test is sound: it signs in as public sector staff, builds exactly the case the criterion describes, and accepts any message mentioning question, position or order, so a plain 'too many questions' message passes. Spec-wrong would write a misleading error into the rebuild's contract, and test-wrong has nothing to point at. What would change the ruling: evidence that the old front end names the limit somewhere this test does not read (e.g. an inline message on the questions tab rather than the page's field-error area); that would make it test-wrong. This proposal settles none of the three owed instructions (build-slice-2-5#1, build-slice-2-11#4, build-slice-2-11#5), so they stay open. The failing egress check flags only build-slice-2-11 files and one line of .sdlc/conditions.yaml, none of which this diff touches, and build-slice-2-11#5 already covers fixing it.

**Conditions:**
- defect-in-old R-1.17
