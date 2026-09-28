---
gate: G3
question: "24 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-5.3, R-3.9, R-3.10, R-5.10, R-1.16, R-7.16, R-5.19, R-2.23, R-5.23, R-1.25, R-3.25, R-1.27, R-1.29, R-2.30, R-8.30, R-2.31, R-3.31, R-2.32, R-5.32, R-2.35, R-3.35, R-5.35, R-5.36, R-1.49 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T17:32:51.684Z
---

# 24 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-5.3, R-3.9, R-3.10, R-5.10, R-1.16, R-7.16, R-5.19, R-2.23, R-5.23, R-1.25, R-3.25, R-1.27, R-1.29, R-2.30, R-8.30, R-2.31, R-3.31, R-2.32, R-5.32, R-2.35, R-3.35, R-5.35, R-5.36, R-1.49 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

24 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-5.3 · v1

An evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one.

- given: an evaluator who has already started an evaluation of one proponent
- when: they start a second evaluation of the same proponent
- then: the request is refused with "You already have a team question evaluation for this proposal." and no second evaluation is created
- test: tests/acceptance/evaluation/R-5.3.spec.ts

**an evaluator holds at most one evaluation per proponent, and a second attempt is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.9 · v1

A pending invitation becomes an active membership only when the invited person accepts it, or when an administrator accepts it on their behalf; nobody else can accept it and an invitation that is not pending cannot be accepted.

- given: a person with a pending invitation to an organization
- when: the organization's owner tries to accept it on their behalf, and then the invited person accepts it themselves
- then: the owner's attempt is refused, the invited person's acceptance makes the membership active, and a further attempt to accept the now-active membership is refused as not pending
- test: tests/acceptance/organizations/R-3.9.spec.ts

**the organization owner's attempt to accept a pending invitation on the invited person's behalf is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a further attempt to accept the now-active membership is refused as not pending** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.10 · v1

A membership can be ended by the member themselves, by the organization's owner or administrators, or by a service administrator; the membership becomes inactive rather than being erased, and the person stops counting towards the organization's team.

- given: an organization with an owner and one further active member
- when: that member chooses to leave the organization
- then: they no longer appear on the organization's team list, the organization's team size falls to one, and the organization is no longer listed among their affiliated organizations
- test: tests/acceptance/organizations/R-3.10.spec.ts

**when an active member chooses to leave, the membership becomes inactive and the person stops counting towards the organization's team** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"org.member@example.test"[39m
Received string:    [31m"TEAM MEMBER | CAPABILITIES | ADMIN |[39m
[31mBlake Placeholder Owner | 3 | | Admin: yes[39m
[31mDana Placeholder | 3 | | Admin: no"[39m
```

### R-5.10 · v1

The refusal shown when no proponent clears every question's minimum score must name the stage that actually follows — the Code Challenge for Sprint With Us and the Challenge for Team With Us.

- test: tests/acceptance/evaluation/R-5.10.spec.ts

**the refusal on a Sprint With Us opportunity names the Code Challenge** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"code challenge"[39m
Received string:    [31m""[39m
```

**the refusal on a Team With Us opportunity names the Challenge** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"challenge"[39m
Received string:    [31m""[39m
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**a Sprint With Us opportunity must have an implementation phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.16 · v1

A request refused for lack of permission is reported as a permission refusal, in the same shape for every page request, whether it reads the list, reads one page, or creates, changes or removes one.

- test: tests/acceptance/content/R-7.16.spec.ts

**a request refused for lack of permission is reported as a permission refusal, in the same shape for every page request, whether it reads the list, creates, changes or removes one** — failed

```
Error: create

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[\"string\"]"[39m
Received: [31m"[7m{\"permissions\":[27m[\"string\"][7m}[27m"[39m
```

### R-5.19 · v1

A panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating.

- given: a draft opportunity whose panel names a public sector employee who did not create it
- when: that person opens their dashboard and then the opportunity
- then: the opportunity is listed under "Evaluations" and they can open it, whereas another public sector employee cannot see it at all
- test: tests/acceptance/evaluation/R-5.19.spec.ts

**A panel member may open an opportunity they sit on the panel for even before it is public** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**A panel member's opportunity is listed for them under a separate heading for work they are evaluating** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**A draft opportunity is not seen at all by a public sector employee who neither created it nor sits on its panel** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.23 · v1

A vendor may withdraw a submitted proposal at any time, and may put a withdrawn proposal back in only while the opportunity is still accepting proposals.

- given: a submitted proposal on an opportunity whose deadline has passed
- when: the vendor withdraws it, and then tries to submit it again
- then: the withdrawal is accepted and the re-submission is refused, whereas before the deadline both are accepted
- test: tests/acceptance/proposals/R-2.23.spec.ts

**a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals** — failed

```
Error: proposal-cwu-edit.submit_proposal — "Submit Proposal" is disabled on http://localhost:4300/opportunities/code-with-us/bf4a836a-d0a7-4b04-b995-6a5b66866ec4/proposals/5d8d27fb-fe04-45b3-868b-b9f1df4caf1d/edit; the page shows no message
```

### R-5.23 · v1

Scores and comments are checked when an evaluation is submitted, not when it is saved as a draft.

- given: an evaluator part-way through scoring a proponent
- when: they save a draft in which one score is above the question's maximum and one comment is empty
- then: the draft is saved as entered, and the evaluation is refused only later, when they try to submit
- test: tests/acceptance/evaluation/R-5.23.spec.ts

**Scores and comments are checked when an evaluation is submitted, not when it is saved as a draft** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

### R-1.25 · v1

An opportunity moves to processing on its own once every proposal still in contention has been scored at its program's final evaluation stage.

- given: an opportunity at its final evaluation stage with at least one proposal still in contention
- when: the last of those proposals is scored
- then: the opportunity moves to processing and the change is recorded with a note saying it was moved automatically because all proposals have been evaluated
- test: tests/acceptance/opportunities/R-1.25.spec.ts

**An opportunity moves to processing on its own once every proposal still in contention has been scored at its program's final evaluation stage. (Team With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/processing/[39m
Received string:  [31m"evaluation challenge"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-3.25 · v1

An organization is qualified for Sprint With Us once it has at least two active team members, those members between them hold every capability the service recognises, and its Sprint With Us terms have been accepted.

- given: an organization with an owner and one further active member who between them hold every capability, and whose Sprint With Us terms have not yet been accepted
- when: the owner opens the organization's Sprint With Us qualification page
- then: the team-size and capability requirements are shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.25.spec.ts

**with the team-size and capability requirements met and the terms requirement unmet, the organization is marked as not qualified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"At least two team members."[39m
```

### R-1.27 · v1

An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.

- given: an awarded opportunity
- when: a visitor who may not see proposal scores views it
- then: the successful proponent's name is shown and their contact details and score are withheld
- test: tests/acceptance/opportunities/R-1.27.spec.ts

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Code With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Sprint With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.29 · v1

The names of the people who created and last changed an opportunity are shown only to administrators and to those people themselves.

- given: a published opportunity
- when: it is viewed by someone who is neither an administrator nor the person who created or last changed it
- then: the creating and changing people's names are absent from what is shown
- test: tests/acceptance/opportunities/R-1.29.spec.ts

**the names of the people who created and last changed an opportunity are shown to an administrator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the names of the people who created and last changed an opportunity are shown to those people themselves** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.30 · v1

A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.

- given: two Sprint With Us proposals still in contention, bidding 100,000 and 200,000
- when: a team scenario score is entered for the higher bid
- then: that proposal is given a price score of 50, its history records the calculated price score, and it becomes fully evaluated
- test: tests/acceptance/proposals/R-2.30.spec.ts

**A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/(^|[^\d.])50(\.0+)?(?![\d])/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-8.30 · v1

A profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused.

- given: a signed-in person choosing a new profile picture
- when: they upload a file named "portrait.gif"
- then: the upload is refused for having an ending that is not allowed, and no file is stored
- test: tests/acceptance/files/R-8.30.spec.ts

**a profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.31 · v1

A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.

- given: an opportunity whose questions, challenge, scenario and price carry stated weights
- when: a proposal has a score for every one of those stages
- then: its total is those scores combined in the stated proportions, and it takes a rank among the other fully evaluated proposals, highest total first
- test: tests/acceptance/proposals/R-2.31.spec.ts

**A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBeNaN[2m()[22m

Received: [31mNaN[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-3.31 · v1

When a person accepts an invitation, the organization's owner is told they have joined and the new member is told they may now be put forward on the organization's proposals.

- given: a person with a pending invitation to an organization
- when: they accept it
- then: the organization's owner receives a message saying the person approved the request, and the person receives a message saying they have joined the organization's team
- test: tests/acceptance/organizations/R-3.31.spec.ts

**when a person accepts an invitation the organization's owner is told they approved the request and the new member is told they have joined the team** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
```

### R-2.32 · v1

A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over.

- given: a vendor's proposal that has been scored but whose opportunity has not been awarded
- when: the vendor opens their proposal
- then: no score and no rank are shown, and both appear once the proposal becomes awarded or not awarded
- test: tests/acceptance/proposals/R-2.32.spec.ts

**A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over. (their proposal awarded)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/\d/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over. (their proposal passed over)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/\d/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-5.32 · v1

Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.

- given: a Sprint With Us opportunity in consensus with six proponents, five of whom met every minimum score
- when: the consensus scores are finalised
- then: every proponent's history records the agreed scores question by question, the four highest scoring of the five are moved into the code challenge, and the opportunity moves to the code challenge stage
- test: tests/acceptance/evaluation/R-5.32.spec.ts

**finalising records the agreed scores, screens in the proponents that met every minimum, and moves the opportunity on** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"challenge"[39m
Received string:    [31m"team questions consensus"[39m
```

### R-2.35 · v1

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- test: tests/acceptance/proposals/R-2.35.spec.ts

**every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"disqualif"[39m
Received string:    [31m"non-compliant | r-2.35 the proponent's named team is no longer available. | sep 28, 2026 10:27 am pdt robin placeholder[39m
[31mevaluated (cc) | — | sep 28, 2026 10:27 am pdt robin placeholder[39m
[31mcode challenge score entered | a code challenge score of \"80\" was entered. | sep 28, 2026 10:27 am pdt robin placeholder[39m
[31munder review (cc) | — | sep 28, 2026 10:27 am pdt robin placeholder[39m
[31mteam questions score entered | team question scores were entered. q1: 5; q2: 5; q3: 5; q4: 5. | sep 28, 2026 10:27 am pdt robin placeholder[39m
[31munder review (tq) | — | sep 28, 2026 10:26 am pdt system[39m
[31msubmitted | — | aug 19, 2026 10:26 am pdt blake placeholder[39m
[31mdraft | — | aug 9, 2026 10:26 am pdt blake placeholder"[39m
```

### R-3.35 · v1

The accept and the decline choice offered in an invitation email both open the invited person's own organizations page with the matching confirmation ready, so a person can decline from the message as readily as they can accept.

- test: tests/acceptance/organizations/R-3.35.spec.ts

**the decline choice offered in an invitation email opens the invited person's own organizations page with the decline confirmation ready** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

### R-5.35 · v1

An evaluator works through the proponents one after another in anonymous-proponent order, saving as they move between them.

- given: an evaluator scoring the second of three proponents
- when: they move to the next proponent
- then: their scores and comments for the second proponent are saved and the third proponent's questions are shown
- test: tests/acceptance/evaluation/R-5.35.spec.ts

**an evaluator works through the proponents in anonymous-proponent order** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Proponent 1[39m
[32mProponent 1"[39m
Received string:    [31m"Proponent 1[39m
[31mProponent 2[39m
[31mProponent 3"[39m
```

### R-5.36 · v1

The two programs run the same evaluation from end to end, differing only in what the questions are called, how many proponents are carried forward, and what the stage that follows is named.

- given: one Sprint With Us and one Team With Us opportunity, each closing with proponents to evaluate
- when: each is taken through individual evaluation, consensus and finalising
- then: both follow published, individual question evaluation, consensus, and then their own next stage — the code challenge for Sprint With Us and the challenge for Team With Us — and neither can skip a stage or go back
- test: tests/acceptance/evaluation/R-5.36.spec.ts

**a Sprint With Us opportunity runs from individual evaluation through consensus to the Code Challenge** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"code challenge"[39m
Received string:    [31m"team questions consensus"[39m
```

**a Team With Us opportunity runs the same course and ends at the Challenge** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"challenge"[39m
Received string:    [31m"resource questions consensus"[39m
```

### R-1.49 · v1

The permitted state changes for a Team With Us opportunity in processing are awarded and cancelled, matching Code With Us and Sprint With Us, so the recorded transitions and the award path agree.

- test: tests/acceptance/opportunities/R-1.49.spec.ts

**The permitted state changes for a Team With Us opportunity in processing are awarded and cancelled, matching Code With Us and Sprint With Us, so the recorded transitions and the award path agree.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/processing/[39m
Received string:  [31m"evaluation challenge"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

## Triage conditions

One condition per line, one for every failing criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is which of the 24 criteria failing against old were caused by this project's adapter. I approve with one condition per criterion: 9 adapter-wrong and 15 product-question. Each failure was read against the test file, the bindings in tests/adapters/old/index.ts, what the old page actually renders, and, where they exist, the error-context snapshots.

Adapter-wrong, where the harness did not do what the test asked:
- R-2.23: the adapter never ticks the terms checkboxes that enable 'Submit Proposal'.
- R-3.25: the adapter returns a requirement's label, not whether it is met.
- R-3.10: the adapter returns team names only, and the test identifies the member by email.
- R-2.31: the adapter reads 'Total Score' off whichever tab is showing, not the Proposal tab.
- R-2.32: the adapter reads the Proposal tab and a 'Rank' label. The vendor's scores are on the Scoresheet tab, under 'Ranking'.
- R-5.35: the adapter returns every 'Proponent N' line, and the current proponent's name appears twice on the page.
- R-5.23: the adapter returns silently on a disabled 'Submit Scores for Consensus' button (index.ts:5284), so the refusal it exists to report is swallowed.
- R-5.32 and R-5.36: the adapter clicks the finalise confirm and moves on without waiting for the outcome. This one is circumstantial, but R-2.35 ran the same finalise sequence on the same seeded opportunity and reached Code Challenge.

Product-question, where the adapter reached the right place and reported what old shows or refuses:
- The old app refuses silently or with a generic message: R-3.9, R-5.10, R-8.30.
- The case cannot be constructed in old: R-1.16, R-5.3.
- Old returns a different reply shape per request: R-7.16.
- The value is absent from the public view: R-1.27, R-1.29, R-5.19, R-2.30.
- A Team With Us status write fails, so the opportunity stays at the challenge stage: R-1.25, R-1.49.
- The history label reads 'Non-compliant', not 'disqualified': R-2.35.
- The decline link in the email points at the wrong tab: R-3.35.
- The mailbox is read once, straight after acceptance: R-3.31. This is a test-side race or a delivery question, not a binding.

What would change this ruling: a rerun of R-5.32 or R-5.36 that waits for the finalise outcome and still shows the opportunity in consensus would make those two product questions.

**Conditions:**
- adapter-wrong R-3.10: organization-edit team_member_row (teamRowsText, index.ts:4426-4441) returns only the names printed in the team table, while the test identifies the member by email; each row must also carry that member's email (from the member dialog or the organization's membership list, which memberName at index.ts:4470 already reads), so both the presence check and the post-leave absence check can hold
- adapter-wrong R-2.23: proposal-cwu-edit.submit_proposal (index.ts:3751-3754) presses 'Submit Proposal' in the 'Review Terms and Conditions' dialog without ticking its checkboxes, so the button stays disabled; after pressing 'Submit' it must wait for the dialog, tick every checkbox in it (as saveProposalChanges does at index.ts:3729-3734), then press 'Submit Proposal'
- adapter-wrong R-5.23: evaluation-individual-list-swu.submit_scores_for_consensus (index.ts:5279-5285) returns silently when 'Submit Scores for Consensus' is disabled, swallowing the refusal the test is looking for; a disabled or absent submit control must be reported as a refusal (throw, as submit_proposal does for a disabled control), or incomplete_evaluation_error must report it
- adapter-wrong R-3.25: organization-edit swu_requirement_two_members / swu_requirement_all_capabilities / swu_requirement_terms_accepted (index.ts:4357-4364) return the requirement's label, which reads the same whether met or unmet; they must read the state from the icon beside each requirement (success-coloured means met, body-coloured means unmet) and return it with the label
- adapter-wrong R-2.31: proposal-swu-view.total_score (index.ts:3875, stageFigure([], ['Total Score'])) reads whichever tab is currently showing, but the 'Total Score' card appears only on the Proposal tab, and the test has moved to Team Scenario by then; it must open the Proposal tab first, and the same fix applies to proposal-twu-view.total_score (index.ts:3912)
- adapter-wrong R-2.32: proposal-swu-edit total_score and rank (index.ts:3797-3798) read the default Proposal tab and look for a 'Rank' label after its figure; a vendor's scores are on the Scoresheet tab (a table whose header is one line, so the total must be read from the body row), and the rank card is labelled 'Ranking' with its figure above the label (read it as valueBefore(['Ranking']), as proposal-cwu-view.rank does at index.ts:3834)
- adapter-wrong R-5.35: evaluation-individual-create-swu.anonymous_proponent_name (index.ts:5507 via anonymousProponent at index.ts:3814-3817) joins every 'Proponent N' line on the page, and the score sheet shows the current proponent's name twice, so it returned 'Proponent 1\nProponent 1'; on the create page it must return the single current proponent's name, keeping the joined list only for the individual list page
- adapter-wrong R-5.32: evaluation-consensus-list confirm_finalize_consensus (index.ts:5369 via inDialog/press) clicks 'Finalize Consensus Scores' in the dialog and returns at once, because settle() resolves on an already-idle network, so the next navigation races the finalise request; it must wait for the outcome (the success notice, or 'Finalize Consensus Scores' leaving the top bar) and fail if an error notice appears, and waiting only for the dialog to close is not enough because it closes before the request is sent
- adapter-wrong R-5.36: the same finalise binding as R-5.32 (evaluation-consensus-list confirm_finalize_consensus, index.ts:5369, shared by the Sprint With Us and Team With Us consensus tabs) does not wait for the finalise request to complete before the test reads the status; it must wait for the success notice or for the finalise control to leave the top bar
- product-question R-5.3
- product-question R-3.9
- product-question R-5.10
- product-question R-1.16
- product-question R-7.16
- product-question R-5.19
- product-question R-1.25
- product-question R-1.27
- product-question R-1.29
- product-question R-2.30
- product-question R-8.30
- product-question R-3.31
- product-question R-2.35
- product-question R-3.35
- product-question R-1.49
