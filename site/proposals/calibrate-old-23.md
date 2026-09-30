| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-30T05:21:09.206Z |
| holder | agent:product-owner |

# 2 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.17, R-2.19 with a calibration condition, so the next calibrate run can apply it.

2 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
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

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a question over 1,000 characters is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a hundred and first question is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.19 · v3

A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget. (a phase with no scrum master is not submitted)** — failed

```
Error: a phase naming no scrum master

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"201 {\"id\":\"d388c65b-4e24-4ecb-aaba-df96445fea46\",\"createdAt\":\"2026-09-30T05:11:53.913Z\",\"updatedAt\":\"2026-09-30T05:11:53.913Z\",\"opportunity\":{\"id\":\"ab3180e6-2f15-4638-9801-b2b57bb8f876\",\"createdAt\":\"2026-09-30T05:11:51.798Z\",\"updatedAt\":\"2026-09-30T05:11:51.798Z\",\"title\":\"R-2.19 opportunity bid on with a phase lacking a scrum master\",\"teaser\":\"A short summary of the work to be done.\",\"remoteOk\":true,\"location\":\"Victoria\",\"totalMaxBudget\":500000,\"proposalDeadline\":\"2026-10-13T23:00:00.000Z\",\"status\":\"PUBLISHED\"},\"anonymousProponentName\":\"\",\"status\":\"SUBMITTED\",\"history\":[{\"createdAt\":\"2026-09-30T05:11:53.913Z\",\"note\":\"\",\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"type\":{\"tag\":\"status\",\"value\":\"SUBMITTED\"}}],\"submittedAt\":\"2026-09-30T05:11:53.913Z\",\"teamQuestionResponses\":[{\"order\":0,\"response\":\"We delivered a scheduling service for a health authority over eighteen months.\"}],\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"updatedBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"organization\":{\"id\":\"00000000-0000-4000-8000-000000000301\",\"legalName\":\"Northern Pines Digital Ltd.\",\"active\":true,\"serviceAreas\":[{\"id\":1,\"serviceArea\":\"FULL_STACK_DEVELOPER\",\"name\":\"Full Stack Developer\"},{\"id\":3,\"serviceArea\":\"AGILE_COACH\",\"name\":\"Agile Coach\"}]},\"attachments\":[],\"prototypePhase\":{\"id\":\"e33b9acf-79ea-4292-88d6-2f177cba7ff3\",\"proposal\":\"d388c65b-4e24-4ecb-aaba-df96445fea46\",\"phase\":\"PROTOTYPE\",\"proposedCost\":150000,\"members\":[{\"scrumMaster\":true,\"capabilities\":[\"DevOps Engineering\",\"Frontend Development\",\"Security Engineering\"],\"idpUsername\":\"test-vendor-3\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"implementationPhase\":{\"id\":\"086f5ace-d55d-4841-923e-db00b99b52ff\",\"proposal\":\"d388c65b-4e24-4ecb-aaba-df96445fea46\",\"phase\":\"IMPLEMENTATION\",\"proposedCost\":250000,\"members\":[{\"scrumMaster\":false,\"capabilities\":[\"Agile Coaching\",\"Backend Development\",\"Delivery Management\"],\"idpUsername\":\"test-vendor-2\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000202\",\"name\":\"Blake Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"references\":[{\"name\":\"Reference 1\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.1@example.test\",\"order\":0},{\"name\":\"Reference 2\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.2@example.test\",\"order\":1},{\"name\":\"Reference 3\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.3@example.test\",\"order\":2}]}"[39m
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

Question: for each of R-1.17 and R-2.19, is the failure against the old application the application's fault, the spec's, or the test's? Ruling: approve, with defect-in-old on R-2.19 and test-wrong on R-1.17. R-2.19: the test bypassed the form and sent a proposal straight to the service with a phase that names no scrum master. The service accepted it (201, status SUBMITTED). The old service refuses a phase only when it names more than one scrum master (back-end/lib/validation.ts:1051-1060). A phase with none gets through, and only the old form's automatic single choice hides that. The criterion's rule of exactly one scrum master per phase is the right requirement, so the test stands and the rebuild's service must enforce it. R-1.17: the question-length and guideline-length clauses use the same 1-to-1,000 validation in the old application, and the guideline clause passes. So the question clause failing is a problem with how the test drives it, not the application's behaviour. For the 101st question, the test waits for the form to name a fault before anything is submitted, which asks for more than the criterion says ('submits' / 'the submission is rejected'). Note for later: the old application appears to accept positions 0 to 100, which is 101 questions. If the rewritten test submits and the old application still accepts the 101st, that should come back as defect-in-old; the spec's limit of 100 is the intended one. What would change this ruling: if the rewritten R-1.17 test still fails on the question-length clause while the guideline clause passes, the next ruling on that clause should be defect-in-old, not another test-wrong. And for R-2.19, if the old application turns out to refuse a phase with no scrum master somewhere other than the service, the ruling would become test-wrong.

**Conditions:**
- defect-in-old R-2.19
- test-wrong R-1.17: The criterion says a question outside the limits is refused when it is submitted, with the offending field named. The test instead expects the refusal to show while the question is still being added, before anything is submitted, and times out waiting for it. Enter each out-of-limit question (including the hundred and first), submit or save, and then read the refusal and the field it names. Drive the over-length question text the same way as the over-length guideline, which is refused as expected.
