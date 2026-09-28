---
gate: G1
question: "15 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-5.9, R-5.17, R-3.20, R-1.21, R-4.21, R-5.21, R-8.22, R-8.25, R-2.27, R-2.33, R-1.34, R-2.34, R-1.36, R-1.37, R-1.41 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-28T03:10:36.931Z
---

# 15 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-5.9, R-5.17, R-3.20, R-1.21, R-4.21, R-5.21, R-8.22, R-8.25, R-2.27, R-2.33, R-1.34, R-2.34, R-1.36, R-1.37, R-1.41 with a calibration condition, so the next calibrate run can apply it.

15 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-5.9 · v1

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.

- test: tests/acceptance/evaluation/R-5.9.spec.ts

**The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-5.17 · v1

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.

- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- test: tests/acceptance/evaluation/R-5.17.spec.ts

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (a third person added to a published opportunity's panel is notified, and the two already on it are not)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"staff.one@example.test"[39m
Received string:        [31m" donotreply@example.test staff.two@example.test [7mstaff.one@example.test[27m  admin.one@example.test  admin.two@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  admin.one@example.test[39m
[31mstaff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test "[39m
```

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (the same change made while the opportunity is still a draft notifies nobody)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"staff.two@example.test"[39m
Received string:        [31m" staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  donotreply@example.test [7mstaff.two@example.test[27m staff.one@example.test  admin.one@example.test  admin.two@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  admin.one@example.test[39m
[31mstaff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test "[39m
```

### R-3.20 · v1

Asking for the organizations one may act on behalf of is refused as not permitted for anyone who is not a signed-in vendor, rather than answered with an empty list.

- test: tests/acceptance/organizations/R-3.20.spec.ts

**asking for the organizations one may act on behalf of is refused as not permitted for a visitor who is not signed in, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**asking for the organizations one may act on behalf of is refused as not permitted for a member of public sector staff, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**asking for the organizations one may act on behalf of is refused as not permitted for a service administrator, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.21 · v1

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- test: tests/acceptance/opportunities/R-1.21.spec.ts

**Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/incomplete/i[39m
Received string:  [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: R-1.21 saved draft with its location emptied, submitted for review[39m
[31mUpdated Sep 27, 2026[39m
[31mStatus[39m
[31mDraft[39m
[31mCreated By[39m
[31mCasey Placeholder[39m
[31m1. Overview[39m
[31mTitle[39m
… 91 more line(s)
```

### R-4.21 · v1

The list of everyone registered with the service may be read only by an administrator. The same request made by a public sector employee who is not an administrator, or by anyone else, is refused rather than answered, so the email address and account status of every registered person are never disclosed more widely than the interface offers them.

- test: tests/acceptance/users/R-4.21.spec.ts

**the list of everyone registered with the service, requested by a public sector employee who is not an administrator, is refused rather than answered** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.21 · v1

Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation.

- given: an opportunity in individual question evaluation
- when: the chair who is not an evaluator, or the opportunity's owner who is not on the panel, tries to score a proponent
- then: the attempt is refused, whereas an evaluator on the panel may score
- test: tests/acceptance/evaluation/R-5.21.spec.ts

**Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the chair who is not an evaluator is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the opportunity's owner who is not on the panel is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-8.22 · v1

A file may be attached to an opportunity or a proposal only by someone who is permitted to read that file.

- test: tests/acceptance/files/R-8.22.spec.ts

**a file may be attached to an opportunity only by someone who is permitted to read that file: someone who may not read it is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a file may be attached to a proposal only by someone who is permitted to read that file: someone who may not read it is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.25 · v1

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- test: tests/acceptance/files/R-8.25.spec.ts

**an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.27 · v1

When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.

- given: an opportunity in evaluation with two proposals under review and one already disqualified
- when: the last of the two is scored
- then: the opportunity moves to processing with the note "Automatically moved to Processing as all proposals have been evaluated.", and disqualified, withdrawn and draft proposals are not counted
- test: tests/acceptance/proposals/R-2.27.spec.ts

**When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/disqualif/[39m
Received string:  [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mmanagement[39m
[31mproposal history[39m
[31mcode with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31mnorthern pines digital ltd.[39m
[31mproponent type[39m
[31morganization[39m
[31msubmitted by[39m
[31mblake placeholder[39m
[31mexport proposal[39m
[31mhistory[39m
[31mentry type	note	created·[39m
… 23 more line(s)
```

### R-2.33 · v1

Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.

- given: an opportunity with one evaluated proposal, one already disqualified and one withdrawn
- when: an administrator awards the evaluated proposal
- then: that proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep the state they were in
- test: tests/acceptance/proposals/R-2.33.spec.ts

**Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/disqualif/[39m
Received string:  [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mmanagement[39m
[31mproposal history[39m
[31mcode with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31msilver creek software ltd.[39m
[31mproponent type[39m
[31morganization[39m
[31msubmitted by[39m
[31mkai placeholder[39m
[31mexport proposal[39m
[31mhistory[39m
[31mentry type	note	created·[39m
… 23 more line(s)
```

### R-1.34 · v1

Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.

- given: an opportunity ready to be published and people who have turned notifications on
- when: an administrator publishes it
- then: each of those people receives a notice that a new opportunity has been posted, and the opportunity's author receives a confirmation
- test: tests/acceptance/opportunities/R-1.34.spec.ts

**publishing an opportunity confirms the publication to the opportunity's author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.34 · v1

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.

- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated
- test: tests/acceptance/proposals/R-2.34.spec.ts

**a proposal may be disqualified at any stage of evaluation, and the reason is kept in its history** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"disqualif"[39m
Received string:    [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mvendor evaluation[39m
[31mresource questions[39m
[31minterview/challenge[39m
[31mmanagement[39m
[31mproposal history[39m
[31mteam with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31mproponent 3[39m
[31mthis proposal's history will be available once the opportunity reaches the challenge."[39m
```

### R-1.36 · v1

Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator cancels it
- then: its watchers and proponents are told it has been cancelled, and its author is told separately that the cancellation was actioned
- test: tests/acceptance/opportunities/R-1.36.spec.ts

**cancelling an opportunity notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.37 · v1

Submitting an opportunity for review notifies every administrator, and confirms the submission to its author.

- given: a complete draft opportunity
- when: its author submits it for review
- then: every administrator is notified that an opportunity awaits review, and the author receives a confirmation
- test: tests/acceptance/opportunities/R-1.37.spec.ts

**submitting an opportunity for review confirms the submission to its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.41 · v1

Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.

- given: a Sprint With Us or Team With Us opportunity at the questions consensus stage
- when: its author asks to move it on while a consensus is unsubmitted, or while no proponent has cleared every question's minimum score
- then: the request is refused and the reason is named
- test: tests/acceptance/opportunities/R-1.41.spec.ts

**Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one. (Sprint With Us: a consensus evaluation still unsubmitted)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one. (Sprint With Us: no proponent has met every minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

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

