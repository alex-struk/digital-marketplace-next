| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-30T06:37:50.039Z |
| holder | agent:product-owner |

# 1 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.17 with a calibration condition, so the next calibrate run can apply it.

1 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-1.17 · v2

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (an empty question is refused on submission, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a question over 1,000 characters is refused on submission, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (an empty guideline is refused on submission, naming the guideline)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a guideline over 1,000 characters is refused on submission, naming the guideline)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a maximum score below 1 is refused on submission, naming the score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/score/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a response word limit below 1 is refused on submission, naming the word limit)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/word/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a response word limit above 3,000 is refused on submission, naming the word limit)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/word/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a Sprint With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/minimum/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a Team With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/minimum/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a hundred and first question is refused on submission, naming the questions)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

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

Question: R-1.17 fails on all ten out-of-limit cases against old. Is that the application's fault, the spec's, or the test's? Ruling: spec-wrong. Reason: each test saved a Sprint With Us or Team With Us draft carrying one out-of-limit question. The save succeeded (the adapter's saveDraft would have thrown had it not landed on the record), and no refusal ever appeared. The old application does this on purpose: sources/old/src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412 ('Do not validate other fields if the opportunity a draft') returns the team questions as entered when the status is Draft, and validateTeamQuestions (line 586) runs only for a status other than Draft. team-with-us/index.ts:364 does the same for resource questions. So the limits hold when the opportunity is submitted for review or published, not when a draft is saved. The criterion never said when the limits apply, which is what let a blind test take 'save draft' as the submission. The old behaviour (drafts may be incomplete) is a reasonable product choice, not a defect, so the fix is the statement, not defect-in-old. In the same pass the statement is corrected on capacity: validateTeamQuestionOrder accepts positions 0 to 100 inclusive (validateNumber compares with < min and > max), which admits 101 questions, so the claim that the list 'holds at most 100' is replaced by the position range the code enforces. The minimum-score clause is already right (validateTeamQuestionMinimumScore caps it at score - 1). What would change this ruling: evidence that the old front-end blocks a draft save with out-of-limit questions before the request is sent, which would make this test-wrong instead.

**Conditions:**
- spec-wrong R-1.17: Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits.
