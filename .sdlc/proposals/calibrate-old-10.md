---
gate: G1
question: "22 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-6.1, R-5.3, R-1.9, R-3.9, R-5.10, R-5.13, R-2.14, R-6.15, R-1.16, R-6.16, R-7.16, R-5.19, R-4.20, R-1.25, R-1.27, R-1.29, R-2.30, R-8.30, R-3.31, R-2.35, R-3.35, R-1.49 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-28T17:39:10.797Z
---

# 22 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-5.3, R-1.9, R-3.9, R-5.10, R-5.13, R-2.14, R-6.15, R-1.16, R-6.16, R-7.16, R-5.19, R-4.20, R-1.25, R-1.27, R-1.29, R-2.30, R-8.30, R-3.31, R-2.35, R-3.35, R-1.49 with a calibration condition, so the next calibrate run can apply it.

22 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

```
no result recorded
```

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

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**a draft whose proposal deadline is missing is given one fourteen days from the day of saving** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"12"[39m
Received string:    [31m"Closed Oct 11, 2026 at 4:00 PM PDT"[39m
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

### R-5.13 · v1

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.

- test: tests/acceptance/evaluation/R-5.13.spec.ts

**finalising is refused unless every proponent still under review has a submitted consensus** — failed

```
Error: evaluation-consensus-list-swu.submit_final_consensus_scores — "Submit Final Consensus Scores" is disabled on http://localhost:3101/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=consensus; the page shows no message
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name. (a named individual)** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-6.15 · v1

A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice.

- test: tests/acceptance/notifications/R-6.15.spec.ts

**A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an opportunity's owner)** — failed

```
Error: visible recipients of aVNB72vPxrfnJWpY7CJCFK

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 3[39m

[2m  Array [[22m
[32m-   "donotreply@example.test",[39m
[31m+   "staff.one@example.test",[39m
[31m+   "admin.one@example.test",[39m
[31m+   "admin.two@example.test",[39m
[2m  ][22m
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

### R-6.16 · v1

A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.

- test: tests/acceptance/notifications/R-6.16.spec.ts

**A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.** — failed

```
Error: links offering to unsubscribe

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 6[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   Object {[39m
[31m+     "href": "http://localhost:3102/users/me?tab=notifications&unsubscribe",[39m
[31m+     "label": "Unsubscribe",[39m
[31m+   },[39m
[31m+ ][39m
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

### R-4.20 · v1

A person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions; the message telling a person they reactivated the account themselves is sent only when they did so by signing in again.

- test: tests/acceptance/users/R-4.20.spec.ts

**a person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions** — failed

```
Error: no message says an administrator reactivated the account

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mundefined[39m
```

**the message telling a person they reactivated the account themselves is not sent when an administrator reactivates it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/successfully reactivated/i[39m
Received string:      [31m"Digital Marketplace [http://localhost:3100/images/logo_test.png]http://localhost:3100Your Account Has Been ReactivatedYou have[39m
[31m[7msuccessfully reactivated[27m your Digital Marketplace account.Sign In [http://localhost:3100/sign-in]Unsubscribe[39m
[31m[http://localhost:3100/users/me?tab=notifications&unsubscribe]"[39m
```

**the message telling a person they reactivated the account themselves is sent when they did so by signing in again** — failed

```
Error: unbound: signIn.self-reactivating-vendor — /auth/createsessionvendor/13 reaches this account, but it creates a session without the identity provider and without looking at the account's status, so it is not the sign-in that reactivates a self-deactivated account. The oracle has no identity provider to sign in through, so the ordinary sign-in this persona exists for cannot happen there.
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

