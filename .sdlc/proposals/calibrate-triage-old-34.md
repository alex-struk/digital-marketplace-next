---
gate: G3
question: "4 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.1, R-1.17, R-2.19, R-5.25 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-30T03:55:21.271Z
---

# 4 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.1, R-1.17, R-2.19, R-5.25 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

4 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.1 · v3

- carried from 2026-09-30-8: none of its inputs has changed since that run measured it

A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity.

- given: a published opportunity whose proposal deadline has passed
- when: the service next handles any request
- then: the opportunity moves to its program's first evaluation stage with the note "This opportunity has closed.", its submitted proposals move to review, and its author receives a notification
- test: tests/acceptance/opportunities/R-1.1.spec.ts

**A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity. (a Sprint With Us or Team With Us opportunity is announced as ready for evaluation to the evaluators on its panel)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-1.17 · v2

- carried from 2026-09-30-8: none of its inputs has changed since that run measured it

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

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a question's position is set by its place in the list)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.17 the question added second"[39m
Received string:    [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mEvaluation Panel[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mInstructions[39m
[31mEvaluation[39m
[31mTeam Questions[39m
[31mConsensus[39m
[31mCode Challenge[39m
[31mTeam Scenario[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mSprint With Us: R-1.17 draft whose questions are listed in order[39m
… 16 more line(s)
```

### R-2.19 · v3

- carried from 2026-09-30-8: none of its inputs has changed since that run measured it

A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget. (a team for a phase the opportunity does not have is not submitted)** — failed

```
Error: a proposal giving a team to a phase the opportunity does not have: the refusal says /does not require this phase/i against the Inception phase (refusal was inception phase phase: This opportunity does not require this phase.)

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget. (a proposal leaving out a phase the opportunity has is not submitted)** — failed

```
Error: a proposal leaving out the prototype phase: the refusal says /requires this phase/i against the Prototype phase (refusal was prototype phase phase: This opportunity requires this phase.
team: The selected team members for each phase do not satisfy this opportunity's capability requirements.)

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget. (a phase with two scrum masters is not submitted)** — failed

```
Error: a phase naming two scrum masters: the refusal says /single scrum master/i against the Implementation phase (refusal was implementation phase members #1 members: You may only specify a single scrum master.
team: The selected team members for each phase do not satisfy this opportunity's capability requirements.)

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget. (a phase with no scrum master is not submitted)** — failed

```
Error: a phase naming no scrum master

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"201 {\"id\":\"d10de9c2-8be6-4b11-8038-414257081dc8\",\"createdAt\":\"2026-09-30T03:37:16.741Z\",\"updatedAt\":\"2026-09-30T03:37:16.741Z\",\"opportunity\":{\"id\":\"926ee74f-2af8-48dc-ab3d-1c7488cd5fdc\",\"createdAt\":\"2026-09-30T03:37:14.669Z\",\"updatedAt\":\"2026-09-30T03:37:14.669Z\",\"title\":\"R-2.19 opportunity bid on with a phase lacking a scrum master\",\"teaser\":\"A short summary of the work to be done.\",\"remoteOk\":true,\"location\":\"Victoria\",\"totalMaxBudget\":500000,\"proposalDeadline\":\"2026-10-13T23:00:00.000Z\",\"status\":\"PUBLISHED\"},\"anonymousProponentName\":\"\",\"status\":\"SUBMITTED\",\"history\":[{\"createdAt\":\"2026-09-30T03:37:16.741Z\",\"note\":\"\",\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"type\":{\"tag\":\"status\",\"value\":\"SUBMITTED\"}}],\"submittedAt\":\"2026-09-30T03:37:16.741Z\",\"teamQuestionResponses\":[{\"order\":0,\"response\":\"We delivered a scheduling service for a health authority over eighteen months.\"}],\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"updatedBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"organization\":{\"id\":\"00000000-0000-4000-8000-000000000301\",\"legalName\":\"Northern Pines Digital Ltd.\",\"active\":true,\"serviceAreas\":[{\"id\":1,\"serviceArea\":\"FULL_STACK_DEVELOPER\",\"name\":\"Full Stack Developer\"},{\"id\":3,\"serviceArea\":\"AGILE_COACH\",\"name\":\"Agile Coach\"}]},\"attachments\":[],\"prototypePhase\":{\"id\":\"57804a38-f1de-4517-ac5e-7fb1383c295d\",\"proposal\":\"d10de9c2-8be6-4b11-8038-414257081dc8\",\"phase\":\"PROTOTYPE\",\"proposedCost\":150000,\"members\":[{\"scrumMaster\":true,\"capabilities\":[\"DevOps Engineering\",\"Frontend Development\",\"Security Engineering\"],\"idpUsername\":\"test-vendor-3\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"implementationPhase\":{\"id\":\"654e9985-c522-4f0b-93fd-118bbd7e9e8b\",\"proposal\":\"d10de9c2-8be6-4b11-8038-414257081dc8\",\"phase\":\"IMPLEMENTATION\",\"proposedCost\":250000,\"members\":[{\"scrumMaster\":false,\"capabilities\":[\"Agile Coaching\",\"Backend Development\",\"Delivery Management\"],\"idpUsername\":\"test-vendor-2\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000202\",\"name\":\"Blake Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"references\":[{\"name\":\"Reference 1\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.1@example.test\",\"order\":0},{\"name\":\"Reference 2\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.2@example.test\",\"order\":1},{\"name\":\"Reference 3\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.3@example.test\",\"order\":2}]}"[39m
```

### R-5.25 · v3

- carried from 2026-09-30-8: none of its inputs has changed since that run measured it

An evaluator can submit their scores for consensus only once they hold a complete evaluation, an in-range score and a comment for every question, for every proponent of the opportunity; until then submission is not offered and nothing is submitted. The service independently refuses a submitted set containing any incomplete evaluation with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again.", submitting none of it.

- given: an evaluator with three proponents to score and a complete draft for only two of them
- when: they submit their scores for consensus
- then: the submission is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." and none of the three is submitted
- test: tests/acceptance/evaluation/R-5.25.spec.ts

**An evaluator can submit their scores for consensus only once they hold a complete evaluation, an in-range score and a comment for every question, for every proponent of the opportunity; until then submission is not offered and nothing is submitted. (once every proponent is complete, submission is offered and goes through)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"enabled"[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

