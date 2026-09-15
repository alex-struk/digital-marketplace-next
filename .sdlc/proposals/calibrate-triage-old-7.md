---
gate: G3
question: "29 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.24, R-5.24, R-2.25, R-5.25, R-7.25, R-8.25, R-3.26, R-3.27, R-4.27, R-5.27, R-7.27, R-3.28, R-5.28, R-8.29, R-1.31, R-8.31, R-1.32, R-5.32, R-1.35, R-2.35, R-2.36, R-5.36, R-2.37, R-2.38, R-1.39, R-1.48, R-1.53, R-1.55, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-15T01:18:31.048Z
---

# 29 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.24, R-5.24, R-2.25, R-5.25, R-7.25, R-8.25, R-3.26, R-3.27, R-4.27, R-5.27, R-7.27, R-3.28, R-5.28, R-8.29, R-1.31, R-8.31, R-1.32, R-5.32, R-1.35, R-2.35, R-2.36, R-5.36, R-2.37, R-2.38, R-1.39, R-1.48, R-1.53, R-1.55, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

29 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-2.24 · v1

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.

- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused
- test: tests/acceptance/proposals/R-2.24.spec.ts

**a vendor sees only the proposals they authored** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/a7c9e111-c7de-4e84-9d7f-dedd242f0f06/proposals/create; the page shows no message
```

**a vendor additionally sees the proposals of organizations they own or administer, under a separate heading** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**a vendor never sees another vendor's proposal** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/e96717b1-9ec9-4d8e-a1cd-f3ca7d9f31f8/proposals/create; the page shows no message
```

### R-5.24 · v1

An evaluator may change their own evaluation only while it is still a draft and the opportunity is still in individual question evaluation; once submitted it cannot be changed at all.

- given: an evaluator who has submitted their scores for a proponent
- when: they try to change a score or a comment
- then: the change is refused and the submitted scores stand
- test: tests/acceptance/evaluation/R-5.24.spec.ts

**an evaluator may change their own evaluation while it is still a draft** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"absent"[39m
```

**once submitted an evaluation cannot be changed at all** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-2.25 · v1

Public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed, and never see drafts or unsubmitted proposals.

- given: a published opportunity whose deadline has not yet passed and which carries both draft and submitted proposals
- when: the opportunity's author or an administrator lists its proposals
- then: the request is refused, and once the opportunity has closed the list shows the submitted proposals but never the drafts
- test: tests/acceptance/proposals/R-2.25.spec.ts

**public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/79a5bd54-5af0-427b-be25-87f0e919a015/proposals/create; the page shows no message
```

### R-5.25 · v2

An evaluator submits all of their existing draft evaluations for an opportunity in a single action, and the whole set is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." — none of it submitted — unless every evaluation in the set carries an in-range score and a comment for every question of the opportunity; the service does not check that the evaluator holds an evaluation for every proponent, so a proponent they never opened is simply absent from the set rather than blocking the submission.

- given: an evaluator with three proponents to score and a complete draft for only two of them
- when: they submit their scores for consensus
- then: the submission is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." and none of the three is submitted
- test: tests/acceptance/evaluation/R-5.25.spec.ts

**the whole set is refused, none of it submitted, unless every evaluation in it is complete** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

**a proponent the evaluator never opened is absent from the set rather than blocking it** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-7.25 · v1

A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so.

- given: an administrator on the managing screen of a page the service needs
- when: they look for the ways to change it
- then: a warning explains that the service needs this page at this address, the address cannot be typed over, no removal is offered, and a request to rename or remove it made another way is refused
- test: tests/acceptance/content/R-7.25.spec.ts

**the managing screen of a page the service depends on says the service needs it here: its address cannot be typed over and no removal is offered** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a page the service depends on may have its title and body changed** — failed

```
Error: unbound: content-edit.start_editing — no control labelled "Edit" on http://localhost:3000/content/disclaimer/edit
```

### R-8.25 · v1

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- test: tests/acceptance/files/R-8.25.spec.ts

**an attachment on a Code With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**an attachment on an opportunity that is not yet publicly visible is readable by the opportunity's creator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment on a proposal is readable by whoever may read that proposal** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/e194303c-2145-497f-a5f7-ecade6bc35cc/proposals/create; the page shows no message
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
Error: unbound: organization-create.create_organization — no field on http://localhost:3000/organizations/create takes "addressLineTwo"
```

### R-3.27 · v1

Accepting an organization's Sprint With Us or Team With Us terms records the date of acceptance, and a second attempt to accept the same terms for the same organization is refused.

- given: an organization whose Sprint With Us terms have not been accepted
- when: its owner reads the terms and accepts them, and then tries to accept them again
- then: the first acceptance is recorded with its date and shown on the qualification page, and the second is refused with a message saying the terms have already been accepted
- test: tests/acceptance/organizations/R-3.27.spec.ts

**a second attempt to accept the same terms for the same organization is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m""[39m
Received: [31m"Cedar Hollow Systems Inc. agreed to the Sprint With Us Terms & Conditions on Sep 14, 2026 at 5:46 PM."[39m
```

### R-4.27 · v2

A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.

- given: a person editing their own profile
- when: they clear the name, or enter an email address that is not in a valid format
- then: the profile is not saved and the offending field is reported as invalid, while the same profile saves with the job title and picture left empty
- test: tests/acceptance/users/R-4.27.spec.ts

**a profile requires a name, so clearing the name is refused and the profile is not saved** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a profile requires a name of no more than one hundred characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a profile requires an email address in a valid format** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the job title is limited to one hundred characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.27 · v2

An opportunity moves from individual evaluation to consensus by itself once the submitted individual scores number one per question per proponent per evaluator, counted against the panel and the questions of the opportunity's most recent version but only over the proponents named in the submission that triggers the check, and the chair and the opportunity's owner are then told it is ready.

- given: an opportunity in individual question evaluation with two evaluators, three proponents and four questions
- when: the second evaluator submits the last of their scores, bringing the total to twenty-four submitted scores
- then: the opportunity moves to consensus, and the chair and the opportunity's owner are notified
- test: tests/acceptance/evaluation/R-5.27.spec.ts

**an opportunity moves to consensus once every evaluator has submitted, and the chair and the owner are told** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-7.27 · v1

The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded.

- given: a page the service created for itself and has never been edited, and a page an administrator created and another administrator later changed
- when: an administrator opens each page's managing screen
- then: the first names "System" as both publisher and last editor, and the second names the two people, each linked to their profile
- test: tests/acceptance/content/R-7.27.spec.ts

**the managing screen of a page the service created for itself and nobody has edited names the service itself as both publisher and last editor** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"System"[39m
Received string:    [31m""[39m
```

### R-3.28 · v1

Only an administrator may set which service areas an organization is approved for, and saving a selection replaces the organization's previous approvals entirely.

- given: an organization approved for two service areas
- when: an administrator edits the service areas, leaves one of the two ticked, ticks a third, and saves
- then: the organization is approved for exactly the two areas that were ticked and no longer for the one that was cleared, and the same page offers no editing control to the organization's own owner
- test: tests/acceptance/organizations/R-3.28.spec.ts

**when an administrator saves a selection of service areas the organization is approved for exactly the areas that were ticked and no longer for the one that was cleared** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"FULL_STACK_DEVELOPER"[39m
Received string:    [31m"Full Stack Developer[39m
[31mData Professional[39m
[31mAgile Coach[39m
[31mDevOps Specialist[39m
[31mService Designer"[39m
```

### R-5.28 · v2

Once an opportunity reaches consensus, every member of its panel can read every evaluator's individual scores and comments for a proponent, and before then no one but the evaluator who wrote them can; an administrator who is not on the panel gains access to individual evaluations only after the question stages have passed, at code challenge, team scenario or awarded, whereas a consensus may be read by an administrator at any stage.

- given: an opportunity in individual question evaluation with two evaluators who have both scored a proponent
- when: the first evaluator asks to see the second's scores, and asks again after the opportunity has moved to consensus
- then: the first request is refused and the second returns the second evaluator's scores and comments beside their name
- test: tests/acceptance/evaluation/R-5.28.spec.ts

**once an opportunity reaches consensus every panel member can read every evaluator's individual scores and comments** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-8.29 · v1

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — failed

```
TimeoutError: page.waitForEvent: Timeout 15000ms exceeded while waiting for event "filechooser"
=========================== logs ===========================
waiting for event "filechooser"
============================================================
```

### R-1.31 · v1

Public sector staff cannot see the proposals submitted against an opportunity until it has left the published state.

- given: a published opportunity that has received proposals
- when: its author or an administrator asks to see the proposals
- then: the request is refused until the opportunity has closed and moved to an evaluation stage
- test: tests/acceptance/opportunities/R-1.31.spec.ts

**public sector staff cannot see the proposals submitted against an opportunity while it is published** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/proposals/create; the page shows no message
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**deleting the opportunity an attachment hangs on withdraws the read path the file held through that opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/a206daaa-1871-4846-9cf9-d93a6f2e53e2/proposals/create; the page shows no message
```

### R-1.32 · v1

An addendum of 1 to 5,000 characters may be added to any opportunity that is no longer a draft, by an administrator or by the staff member who created it, and cannot be removed afterwards.

- given: a published opportunity
- when: its author adds an addendum
- then: the addendum is appended to the opportunity with its author and date, an entry is added to the opportunity's history, and there is no action that removes it
- test: tests/acceptance/opportunities/R-1.32.spec.ts

**an addendum may be added to an opportunity that is no longer a draft by the staff member who created it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.32 an addendum the opportunity's own author wrote."[39m
Received string:    [31m""[39m
```

**an addendum may be added to an opportunity that is no longer a draft by an administrator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.32 an addendum an administrator wrote."[39m
Received string:    [31m""[39m
```

**an addendum of more than five thousand characters is refused** — failed

```
Error: opportunity-cwu-edit.add_addendum — "Publish Addendum" is disabled on http://localhost:3000/opportunities/code-with-us/5caf520a-85f1-4409-9697-1749f41e0831/edit?tab=addenda; the page shows: Code With Us: R-1.32 published opportunity offered an addendum that runs too long
```

### R-5.32 · v1

Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.

- given: a Sprint With Us opportunity in consensus with six proponents, five of whom met every minimum score
- when: the consensus scores are finalised
- then: every proponent's history records the agreed scores question by question, the four highest scoring of the five are moved into the code challenge, and the opportunity moves to the code challenge stage
- test: tests/acceptance/evaluation/R-5.32.spec.ts

**finalising records the agreed scores, screens in the proponents that met every minimum, and moves the opportunity on** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

### R-1.35 · v1

Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator edits it or adds an addendum
- then: its watchers, its proponents and its author are each notified once
- test: tests/acceptance/opportunities/R-1.35.spec.ts

**changing an opportunity that is neither a draft nor cancelled notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m8[39m
Received:   [31m8[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**adding an addendum to an opportunity that is neither a draft nor cancelled notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m8[39m
Received:   [31m8[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.35 · v1

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- test: tests/acceptance/proposals/R-2.35.spec.ts

**every change of state against a proposal is recorded in its history** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.36 · v1

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- test: tests/acceptance/proposals/R-2.36.spec.ts

**submitting a proposal sends a confirmation to the submitting vendor** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/b8ce834e-7444-46eb-bbba-de8bdafa89be/proposals/create; the page shows no message
```

**withdrawing a proposal sends a notice to the vendor and to every administrator** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/a2a97f60-5419-49d0-bd34-c3a560423221/proposals/create; the page shows no message
```

### R-5.36 · v1

The two programs run the same evaluation from end to end, differing only in what the questions are called, how many proponents are carried forward, and what the stage that follows is named.

- given: one Sprint With Us and one Team With Us opportunity, each closing with proponents to evaluate
- when: each is taken through individual evaluation, consensus and finalising
- then: both follow published, individual question evaluation, consensus, and then their own next stage — the code challenge for Sprint With Us and the challenge for Team With Us — and neither can skip a stage or go back
- test: tests/acceptance/evaluation/R-5.36.spec.ts

**a Sprint With Us opportunity runs from individual evaluation through consensus to the Code Challenge** — failed

```
Error: evaluation-individual-list-swu.submit_scores_for_consensus — "Submit Scores for Consensus" is disabled on http://localhost:3000/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluation; the page shows no message
```

**a Team With Us opportunity runs the same course and ends at the Challenge** — failed

```
Error: unbound: evaluation-individual-create-twu.enter_question_score — no field labelled "Score" on http://localhost:3000/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/proposals/00000000-0000-4000-8000-000000000841/resource-questions/evaluations/create?tab=resourceQuestions
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**anyone entitled to read a proposal can take away a printable copy of it** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/efee475f-eb7d-48f1-9d3e-975df98ae3ab/proposals/create; the page shows no message
```

**the vendor's own copy of a Sprint With Us proposal names the organization** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

### R-2.38 · v1

Only public sector staff and administrators may take away every proposal of an opportunity in one document, and they choose whether that document names the proponents.

- given: a closed opportunity carrying several submitted proposals
- when: a vendor opens the address that exports all of them, and then the opportunity's author opens it
- then: the vendor is refused, the author receives every proposal they are entitled to see in one document, and the author can ask for the same document with the proponents named anonymously
- test: tests/acceptance/proposals/R-2.38.spec.ts

**a vendor may not take away every proposal of an opportunity in one document** — failed

```
Error: proposal-cwu-create.submit_proposal — "Submit Proposal" is disabled on http://localhost:3000/opportunities/code-with-us/6061c7b9-de2b-43a0-858f-b816458dbe94/proposals/create; the page shows no message
```

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**the opportunity list can be narrowed by program** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity narrowed by program"[39m
Received string:        [31m"[7mR-1.39 published opportunity narrowed by program[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Jun 1, 2030 at 4:59 PM PDT[39m
[31mA published opportunity that exists before any test runs.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mWatch"[39m
```

**the opportunity list can be narrowed by state** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('All Opportunity Statuses', { exact: true }).visible().first()[22m
[2m    - locator resolved to <div id="react-select-3-placeholder" class="react-select__placeholder css-1r5cbbl-placeholder">All Opportunity Statuses</div>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div data-value="" class="react-select__input-container css-19bb58m">…</div> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div data-value="" class="react-select__input-container css-19bb58m">…</div> intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 100ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
… 46 more line(s)
```

**the opportunity list can be narrowed to remote-friendly opportunities only** — failed

```
Error: unbound: opportunity-cwu-create.publish — no field on http://localhost:3000/opportunities/code-with-us/create takes "remoteDescription"
```

**the opportunity list can be narrowed by free text matched against title and location** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"R-1.39 published opportunity in another town"[39m
Received string:        [31m"[7mR-1.39 published opportunity in another town[27m[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mKamloops[39m
[31mRemote OK[39m
[31mR-1.39 published opportunity about kittiwakes[39m
[31mCode With Us[39m
[31mPublished[39m
[31mCloses Oct 29, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mSeeded published Code With Us opportunity[39m
… 8 more line(s)
```

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**creating an opportunity with its state set to published is refused unless the requester is an administrator** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**an administrator may delete a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-1.55 · v1

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.

- test: tests/acceptance/opportunities/R-1.55.spec.ts

**a Sprint With Us opportunity's evaluation panel is rejected with fewer than two members** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when it names the same person twice** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when no member is the chair** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity's evaluation panel is rejected when it names anyone who is not a public sector employee** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Team With Us opportunity's evaluation panel is rejected with fewer than two members** — failed

```
Error: opportunity-twu-create.save_draft — the save never reached the record's address; still on http://localhost:3000/opportunities/team-with-us/create; the page shows no message
```

### R-1.56 · v1

Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.

- test: tests/acceptance/opportunities/R-1.56.spec.ts

**once an opportunity is published, an administrator may change its details** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.56 the description an administrator put there."[39m
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
[31mCode With Us: R-1.56 published opportunity an administrator changed[39m
[31mPublished Sep 14, 2026[39m
[31m|[39m
[31mUpdated Sep 14, 2026[39m
[31mStatus[39m
[31mPublished[39m
[31mCreated By[39m
… 22 more line(s)
```

**once an opportunity is published, a request to change its details from the public sector employee who created it is refused** — failed

```
Error: unbound: opportunity-cwu-edit.edit_details — no "Actions" menu on http://localhost:3000/opportunities/code-with-us/0e000952-3de0-4c89-9de4-a169d80db90b/edit?tab=opportunity
```

**the same rule governs a published Sprint With Us opportunity** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
```

**the same rule governs a published Team With Us opportunity** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — no panel member matching "00000000-0000-4000-8000-000000000102"
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

