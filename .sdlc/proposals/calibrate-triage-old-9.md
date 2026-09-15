---
gate: G3
question: "26 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-5.1, R-1.8, R-5.9, R-7.9, R-1.10, R-7.12, R-1.13, R-2.14, R-1.15, R-1.16, R-5.17, R-1.18, R-5.18, R-8.20, R-1.21, R-7.22, R-1.24, R-7.25, R-8.25, R-3.26, R-7.27, R-8.31, R-1.48, R-1.53, R-1.55, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-15T06:29:00.592Z
---

# 26 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-5.1, R-1.8, R-5.9, R-7.9, R-1.10, R-7.12, R-1.13, R-2.14, R-1.15, R-1.16, R-5.17, R-1.18, R-5.18, R-8.20, R-1.21, R-7.22, R-1.24, R-7.25, R-8.25, R-3.26, R-7.27, R-8.31, R-1.48, R-1.53, R-1.55, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

26 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel of one person is rejected)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming the same person twice is rejected with the rule named)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming two chairs is rejected)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 2[39m

[32m- Casey Placeholder (staff.one@example.test)[7m (Panel Chair)[27m[39m
[31m+ Casey Placeholder (staff.one@example.test)[39m
[2m  Robin Placeholder (admin.one@example.test)[22m
[31m+ Emery Placeholder (panel.evaluator@example.test) (Panel Chair)[39m
```

### R-1.8 · v1

Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards.

- given: a member of public sector staff creating a new opportunity
- when: they choose a program and complete creation
- then: the opportunity is filed under that program and offers only that program's fields, stages and actions
- test: tests/acceptance/opportunities/R-1.8.spec.ts

**an opportunity created under Team With Us belongs to that program alone, and is never changed afterwards** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3102/opportunities/team-with-us/create; the page shows no message
```

### R-5.9 · v1

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.

- test: tests/acceptance/evaluation/R-5.9.spec.ts

**The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.9 · v1

Removing an ordinary page removes it and every version of it permanently, and its address stops answering.

- given: an ordinary page with several versions behind it
- when: an administrator confirms removing it
- then: they are returned to the list of pages, told it was removed, its address is answered as not found, and no version of its text survives anywhere in the service
- test: tests/acceptance/content/R-7.9.spec.ts

**Removing an ordinary page removes it and every version of it permanently, and its address stops answering** — failed

```
Error: told the page was removed

told the page was removed

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters. (a teaser over 500 characters)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.12 · v1

A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it.

- given: a newly prepared installation of the service that nobody has edited and an administrator looking at the list of pages on that installation
- when: a visitor opens any of the pages the service needs, such as its terms and conditions and they read it
- then: the page exists and answers, its title is its own address, and its body reads "Initial version" and twenty-two pages are listed, all marked as needed by the service
- test: tests/acceptance/content/R-7.12.spec.ts

**A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it — a visitor reading one** — failed

```
Error: given: this installation carries "about" as a page the service needs

given: this installation carries "about" as a page the service needs

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

**A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it — an administrator looking at the list of pages** — failed

```
Error: given: this installation carries the pages the service needs

given: this installation carries the pages the service needs

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

### R-1.13 · v1

A Sprint With Us opportunity must state a total maximum budget of at least $1 and at most $5,000,000, while a Team With Us opportunity must state a maximum budget of at least $1 with no upper limit.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a Sprint With Us budget above $5,000,000, or any budget below $1
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.13.spec.ts

**a Team With Us opportunity may state a maximum budget with no upper limit** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.13 Team With Us opportunity budgeted above the Sprint With Us ceiling"[39m
Received string:    [31m"Seeded published Code With Us opportunity[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Jun 1, 2030 at 4:59 PM PDT[39m
[31mA published opportunity that exists before any test runs.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mWatch"[39m
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Code With Us proponent named as an organization is checked only for existence and active status** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.15 · v1

A Sprint With Us or Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent.

- given: a member of public sector staff creating or editing a Sprint With Us or Team With Us opportunity that is not a draft
- when: they submit weights that do not total one hundred per cent
- then: the submission is rejected with a message saying the scoring weights must total 100%
- test: tests/acceptance/opportunities/R-1.15.spec.ts

**a Sprint With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**a Sprint With Us opportunity must have an implementation phase** — failed

```
Error: unbound: opportunity-swu-create.add_phase — no phase named "Prototype"; the form offers "Inception" or "Proof of Concept" or "Implementation"
```

**a Sprint With Us opportunity may only have an inception phase if it also has a prototype phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.17 · v1

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.

- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- test: tests/acceptance/evaluation/R-5.17.spec.ts

**when people are added to an evaluation panel, only the people newly added are notified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-1.18 · v1

Each resource on a Team With Us opportunity names one service area and a target allocation between 1 and 100 per cent of full time.

- given: a member of public sector staff creating or editing a Team With Us opportunity that is not a draft
- when: they submit a resource with a target allocation outside 1 to 100, or a service area that is not one of the five recognised areas
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.18.spec.ts

**a Team With Us resource whose target allocation is below one per cent is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Team With Us resource whose target allocation is above one hundred per cent is rejected** — failed

```
Error: unbound: opportunity-twu-create.add_resource — the chooser offers no option matching "101" on http://localhost:3100/opportunities/team-with-us/create
```

**a Team With Us resource naming a service area the service does not recognise is rejected** — failed

```
Error: unbound: opportunity-twu-create.add_resource — the chooser offers no option matching "Lighthouse Keeper" on http://localhost:3100/opportunities/team-with-us/create
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

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/team-with-us/create
```

**a file attached to a proposal is readable by whoever may read the proposal** — failed

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
[31mCode With Us: R-1.21 saved draft with no location submitted for review[39m
[31mUpdated Sep 14, 2026[39m
[31mStatus[39m
[31mUnder Review[39m
[31mCreated By[39m
[31mCasey Placeholder[39m
[31m0[39m
[31mTotal Views[39m
… 115 more line(s)
```

### R-7.22 · v1

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- test: tests/acceptance/content/R-7.22.spec.ts

**No two pages may share an address, whether the clash arises on creating a page or on renaming one — on creating a page** — failed

```
Error: the address is reported as already in use

the address is reported as already in use

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

### R-1.24 · v1

On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation.

- given: a published Sprint With Us or Team With Us opportunity with submitted proposals
- when: it closes at its proposal deadline
- then: each submitted proposal is labelled "Proponent 1", "Proponent 2" and so on
- test: tests/acceptance/opportunities/R-1.24.spec.ts

**On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation. (Team With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/evaluat|question/[39m
Received string:  [31m""[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-7.25 · v1

A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so.

- given: an administrator on the managing screen of a page the service needs
- when: they look for the ways to change it
- then: a warning explains that the service needs this page at this address, the address cannot be typed over, no removal is offered, and a request to rename or remove it made another way is refused
- test: tests/acceptance/content/R-7.25.spec.ts

**A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so** — failed

```
Error: given: "disclaimer" answers

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Not Found·[39m
[31mThe page you are looking for doesn't exist.·[39m
[31mGo Home"[39m
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

**an attachment on a proposal is readable by whoever may read that proposal** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.26 · v1

An organization is qualified for Team With Us once it has been approved for at least one service area and its Team With Us terms have been accepted.

- given: an organization approved for one service area whose Team With Us terms have not been accepted
- when: the owner opens the organization's Team With Us qualification page
- then: the service-area requirement is shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.26.spec.ts

**an organization approved for service areas whose Team With Us terms have been accepted is qualified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**with the service-area requirement met and the terms requirement unmet, the organization is marked as not qualified** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"Not met: To qualify for one or more Service Areas, you must complete the RFQ through BC Bid."[39m
```

### R-7.27 · v1

The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded.

- given: a page the service created for itself and has never been edited, and a page an administrator created and another administrator later changed
- when: an administrator opens each page's managing screen
- then: the first names "System" as both publisher and last editor, and the second names the two people, each linked to their profile
- test: tests/acceptance/content/R-7.27.spec.ts

**The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded — a page the service created that nobody has edited** — failed

```
Error: given: "accessibility" answers

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Not Found·[39m
[31mThe page you are looking for doesn't exist.·[39m
[31mGo Home"[39m
```

**The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded — a page one administrator created and another changed** — failed

```
Error: unbound: signIn.administrator-other — /auth/createsessionadmin mints a session for one fixed account, looked up by the identity-provider id "test-admin", and takes no parameter. No route reaches a second administrator, so this persona can be seeded and observed on the oracle but never acted as.
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: unbound: file-attachment-control.remove_existing_attachment — could not reach a step showing "Add Attachment" on http://localhost:3100/opportunities/code-with-us/eb5ffc2e-1570-4ff2-acd5-9d917f580806/edit?tab=opportunity
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3102/opportunities/team-with-us/create; the page shows no message
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**an administrator may delete an opportunity while it is a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3100/opportunities/team-with-us/create; the page shows no message
```

**an administrator may delete an opportunity while it is under review, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the public sector employee who created an opportunity may delete it while it is a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the public sector employee who created an opportunity may not delete it once it is under review, in Code With Us, Sprint With Us and Team With Us alike, and it remains** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**any other request to delete an opportunity, such as one that has been published, is refused and the opportunity remains** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.55 · v1

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.

- test: tests/acceptance/opportunities/R-1.55.spec.ts

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: fewer than two members)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: the same person twice)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: no chair)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: fewer than two members)** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3101/opportunities/team-with-us/create; the page shows no message
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: the same person twice)** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3101/opportunities/team-with-us/create; the page shows no message
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: no chair)** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3101/opportunities/team-with-us/create; the page shows no message
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: more than one chair)** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3101/opportunities/team-with-us/create; the page shows no message
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: someone who is not a public sector employee)** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3101/opportunities/team-with-us/create; the page shows no message
```

### R-1.56 · v1

Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.

- test: tests/acceptance/opportunities/R-1.56.spec.ts

**the same rule governs a published Sprint With Us opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.56 the description its author tried to put there."[39m
Received string:        [31m"SUMMARY[39m
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
[31mThis opportunity is a draft. Please select \"Edit\" from the Actions dropdown to complete and publish this opportunity.[39m
… 272 more line(s)
```

**the same rule governs a published Team With Us opportunity** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
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

The question was which of the 26 criteria that fail against the old target were caused by this project's own adapter. Ruling: approve, with one triage line per criterion: 7 adapter-wrong and 19 product-question. I read each failure against tests/adapters/old/index.ts, the test, and the page snapshot saved under tests/test-results. Five adapter faults account for the 7. (1) A reader that stops short: contentEdit.deletedSuccess reads only the text above the footer, but 'Page Deleted: About us has been deleted.' is an alert drawn below the footer (R-7.9). (2) Filling what the test left out: saveDraft filled the omitted 'Location*' with 'Victoria', so the incomplete draft was accepted for review (R-1.21). (3) Reading the wrong step: scoreWeightError reads only the step the form was left on, '8. Attachments', never '6. Scoring', where the weights are (R-1.15). (4) Mapping a name: the criterion's 'Prototype' phase was never mapped to the form's 'Proof of Concept' (R-1.16). (5) Attachments: attachmentAddress looks for the file link on the proposal's '1. Proponent' step, with an empty dialog still open, instead of on '3. Attachments' (R-8.20, R-8.25, R-8.31). Also, removeExistingAttachment never chooses 'Edit' on a published opportunity whose attachment is shown read-only (R-8.31). Nineteen go to the product owner because nothing in the evidence points at the binding. Every Team With Us 'Save Draft' or 'Publish' was pressed while enabled, stayed on /opportunities/team-with-us/create and showed no message (R-1.8, R-1.13, R-1.48, R-1.53's administrator draft test, R-1.55's Team With Us tests). The installation answers 'Not Found' at /content/about, /content/disclaimer and /content/accessibility (R-7.12, R-7.25, R-7.27). The target has no sign-in for a second administrator (R-7.27). A duplicate address on page creation stays on /content/create with no message (R-7.22). A new Sprint With Us draft already names Casey as chair and Robin as a second evaluator, so the adapter's steps saved valid panels. R-5.1's 'panel of one' was saved as Robin plus Emery as chair. Marking a second chair moved the chair rather than adding one. R-5.9's panel was saved with three evaluators and Casey still in the separate Chair field (R-5.1, R-5.9, R-1.55). Devon was added and 'Opportunity Changes Published' shown, but no mail reached them within 10 seconds (R-5.17). The panel member is shown 'Not Found' (R-5.18). An invalid or blank value disables 'Publish' or 'Submit' with no message on any step (R-1.10, R-1.16's inception test, R-1.18's below-one test, R-2.14). The allocation chooser offers no 101 and the service-area chooser no 'Lighthouse Keeper' (R-1.18). The seeded closed Team With Us opportunity shows no status (R-1.24). The staff profile carries no 'Permission(s)' label, so R-1.53's other four tests stop at their precondition (R-1.53). The Sprint With Us draft kept 'Draft' after the administrator's publish attempt, with every value the test gave in place (R-1.56). The qualified organization shows no Team With Us badge, and after the administrator's save every service-area box is unticked, even though the adapter's normalised names would match FULL_STACK_DEVELOPER to 'Full Stack Developer' (R-3.26). A vendor was not refused the Sprint With Us draft's attachment (R-8.25's Sprint With Us test). Caveats for the product owner: the Team With Us group may still be the adapter's fault, since its automatic filling of required fields could leave a silently invalid form, so check whether a Team With Us draft saves by hand. R-1.18's 0% test may have picked a different option, because pickOption falls back to a substring match. Tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change this ruling: a re-run with these five faults fixed that fails at the same assertion sends that criterion to the product owner. A Team With Us draft saving by hand with the same values would move R-1.8, R-1.13, R-1.48, R-1.53 and R-1.55 to adapter-wrong. Evidence that the allocation chooser replaced 0 with another value would move R-1.18 to adapter-wrong.

**Conditions:**
- product-question R-5.1
- product-question R-1.8
- product-question R-5.9
- adapter-wrong R-7.9: contentEdit.deletedSuccess is linesMatching(/deleted/i), which reads contentText and so cuts the page off at the footer, but the outcome is an alert drawn after the footer ('Page Deleted' / 'About us has been deleted.' is on the page at the failure), so it reads ''; read it with alertLines(/deleted/i), the helper for outcome alerts drawn after the footer.
- product-question R-1.10
- product-question R-7.12
- product-question R-1.13
- product-question R-2.14
- adapter-wrong R-1.15: opportunitySwuCreate.scoreWeightError and opportunityTwuCreate.scoreWeightError call messages(/100%|weight/i) on whatever step publish left the form on ('8. Attachments' at the failure), never on '6. Scoring' where the weights and their total are, so a refusal shown there cannot be read; gather it from every step with stepMessages(/100%|weight/i), as fieldError already does. The Team With Us test's publish may also never have left /create, like every Team With Us save in this run.
- adapter-wrong R-1.16: in the implementation-phase test opportunitySwuCreate.addPhase throws unbound for 'Prototype' because phaseNamed only matches the chooser's own labels 'Inception', 'Proof of Concept' and 'Implementation'; the form calls the phase between inception and implementation 'Proof of Concept', so map 'Prototype' to 'Proof of Concept'. The inception test is not shown to be a binding fault: 'Publish' stays disabled and no step shows a message.
- product-question R-5.17
- product-question R-1.18
- product-question R-5.18
- adapter-wrong R-8.20: in the proposal test fileAttachmentControl.attachmentAddress looks for an '/api/files/' link on the page as it stands, which after submitProposal is the proposal's '1. Proponent' step with an empty dialog still open, so it returns ''; close the dialog and go to the proposal's '3. Attachments' step (attachmentsStep) before reading the link. The Team With Us test is not a binding fault: its publish never left /opportunities/team-with-us/create, like every Team With Us save in this run.
- product-question R-1.21
- product-question R-7.22
- product-question R-1.24
- product-question R-7.25
- adapter-wrong R-8.25: in the proposal test fileAttachmentControl.attachmentAddress returns '' because it looks for the '/api/files/' link on the proposal's '1. Proponent' step, with an empty dialog still open, instead of on '3. Attachments'; close the dialog and go to that step before reading the link. The Sprint With Us test is not a binding fault: the vendor was not refused the draft's attachment before publication.
- product-question R-3.26
- product-question R-7.27
- adapter-wrong R-8.31: in the opportunity test removeExistingAttachment calls advanceTo('Add Attachment'), but a published opportunity shows its attachment read-only (a disabled 'R-8.31 removed from an opportunity.pdf' box, with 'Actions' in the top bar) until 'Edit' is chosen from the Actions menu, so it throws unbound; choose 'Edit' from Actions first, as addAttachment does. In the proposal test attachmentAddress returns '' from the proposal's '1. Proponent' step, with an empty dialog open; close it and go to '3. Attachments' before reading the link.
- product-question R-1.48
- product-question R-1.53
- product-question R-1.55
- product-question R-1.56
