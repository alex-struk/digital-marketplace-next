| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T04:32:50.104Z |
| holder | agent:reviewer |

# 3 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.2, R-1.17, R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

3 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-2.2 · v2

A vendor may hold at most one proposal per opportunity: a vendor who starts a second proposal against an opportunity they already have a proposal for is taken to the proposal they already hold instead of a new one, a request to create a second one is refused with a message saying they already have one, and no second proposal is created.

- given: a vendor who already has a proposal, in any state, against a published opportunity
- when: they start a second proposal against the same opportunity
- then: the request is refused with "You already have a proposal for this opportunity." and no second proposal is created
- test: tests/acceptance/proposals/R-2.2.spec.ts

**a vendor who starts a second proposal against an opportunity they already have a proposal for is taken to the proposal they already hold instead of a new one, and no second proposal is created** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"The one proposal this vendor holds against the opportunity."[39m
Received string:    [31m"PROPOSAL MANAGEMENT[39m
[31mProposal[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: R-2.2 opportunity a vendor starts a second proposal against[39m
[31mUpdated Sep 29, 2026[39m
[31mOpportunity Status[39m
[31mOpen[39m
[31mProposal Status[39m
[31mDraft[39m
[31mExport Proposal[39m
[31mOct 13, 2026 at 4:00 PM PDT[39m
[31mProposals Deadline[39m
[31m1. Proponent·[39m
[31mWill you be submitting a proposal for this opportunity as an Individual or Organization?·[39m
[31mIndividual[39m
[31mOrganization·[39m
… 11 more line(s)
```

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

Received: [31m"201 {\"id\":\"aa297d0a-0483-4195-b0ee-f9149f10014d\",\"createdAt\":\"2026-09-30T04:28:08.597Z\",\"updatedAt\":\"2026-09-30T04:28:08.597Z\",\"opportunity\":{\"id\":\"d6176cae-126e-46dc-a2ec-a2499aeb3491\",\"createdAt\":\"2026-09-30T04:28:06.592Z\",\"updatedAt\":\"2026-09-30T04:28:06.592Z\",\"title\":\"R-2.19 opportunity bid on with a phase lacking a scrum master\",\"teaser\":\"A short summary of the work to be done.\",\"remoteOk\":true,\"location\":\"Victoria\",\"totalMaxBudget\":500000,\"proposalDeadline\":\"2026-10-13T23:00:00.000Z\",\"status\":\"PUBLISHED\"},\"anonymousProponentName\":\"\",\"status\":\"SUBMITTED\",\"history\":[{\"createdAt\":\"2026-09-30T04:28:08.597Z\",\"note\":\"\",\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"type\":{\"tag\":\"status\",\"value\":\"SUBMITTED\"}}],\"submittedAt\":\"2026-09-30T04:28:08.597Z\",\"teamQuestionResponses\":[{\"order\":0,\"response\":\"We delivered a scheduling service for a health authority over eighteen months.\"}],\"createdBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"updatedBy\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"organization\":{\"id\":\"00000000-0000-4000-8000-000000000301\",\"legalName\":\"Northern Pines Digital Ltd.\",\"active\":true,\"serviceAreas\":[{\"id\":1,\"serviceArea\":\"FULL_STACK_DEVELOPER\",\"name\":\"Full Stack Developer\"},{\"id\":3,\"serviceArea\":\"AGILE_COACH\",\"name\":\"Agile Coach\"}]},\"attachments\":[],\"prototypePhase\":{\"id\":\"65d38be7-bba3-4d10-b2a8-9c5f02392973\",\"proposal\":\"aa297d0a-0483-4195-b0ee-f9149f10014d\",\"phase\":\"PROTOTYPE\",\"proposedCost\":150000,\"members\":[{\"scrumMaster\":true,\"capabilities\":[\"DevOps Engineering\",\"Frontend Development\",\"Security Engineering\"],\"idpUsername\":\"test-vendor-3\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000203\",\"name\":\"Charlie Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"implementationPhase\":{\"id\":\"3a595429-382a-4bbd-9456-778c7a7bde25\",\"proposal\":\"aa297d0a-0483-4195-b0ee-f9149f10014d\",\"phase\":\"IMPLEMENTATION\",\"proposedCost\":250000,\"members\":[{\"scrumMaster\":false,\"capabilities\":[\"Agile Coaching\",\"Backend Development\",\"Delivery Management\"],\"idpUsername\":\"test-vendor-2\",\"member\":{\"id\":\"00000000-0000-4000-8000-000000000202\",\"name\":\"Blake Placeholder\",\"avatarImageFile\":null},\"pending\":false}]},\"references\":[{\"name\":\"Reference 1\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.1@example.test\",\"order\":0},{\"name\":\"Reference 2\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.2@example.test\",\"order\":1},{\"name\":\"Reference 3\",\"company\":\"Reference Company Ltd.\",\"phone\":\"250-555-0101\",\"email\":\"reference.3@example.test\",\"order\":2}]}"[39m
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


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: which of the three criteria failing against the old target were caused by this project's own adapter? Ruling: approve, with one triage condition per criterion. R-2.2 is the adapter's fault. The test's check that the vendor lands on the proposal they already hold passed. The failing read is proposal-cwu-edit.proposal_tab (tests/adapters/old/index.ts:5352): it clicks the 'Proposal' tab and returns the visible text of the current wizard step. The capture shows step '1. Proponent', so the step holding the proposal text was never opened, and on an edit form that text is a field value, which visible page text does not include. R-1.17 is a product question. Its failing rows use the same addQuestion/fillSlot/fieldError path as sibling rows that passed (for example, the 1,001-character guideline was refused and read correctly). For the 101st question, 'Add Question' was offered and the form showed no fault. Nothing points at the binding. R-2.19 is a product question. The adapter sent the request as the test built it (implementation member scrumMaster:false), and the old application answered 201 SUBMITTED, so the application accepted it. What would change this ruling: evidence that the truncated R-2.2 capture contains the proposal text, or that the R-1.17 question box cuts input at 1,000 characters while the adapter's entry method gets round that limit.

**Conditions:**
- adapter-wrong R-2.2: proposal-cwu-edit.proposal_tab clicks the 'Proposal' tab and returns only the visible text of the edit wizard's current step ('1. Proponent'). It never goes to the step holding the proposal text, and it reads visible page text, which leaves out the value in the proposal text box. It must reach the step that holds the proposal text and return that field's value along with the step's text.
- product-question R-1.17
- product-question R-2.19
