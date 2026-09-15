---
gate: G3
question: "69 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.1, R-2.1, R-5.1, R-2.2, R-2.3, R-1.4, R-2.4, R-4.5, R-1.8, R-4.9, R-5.9, R-7.9, R-1.10, R-5.10, R-1.11, R-1.12, R-3.12, R-4.12, R-7.12, R-2.13, R-5.13, R-1.14, R-2.14, R-5.14, R-5.16, R-1.17, R-6.17, R-3.18, R-5.18, R-3.19, R-4.19, R-5.19, R-8.19, R-7.20, R-8.20, R-3.21, R-5.22, R-7.22, R-2.23, R-1.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-15T01:08:20.320Z
---

# 69 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.1, R-2.1, R-5.1, R-2.2, R-2.3, R-1.4, R-2.4, R-4.5, R-1.8, R-4.9, R-5.9, R-7.9, R-1.10, R-5.10, R-1.11, R-1.12, R-3.12, R-4.12, R-7.12, R-2.13, R-5.13, R-1.14, R-2.14, R-5.14, R-5.16, R-1.17, R-6.17, R-3.18, R-5.18, R-3.19, R-4.19, R-5.19, R-8.19, R-7.20, R-8.20, R-3.21, R-5.22, R-7.22, R-2.23, R-1.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

69 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 29 come back on the next run.

### R-1.1 · v2

A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and its author is notified that it is ready for evaluation.

- given: a published opportunity whose proposal deadline has passed
- when: the service next handles any request
- then: the opportunity moves to its program's first evaluation stage with the note "This opportunity has closed.", its submitted proposals move to review, and its author receives a notification
- test: tests/acceptance/opportunities/R-1.1.spec.ts

**a published opportunity whose proposal deadline has passed closes on its own and moves to the first evaluation stage of its program** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/evaluat|question/[39m
Received string:  [31m""[39m
```

**every proposal submitted against a closed opportunity moves to review** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"review"[39m
Received string:    [31m""[39m
```

### R-2.1 · v1

Only a signed-in vendor who has accepted the service's terms at some point may start a proposal; a request from public sector staff, an administrator or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as public sector staff or as an administrator
- when: they attempt to start a proposal against a published opportunity
- then: the request is refused and no proposal is created
- test: tests/acceptance/proposals/R-2.1.spec.ts

**a request to start a proposal from public sector staff, an administrator or an anonymous visitor is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Not Found[39m
[31mThe page you are looking for doesn't exist.[39m
[31mGo Home"[39m
```

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**an opportunity that uses a panel must name at least two panel members** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**each panel member must be named only once** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**each panel member must be a public sector employee** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.2 · v1

A vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one.

- given: a vendor who already has a proposal, in any state, against a published opportunity
- when: they start a second proposal against the same opportunity
- then: the request is refused with "You already have a proposal for this opportunity." and no second proposal is created
- test: tests/acceptance/proposals/R-2.2.spec.ts

**a vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one** — failed

```
Error: proposal-cwu-create.save_draft — the field for "proposalText" is disabled on http://localhost:3000/opportunities/code-with-us/fa2ccaf6-9e94-44ca-82c5-9eb486acf86a/proposals/775d1458-b90d-4d8c-a946-54a744be7b96/edit
```

### R-2.3 · v1

Submitting a proposal requires the vendor to accept both the program's terms and the service's current terms, and the act of submitting records that acceptance.

- given: a vendor with a complete proposal whose acceptance of the current terms has been reset
- when: they submit the proposal without ticking both the program terms and the service terms
- then: the submit action is unavailable, and a submission that reaches the service anyway is refused
- test: tests/acceptance/proposals/R-2.3.spec.ts

**the act of submitting a proposal records the vendor's acceptance of the terms** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/b68b18d8-0082-4dc1-aef9-8259270f9483/proposals/create; the page shows no message
```

### R-1.4 · v1

Every change to an opportunity's content creates a new version of it and records an edit in its history; the opportunity always shows its most recent version.

- given: a published opportunity
- when: an administrator changes its description and saves
- then: the opportunity shows the new description, its history gains an entry recording that it was edited, by whom and when, and the previous content is retained
- test: tests/acceptance/opportunities/R-1.4.spec.ts

**every change to an opportunity's content creates a new version of it and the opportunity always shows its most recent version** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.4 the description as the administrator changed it."[39m
Received string:    [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mAddenda[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: R-1.4 published opportunity whose description was changed[39m
[31mPublished Sep 14, 2026[39m
[31m|[39m
[31mUpdated Sep 14, 2026[39m
[31mStatus[39m
[31mPublished[39m
[31mCreated By[39m
… 22 more line(s)
```

### R-2.4 · v1

Only a draft proposal can be deleted, and deleting it removes it permanently.

- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened
- test: tests/acceptance/proposals/R-2.4.spec.ts

**a proposal that has been submitted cannot be deleted** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/cd5a7665-47b5-49af-b6be-b8f6c13a7ae9/proposals/create; the page shows no message
```

### R-4.5 · v1

A person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated.

- given: a person who deactivated their own account
- when: they sign in again
- then: they are signed in, their account is active once more, and they receive a message saying they have successfully reactivated it
- test: tests/acceptance/users/R-4.5.spec.ts

**a person who deactivated their own account is let back in the next time they sign in, and their account becomes active again** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[7mA[27mctive"[39m
Received: [31m"[7mIna[27mctive"[39m
```

**they are told by email that it has been reactivated** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-1.8 · v1

Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards.

- given: a member of public sector staff creating a new opportunity
- when: they choose a program and complete creation
- then: the opportunity is filed under that program and offers only that program's fields, stages and actions
- test: tests/acceptance/opportunities/R-1.8.spec.ts

**an opportunity created under Team With Us is filed under that program alone** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-4.9 · v1

A person may deactivate their own account, which ends their session at once, records the date, marks the account as deactivated by them, tells them by email and keeps the record rather than erasing it.

- given: a signed-in person on their own profile
- when: they choose to deactivate their account and confirm
- then: they are signed out, shown a page confirming the deactivation, sent a message telling them they can return by signing in again, and their account is kept with the date of deactivation and the fact that they did it themselves
- test: tests/acceptance/users/R-4.9.spec.ts

**the account is kept rather than erased, and is marked as deactivated by the person themselves** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Reactivate"[39m
Received string:        [31m"Digital Marketplace[39m
[31madmin.one@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31m|[39m
[31mUsers[39m
[31m|[39m
[31mContent[39m
[31mAlex Placeholder[39m
[31mStatus[39m
[31mInactive[39m
[31mAccount Type[39m
[31mVendor[39m
[31mProfile Picture (Optional)[39m
… 8 more line(s)
```

### R-5.9 · v1

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.

- test: tests/acceptance/evaluation/R-5.9.spec.ts

**the service must reject an evaluation panel that names no chair** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.9 · v1

Removing an ordinary page removes it and every version of it permanently, and its address stops answering.

- given: an ordinary page with several versions behind it
- when: an administrator confirms removing it
- then: they are returned to the list of pages, told it was removed, its address is answered as not found, and no version of its text survives anywhere in the service
- test: tests/acceptance/content/R-7.9.spec.ts

**removing an ordinary page removes it, and its address stops answering** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**an opportunity that is not a draft is rejected when its title is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its title is over 200 characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its teaser is over 500 characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its location is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its description is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its description is over 10,000 characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.10 · v1

The refusal shown when no proponent clears every question's minimum score must name the stage that actually follows — the Code Challenge for Sprint With Us and the Challenge for Team With Us.

- test: tests/acceptance/evaluation/R-5.10.spec.ts

**the refusal on a Sprint With Us opportunity names the Code Challenge** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

**the refusal on a Team With Us opportunity names the Challenge** — failed

```
Error: unbound: evaluation-individual-create-twu.enter_question_score — no field labelled "Score" on http://localhost:3000/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/proposals/00000000-0000-4000-8000-000000000841/resource-questions/evaluations/create?tab=resourceQuestions
```

### R-1.11 · v1

An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they mark it as accepting remote work but leave the remote-work description empty
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.11.spec.ts

**an opportunity that is not a draft must state whether remote work is acceptable** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that accepts remote work must carry a remote-work description** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a remote-work description of more than 500 characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.12 · v1

A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.

- given: a member of public sector staff creating or editing a Code With Us opportunity that is not a draft
- when: they submit a reward outside $1 to $70,000, or submit no skills
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.12.spec.ts

**a Code With Us opportunity offering a reward below one dollar is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Code With Us opportunity offering a reward above seventy thousand dollars is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Code With Us opportunity naming no skill is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.12 · v1

An organization's owner, its administrators and a service administrator may grant or withdraw administrator rights over the organization to an active member, but nobody may change their own rights and the owner's own membership cannot be changed this way.

- given: an organization with an owner and two other active members, one of whom already has administrator rights
- when: the owner grants administrator rights to the second member, that administrator tries to withdraw their own rights, and someone tries to change the owner's
- then: the second member gains administrator rights, and both the self-change and the change to the owner are refused
- test: tests/acceptance/organizations/R-3.12.spec.ts

**the owner grants administrator rights to the second member and that member gains them** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"TEAM MEMBER	CAPABILITIES	ADMIN··[39m
[32mBlake Placeholder[39m
[32mOwner··[39m
[32m3·····[39m
[32mCharlie Placeholder··[39m
[32m3·····[39m
[32mDana Placeholder··[39m
[32m3"[39m
```

**an organization administrator trying to withdraw their own rights is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a change to the owner's own membership is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-4.12 · v1

Only an administrator may grant or withdraw administrator rights, only over a public sector employee's account, and a vendor can never be granted them; withdrawing the rights returns the person to an ordinary public sector employee account.

- given: an administrator, a public sector employee and a vendor
- when: the administrator opens each of the other two profiles and ticks the administrator box
- then: the public sector employee becomes an administrator immediately, and the request against the vendor is refused with a message saying vendors cannot be granted administrator permissions
- test: tests/acceptance/users/R-4.12.spec.ts

**a public sector employee becomes an administrator immediately when an administrator grants them administrator rights** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"Public Sector Employee"[39m
```

**a vendor can never be granted administrator rights, and the request against a vendor's account is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an ordinary public sector employee is offered no control to grant administrator rights, only a statement of their permissions** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.12 · v1

A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it.

- given: a newly prepared installation of the service that nobody has edited and an administrator looking at the list of pages on that installation
- when: a visitor opens any of the pages the service needs, such as its terms and conditions and they read it
- then: the page exists and answers, its title is its own address, and its body reads "Initial version" and twenty-two pages are listed, all marked as needed by the service
- test: tests/acceptance/content/R-7.12.spec.ts

**a page the service needs exists and answers, its title is its own address, and its body holds placeholder text until somebody writes it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"copyright"[39m
Received: [31m"Not Found"[39m
```

### R-2.13 · v1

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.

- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/proposals/R-2.13.spec.ts

**a Code With Us proposal that is not a draft is rejected when its proposal text is empty** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/f8c6b8cf-4314-4575-95fa-ec920ce445dc/proposals/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when its proposal text is longer than 10,000 characters** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/2df53e9e-3f73-4fa8-842c-1631d6f57d31/proposals/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when its additional comments are longer than 10,000 characters** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/1330609c-9574-4216-ad36-28ed3a77621d/proposals/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when it carries no complete proponent** — failed

```
Error: proposal-cwu-create.accept_program_terms — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/09d79211-fcf3-4645-a86b-481148b977a9/proposals/create; the page shows no message
```

### R-5.13 · v1

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.

- test: tests/acceptance/evaluation/R-5.13.spec.ts

**finalising is refused unless every proponent still under review has a submitted consensus** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-1.14 · v1

An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a proposal deadline in the past, or any later date that falls before the date preceding it
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.14.spec.ts

**an opportunity that is not a draft is rejected when its assignment date falls before its proposal deadline** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its start date falls before its assignment date** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an opportunity that is not a draft is rejected when its completion date falls before its start date** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**each of an opportunity's key dates is recorded as four o'clock in the afternoon on the day chosen** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/4:00|16:00/[39m
Received string:  [31m"Sep 28, 2026"[39m
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn** — failed

```
Error: proposal-cwu-create.accept_program_terms — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/54a51c70-7b88-4f0e-97f4-f1621c295732/proposals/create; the page shows no message
```

**a Code With Us proponent named as an organization is checked only for existence and active status** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/4241efbf-c7b5-42fd-a3cd-0cea742f89ee/proposals/create; the page shows no message
```

### R-5.14 · v1

The action that finalises consensus scores must be offered to whoever the service accepts it from — the opportunity's owner as well as an administrator — so that the browser and the service agree on who may finalise.

- test: tests/acceptance/evaluation/R-5.14.spec.ts

**the action that finalises consensus scores is offered to the opportunity's owner** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-5.16 · v1

The evaluation panel may be set or changed while an opportunity is a draft, under review, published, or in individual question evaluation, and is fixed from the consensus stage onwards.

- given: an opportunity whose questions are being evaluated individually
- when: its owner changes the evaluation panel, and then tries again once the opportunity has moved to consensus
- then: the first change is accepted and the second is refused
- test: tests/acceptance/evaluation/R-5.16.spec.ts

**the evaluation panel may be changed while an opportunity is under review** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**the evaluation panel may be changed while an opportunity is published** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**the evaluation panel may be changed while an opportunity is in individual question evaluation** — failed

```
Error: unbound: evaluation-panel-swu.remove_panel_member — no control labelled "Remove this evaluator" or "Remove" on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluationPanel
```

**the evaluation panel is fixed from the consensus stage onwards** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-1.17 · v1

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question, a guideline, a maximum score, a response word limit and a position, and an optional minimum score that must be lower than the question's maximum score.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**an evaluation question whose question runs over one thousand characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose guideline runs over one thousand characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose maximum score is below one is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose response word limit falls outside one to three thousand is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose position falls outside nought to one hundred is rejected** — failed

```
Error: unbound: opportunity-swu-create.add_team_question — "Add Question" did not make a Question 102 on http://localhost:3000/opportunities/sprint-with-us/create
```

### R-6.17 · v1

A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.

- test: tests/acceptance/notifications/R-6.17.spec.ts

**a deactivated account receives no notification of any kind** — failed

```
Error: organization-edit.add_team_members — "Add Team Member(s)" is disabled on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000304/edit?tab=team; the page shows no message
```

### R-3.18 · v1

The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.

- test: tests/acceptance/organizations/R-3.18.spec.ts

**an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Edit"[39m
Received string:        [31m"Digital Marketplace[39m
[31morg.admin@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31m[7mEdit[27m Organization[39m
[31mOrganization[39m
[31mTeam[39m
[31mSWU Qualification[39m
[31mTWU Qualification[39m
[31mChangelog[39m
[31mNorthern Pines Digital Ltd.[39m
[31mSprint With Us Qualified[39m
[31mProfile Picture (Optional)[39m
[31mLegal Name[39m
… 18 more line(s)
```

### R-5.18 · v1

The membership of an evaluation panel is shown only to an administrator, the opportunity's owner, and the people on the panel itself.

- given: an opportunity with an evaluation panel
- when: a vendor, or a public sector employee who is neither the owner nor on the panel, opens the opportunity
- then: no panel membership is shown to them, while an administrator, the owner and each panel member all see it
- test: tests/acceptance/evaluation/R-5.18.spec.ts

**the membership of an evaluation panel is shown to the people on the panel itself** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**no panel membership is shown to a public sector employee who is neither the owner nor on the panel** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000104"
```

**no panel membership is shown to a vendor** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000104"
```

### R-3.19 · v1

A change to an organization's contact phone number made while editing its profile is saved along with every other profile field, and clearing the field removes the stored number.

- test: tests/acceptance/organizations/R-3.19.spec.ts

**a change to the contact phone number is saved along with every other profile field** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Phone Saving Contact Name"[39m
Received string:    [31m"Digital Marketplace[39m
[31morg.owner@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31mEdit Organization[39m
[31mOrganization[39m
[31mTeam[39m
[31mSWU Qualification[39m
[31mTWU Qualification[39m
[31mChangelog[39m
[31mNorthern Pines Digital Ltd.[39m
[31mSprint With Us Qualified[39m
[31mProfile Picture (Optional)[39m
[31mLegal Name[39m
… 16 more line(s)
```

### R-4.19 · v1

The control to reactivate an account is offered only for an account that an administrator deactivated. An account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again, and the service continues to refuse a reactivation request made against such an account.

- test: tests/acceptance/users/R-4.19.spec.ts

**an account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Reactivate"[39m
Received string:        [31m"Digital Marketplace[39m
[31madmin.one@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31m|[39m
[31mUsers[39m
[31m|[39m
[31mContent[39m
[31mAlex Placeholder[39m
[31mStatus[39m
[31mInactive[39m
[31mAccount Type[39m
[31mVendor[39m
[31mProfile Picture (Optional)[39m
… 8 more line(s)
```

### R-5.19 · v1

A panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating.

- given: a draft opportunity whose panel names a public sector employee who did not create it
- when: that person opens their dashboard and then the opportunity
- then: the opportunity is listed under "Evaluations" and they can open it, whereas another public sector employee cannot see it at all
- test: tests/acceptance/evaluation/R-5.19.spec.ts

**a panel member may open an opportunity they sit on the panel for even before it is public** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"draft"[39m
Received string:    [31m""[39m
```

**an opportunity is listed for its panel members under a separate heading for work they are evaluating** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-5.19 draft opportunity listed for the people evaluating it"[39m
Received string:    [31m"Dashboard[39m
[31mMy Opportunities[39m
[31mEvaluations[39m
[31mEvaluations[39m
[31mView all opportunities[39m
[31mTITLE	STATUS	CREATED·[39m
[31mSeeded closed Sprint With Us opportunity[39m
[31mSPRINT WITH US··[39m
[31mTeam Questions Evaluation··[39m
[31mJul 16, 2026[39m
[31mCASEY PLACEHOLDER··[39m
[31mSeeded closed Team With Us opportunity[39m
[31mTEAM WITH US··[39m
[31mPublished··[39m
[31mJul 16, 2026[39m
[31mCASEY PLACEHOLDER"[39m
```

### R-8.19 · v1

An attachment on an opportunity is uploaded with no read access recorded against the file itself, for all three programs alike, so that what the opportunity is attached to decides who may read it.

- test: tests/acceptance/files/R-8.19.spec.ts

**an attachment on a Code With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment on a Sprint With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment on a Team With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-7.20 · v1

A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named.

- given: an administrator creating or changing a page
- when: they submit it with an empty title, or with a body longer than fifty thousand characters
- then: nothing is saved and the failing field is marked with the reason
- test: tests/acceptance/content/R-7.20.spec.ts

**A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named — creating a page with an empty title** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named — creating a page with a title longer than a hundred characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named — creating a page with an empty body** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Code With Us opportunity is readable by whoever may read the opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a file attached to a Sprint With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**a file attached to a proposal is readable by whoever may read the proposal** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/76df15f8-1ddc-478d-974c-0170052c1180/proposals/create; the page shows no message
```

### R-3.21 · v2

In the organization list, the owner's name, the team size and both qualification marks are shown only to a service administrator and, for a given organization, to the vendors who own or administer it; every other viewer sees that organization's legal name, logo, active state and service areas alone, and the owner and qualification columns are not offered at all to a visitor who is not signed in or to public sector staff.

- given: an organization owned by one vendor
- when: a different vendor, who is neither its owner nor one of its administrators, opens the organization list
- then: that organization's row shows its legal name only, with no owner, no team size and no qualification marks, while the same row shown to an administrator carries all of them
- test: tests/acceptance/organizations/R-3.21.spec.ts

**a vendor who is neither owner nor administrator of an organization sees its legal name without the owner, the team size or the qualification marks** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"—"[39m
```

### R-5.22 · v1

An evaluation carries one score and one comment per question, the score being between zero and that question's maximum with at most two decimal places, and the comment being at least one word.

- given: an evaluator scoring a proponent against a question worth five points
- when: they enter six, or a score with three decimal places, or leave the comment empty
- then: the entry is rejected and the evaluation cannot be submitted until every question has a score in range and a comment
- test: tests/acceptance/evaluation/R-5.22.spec.ts

**a score above the question's maximum is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an empty comment is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.22 · v1

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- test: tests/acceptance/content/R-7.22.spec.ts

**a page cannot be created at an address another page already holds, and the existing page is untouched** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a page cannot be renamed to an address another page already holds, and the existing page is untouched** — failed

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

**a vendor may withdraw a submitted proposal** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/f58313ca-fc81-4b18-bb01-b82d50cc312a/proposals/create; the page shows no message
```

**a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/2c0b25cf-c3cd-4f21-95b7-1ed1135f690e/proposals/create; the page shows no message
```

### R-1.24 · v1

On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation.

- given: a published Sprint With Us or Team With Us opportunity with submitted proposals
- when: it closes at its proposal deadline
- then: each submitted proposal is labelled "Proponent 1", "Proponent 2" and so on
- test: tests/acceptance/opportunities/R-1.24.spec.ts

**on closing a Team With Us opportunity, each submitted proposal is given an anonymous proponent name** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Proponent 1"[39m
Received string:    [31m""[39m
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

The question was which of the 40 criteria failing against the old target were caused by this project's own adapter, after bind-adapter-old-11 changed it. Ruling: approve, with one triage line per criterion: 26 adapter-wrong and 14 product-question. I read each failure against tests/adapters/old/index.ts, the test and the saved snapshot under tests/test-results. Three new adapter faults account for most of the 26. First, completeRequired walks every create-form step and leaves the page on the last one ('4. Attachments', or '3. Attachments' on a proposal), then Publish returns quietly on a disabled button. fieldError reads only the step on screen, so the refusal on the step holding the bad value is never seen (R-1.10, R-1.11, R-1.12, R-1.14, R-2.13, R-2.14). Second, proposalCreate's enter() cancels the terms dialog to type, which unticks both terms boxes, and submitProposal presses the still-disabled 'Submit Proposal' (R-2.3, R-2.4, R-2.14, R-2.23, R-8.20). Third, the evaluation panel binding adds nobody when given a single {member}, and matches chooser options by seed user id when they are named 'Name (email)' (R-5.1, R-5.9, R-5.16, R-5.18, R-5.19, R-8.20). scoreSheet.enter also ignores 'order', so every score lands on question 1 and 'Submit Scores for Consensus' stays disabled (R-5.10, R-5.13, R-5.14, R-5.16). Fourteen go to the product owner because nothing points at the binding. The seeded Team With Us opportunity (id ending 801) still shows Published past its deadline, and its evaluation pages answer Not Found (R-1.1, R-1.24, and the Team With Us half of R-5.10). The Team With Us Save Draft stays on /create with no visible reason (R-1.8). A second proposal redirects to the existing draft with no 'already have a proposal' message (R-2.2). An administrator's grant ticks Admin but Account Type still reads 'Public Sector Employee', and a vendor profile shows no refusal text (R-4.12). The org admin is shown 'Edit Organization' and 'Archive Organization' (R-3.18). After a self-deactivation, the administrator's view offers 'Reactivate Account' (R-4.9, R-4.19). A score of 6 and an empty comment show no error (R-5.22). The content pages publish with the dialog never opened and no field marked (R-7.20). The copyright page is Not Found and the install lists only 'About us' (R-7.12). The page is removed but no deletion message is seen (R-7.9). The product owner should see three caveats. R-7.22's tests never confirm the 'Publish Page?' and 'Publish Changes?' dialogs, so nothing reached the service: a test gap, not a binding fault. R-4.5 signs the vendor in through the target's session route, and whether that route runs reactivation cannot be seen from the evidence. R-7.9's contentText stops at the footer and may hide a toast rendered after it. Tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change this ruling: a fresh run, with these adapter defects fixed, that still fails a criterion at the same assertion. That criterion would come back as a product question. Evidence that the session route bypasses the target's sign-in handling would move R-4.5 to adapter-wrong.

**Conditions:**
- product-question R-1.1
- adapter-wrong R-2.1: proposalCwuCreate.opportunitySummary reads headerText(), which returns every line on the page when no numbered step exists, so the staff user's 'Not Found / The page you are looking for doesn't exist. / Go Home' page was read as an opportunity summary; return '' when the page has no proposal step list or create heading.
- adapter-wrong R-5.1: evaluationPanel.addPanelMember passes {member} to setEvaluationPanel, which reads only 'members' or 'evaluators', so no member is ever added and all three tests save the draft's valid default panel (Casey Placeholder as chair, Robin Placeholder); read input.member and pick the chooser option whose text contains the seed user's email, since options are named 'Name (email)'.
- product-question R-2.2
- adapter-wrong R-2.3: proposalCreate.submitProposal calls enter(), which presses Cancel on the open terms dialog to type the proposal text; closing the dialog unticks the boxes acceptProgramTerms and acceptAppTerms ticked, and openTermsDialog reopens it with both boxes unticked and 'Submit Proposal' disabled. Enter the values before opening the terms, or tick the accepted boxes again after reopening.
- adapter-wrong R-1.4: opportunityEdit.opportunityTab reads tabContent(['Opportunity']), which is only the visible '1. Overview' step (Title, Teaser, Remote OK?, Required Skills, Next); the Description is on a later step, so neither the old nor the new description can be read. Walk every step of the tab when reading it.
- adapter-wrong R-2.4: as in R-2.3, submitProposal's enter() cancels the terms dialog and the reopened dialog has both terms boxes unticked and 'Submit Proposal' disabled, so press() throws before any proposal is submitted; keep the accepted terms ticked across the reopen.
- product-question R-4.5
- product-question R-1.8
- product-question R-4.9
- adapter-wrong R-5.9: evaluationPanel.addPanelMember passes {member} to setEvaluationPanel, which reads only 'members'/'evaluators', so staff.two is never added and the saved panel still reads 'Chair: Casey Placeholder (staff.one@example.test)', leaving missingChairError no chairless panel to report; read input.member and match the option by the seed user's email.
- product-question R-7.9
- adapter-wrong R-1.10: completeRequired(true) walks the create form to '4. Attachments' and publish returns quietly on the disabled Publish, but fieldError() is messages(), which reads only the step on screen, so the error on the step holding Title, Teaser, Location or Description is never read; when Publish stays disabled, go back through the steps and collect field errors from each.
- adapter-wrong R-5.10: scoreSheet.enter picks the question with indexOf, which reads only 'index', 'position' or 'row' and ignores the test's 'order', so all four scores go into question 1 (the Sprint With Us table shows '1', '—', '—', '—' per proponent) and 'Submit Scores for Consensus' stays disabled; map 'order' to the question slot. The Team With Us test is not a binding fault: the seeded opportunity's evaluation page answers 'Not Found'.
- adapter-wrong R-1.11: in the remote-description tests completeRequired leaves the form on '4. Attachments' with Publish disabled and fieldError reads only that step, so the error beside the remote-work field is never read; in the 'must state whether remote work is acceptable' test completeRequiredHere answers the unnamed 'Remote OK?' with No, so the opportunity published ('Opportunity Published') instead of being refused. Collect errors from every step, and do not auto-answer 'Remote OK?' when the test leaves it out.
- adapter-wrong R-1.12: completeRequired leaves the create form on '4. Attachments' and publish returns on the disabled Publish, but fieldError() reads only that step, so the reward and skills errors on their own step are never read; collect field errors from every step when Publish stays disabled.
- adapter-wrong R-3.12: organizationEdit.teamMemberRow reads tableText(), whose innerText has no trace of the Admin checkbox, so after the grant (Dana's box now checked) the reading is identical; include each row's Admin checkbox state in the reading. The two refusal tests are not binding faults: the target's box is checked and disabled and the page shows no message.
- product-question R-4.12
- product-question R-7.12
- adapter-wrong R-2.13: openTermsDialog presses the top-bar 'Submit', which throws when disabled; in all four tests the form was deliberately left invalid (empty or overlong text, overlong comments, no proponent), so the disabled Submit is the refusal. Return quietly instead, and go back from '3. Attachments', where completeRequired left the page, to the step holding the invalid field so fieldError can read it.
- adapter-wrong R-5.13: scoreSheet.enter ignores the test's 'order' because indexOf reads only index/position/row, so only question 1 is scored (rows read '5', '—', '—', '—'), 'Submit Scores for Consensus' stays disabled and finalising is never reached; map 'order' to the question slot.
- adapter-wrong R-1.14: completeRequired leaves the form on '4. Attachments' and fieldError reads only that step, so the three date-order errors are never read; and opportunityView.proposalDeadline reads the value beside 'Proposal Deadline' ('Sep 28, 2026') while the page states the time in its header line 'Closes Sep 28, 2026 at 4:00 PM PDT'. Collect errors from every step, and read the deadline from the 'Closes' line as opportunityList.proposalDeadline does.
- adapter-wrong R-2.14: in the individual test openTermsDialog throws on the disabled top-bar 'Submit' although the test blanked legalName on purpose, so the disabled Submit is the refusal and should end the action quietly on the step holding the field; in the organization test submitProposal's enter() cancels the terms dialog and the reopened dialog has both boxes unticked and 'Submit Proposal' disabled.
- adapter-wrong R-5.14: scoreSheet.enter ignores the test's 'order' (indexOf reads only index/position/row), so only question 1 is scored, 'Submit Scores for Consensus' stays disabled and the owner's finalise action is never reached; map 'order' to the question slot.
- adapter-wrong R-5.16: setEvaluationPanel looks for an option named with the seed user id '00000000-0000-4000-8000-000000000102', but the chooser names people 'Casey Placeholder (staff.one@example.test)', so match by the seed user's email; addPanelMember adds nobody from {member}, so staff.two is never on the panel; removePanelMember ignores which member it was given and looks for a 'Remove' button, while each panel slot offers only an unlabelled clickable icon; and scoreSheet.enter ignores 'order', leaving questions 2 to 4 unscored so consensus is never reached.
- adapter-wrong R-1.17: in the position test fillSlot treats 'order' as a slot number and presses 'Add Question' at most twelve times before throwing 'did not make a Question 102'; the team question form has no position field (only Question*, Response Guidelines*, Response Word Limit*, Score*, Minimum Score), so do not treat 'order' as a slot for team questions. The other four tests are not binding faults: the invalid values are in the right fields on '6. Team Questions' and the page shows no error.
- product-question R-6.17
- product-question R-3.18
- adapter-wrong R-5.18: addPanelMember adds nobody from {member}, so staff.one is never on the administrator's draft panel and is shown 'Not Found'; and in the other staff and vendor tests setEvaluationPanel matches options by the id '00000000-0000-4000-8000-000000000104' while options are named 'Name (email)', so setup fails before anyone looks. Read input.member and match options by the seed user's email.
- adapter-wrong R-3.19: organizationEdit.organizationTab reads screenText(), the innerText of main, which omits the values of the disabled textboxes, so the saved 'textbox "Contact Name" [disabled]: Phone Saving Contact Name' reads as missing; include each field's value in the reading.
- product-question R-4.19
- adapter-wrong R-5.19: draftForPanelMember's addPanelMember calls add nobody because setEvaluationPanel reads only 'members'/'evaluators', so staff.one never joins the draft's panel and is shown 'Not Found' on the draft and no row under Evaluations; read input.member and match the chooser option by the seed user's email.
- adapter-wrong R-8.19: fileAttachmentControl.addAttachment picks the file into the chooser but never saves the form ('Save Changes' still offered, the only link is a 'blob:' preview), and on the Sprint With Us draft never chooses 'Edit' as the page asks, so attachmentAddress, which keeps only '/api/files/' links, returns ''; save the form after adding the attachment and wait for a stored file link. The Team With Us Save Draft staying on /create is not shown to be a binding fault.
- product-question R-7.20
- adapter-wrong R-8.20: in the Code With Us test addAttachment never saves the form, so only a 'blob:' preview exists; in the Sprint With Us and Team With Us tests setEvaluationPanel matches chooser options by the seed id '00000000-0000-4000-8000-000000000102' while they are named 'Name (email)', so match by email; in the proposal test submitProposal's enter() cancels the terms dialog and both terms boxes come back unticked with 'Submit Proposal' disabled.
- adapter-wrong R-3.21: organizationList.swuQualifiedMark and twuQualifiedMark read markUnder(), which returns the withheld cell's '—' as a mark; read '—' as '' as ownerName now does, and when a row is named read that row rather than the first data row.
- product-question R-5.22
- product-question R-7.22
- adapter-wrong R-2.23: both tests fail in submitProposal, whose enter() cancels the terms dialog so the reopened dialog has both terms boxes unticked and 'Submit Proposal' disabled; keep accepted terms ticked across the reopen, or enter values before opening the terms.
- product-question R-1.24
