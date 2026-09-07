# proposals



### R-2.1 · v1 · confirmed · accepted

Only a signed-in vendor who has accepted the service's terms at some point may start a proposal; a request from public sector staff, an administrator or an anonymous visitor is refused.
- cites: src/back-end/lib/permissions.ts:532
- cites: src/back-end/lib/permissions.ts:821
- cites: src/back-end/lib/permissions.ts:1358
- cites: src/back-end/lib/permissions.ts:140
- cites: README.md:5
- reconciliation: implemented-only
- given: a visitor who is not signed in, or is signed in as public sector staff or as an administrator
- when: they attempt to start a proposal against a published opportunity
- then: the request is refused and no proposal is created
- note: a vendor who has never accepted the terms is refused as well, so accepting the terms is a precondition of bidding at all, not only of submitting.

### R-2.2 · v1 · confirmed · accepted

A vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one.
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:355
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:322
- cites: src/migrations/tasks/20200210233100_unique_proposal_constraint.ts:9
- cites: docs/database-schema.md:225
- reconciliation: implemented-only
- given: a vendor who already has a proposal, in any state, against a published opportunity
- when: they start a second proposal against the same opportunity
- then: the request is refused with "You already have a proposal for this opportunity." and no second proposal is created

### D-proposals-3 · v1 · inferred · proposed

An organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused with a pointer to the existing proposal.
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:331
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:581
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:299
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:343
- reconciliation: implemented-only
- given: an opportunity that already carries a proposal naming a given organization
- when: a different vendor who administers that same organization names it on a new proposal, or an existing proposal is edited to name it
- then: the request is refused with "Please select a different organization." and the identifier of the existing proposal is returned alongside the refusal

### R-2.3 · v1 · confirmed · accepted

Submitting a proposal requires the vendor to accept both the program's terms and the service's current terms, and the act of submitting records that acceptance.
- cites: src/back-end/lib/permissions.ts:568
- cites: src/back-end/lib/permissions.ts:830
- cites: src/back-end/lib/permissions.ts:1367
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/create.tsx:475
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/create.tsx:288
- cites: CHANGELOG.md:133
- reconciliation: implemented-only
- given: a vendor with a complete proposal whose acceptance of the current terms has been reset
- when: they submit the proposal without ticking both the program terms and the service terms
- then: the submit action is unavailable, and a submission that reaches the service anyway is refused

### D-proposals-4 · v1 · inferred · proposed

A proposal saved as a draft is accepted however incomplete it is, but its attachments are checked even in draft.
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:383
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:371
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:352
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:397
- reconciliation: implemented-only
- given: a vendor filling in a new proposal with most fields still blank
- when: they save it as a draft, attaching a file that does not exist
- then: no content validation error is raised for the blank fields, and the save is refused only because of the attachment

### R-2.4 · v1 · confirmed · accepted

Only a draft proposal can be deleted, and deleting it removes it permanently.
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:944
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1537
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:1340
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1194
- cites: src/back-end/docs/proposals/code-with-us.yaml:131
- cites: src/back-end/docs/proposals/sprint-with-us.yaml:155
- reconciliation: implemented-only
- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened

### D-proposals-5 · v1 · inferred · proposed

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.
- cites: src/shared/lib/validation/proposal/code-with-us.ts:36
- cites: src/shared/lib/validation/proposal/code-with-us.ts:40
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:395
- reconciliation: implemented-only
- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response

### R-2.5 · v1 · confirmed · accepted

When an opportunity closes, every proposal submitted against it moves to the first review stage of that program and is given an anonymous proponent name numbered from one.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1494
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1503
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1484
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
- cites: docs/database-schema.md:484
- reconciliation: implemented-only
- given: a Sprint With Us or Team With Us opportunity carrying three submitted proposals and one draft
- when: its proposal deadline passes and the opportunity closes
- then: the three submitted proposals move to review of the opportunity's questions and are named "Proponent 1", "Proponent 2" and "Proponent 3", and the draft is left alone
- note: the numbering follows the order the proposals happen to be read in, so it is stable once assigned but not meaningful in itself.

### D-proposals-6 · v1 · inferred · proposed

A Code With Us proponent is either a named individual with a legal name, an email address and a full postal address, or one of the organizations the vendor belongs to.
- cites: src/shared/lib/resources/proposal/code-with-us.ts:184
- cites: src/shared/lib/validation/proposal/code-with-us.ts:115
- cites: src/back-end/lib/validation.ts:774
- reconciliation: implemented-only
- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response

### R-2.6 · v1 · confirmed · accepted

A vendor cannot see the history of their own Code With Us proposal, although they can see the history of their own Sprint With Us and Team With Us proposals.
- cites: src/back-end/lib/permissions.ts:515
- cites: src/back-end/lib/permissions.ts:766
- cites: src/back-end/lib/permissions.ts:1300
- cites: src/back-end/lib/db/proposal/code-with-us.ts:355
- reconciliation: defect
- given: a vendor holding one Code With Us proposal and one Sprint With Us proposal, both scored
- when: they open each proposal
- then: the Sprint With Us proposal shows its history and the Code With Us proposal shows none
- superseded-by: R-2.9
- note: the three programs otherwise treat history identically, and only the Code With Us rule omits the proposal's own author. Nothing in the code or documents says the omission is deliberate, so a human should rule on whether Code With Us should gain the author or the other two should lose them; no replacement criterion is offered here.
- note: superseded by R-2.9

### R-2.7 · v2 · confirmed · accepted

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.
- cites: src/back-end/docs/proposals/code-with-us.yaml:171
- cites: src/back-end/docs/proposals/sprint-with-us.yaml:240
- cites: src/back-end/docs/proposals/sprint-with-us.yaml:97
- cites: src/back-end/docs/proposals/code-with-us.yaml:126
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:296
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:566
- reconciliation: conflicting
- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- note: the descriptions say a proposal is created as "DRAFT" or "PUBLISHED", but the service accepts only draft or submitted and rejects "PUBLISHED" outright.
- note: the Sprint With Us description lists actions "scoreQuestions", "screenInToCodeChallenge" and "screenOutFromCodeChallenge" that the service no longer accepts; question scoring now happens through the evaluation panel, and the only screening actions are into and out of the team scenario. Team With Us still has a "scoreQuestions" action, so the description is stale rather than wrong in principle.
- note: the descriptions say deleting a proposal requires the opportunity to be in draft; the service requires only that the proposal itself be a draft and does not look at the opportunity at all.

### D-proposals-8 · v1 · inferred · proposed

A proposal cannot be submitted to an opportunity that is not published or whose proposal deadline has passed.
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:321
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
- cites: src/shared/lib/resources/proposal/code-with-us.ts:305
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:413
- cites: src/shared/lib/resources/proposal/team-with-us.ts:320
- reconciliation: implemented-only
- given: an opportunity whose proposal deadline has passed
- when: a vendor submits a draft proposal against it, or creates a new proposal already marked as submitted
- then: both requests are refused with "This opportunity is no longer accepting proposals." and the proposal stays in draft or is not created

### R-2.8 · v1 · confirmed · accepted

A Team With Us proposal is accepted however high its proposed cost, even when the hourly rates it names would exhaust the opportunity's budget before the contract ends.
- cites: src/shared/lib/validation/proposal/team-with-us.ts:147
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:438
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:747
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:239
- reconciliation: defect
- given: a Team With Us opportunity with a stated maximum budget
- when: a vendor submits a proposal whose hourly rates over the opportunity's working days come to more than that budget
- then: the submission is accepted
- superseded-by: R-2.10
- note: the service carries a rule that computes exactly this total and rejects it when it exceeds the budget, but nothing calls that rule on either the create or the edit path. Sprint With Us applies the equivalent ceiling, so the omission looks like an oversight rather than a decision; a human should rule on whether the new system enforces the ceiling. No replacement criterion is offered until that ruling.
- note: superseded by R-2.10

### D-proposals-9 · v1 · inferred · proposed

A Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program, and the organization is re-checked at the moment of submission.
- cites: src/back-end/lib/permissions.ts:830
- cites: src/shared/lib/resources/organization.ts:131
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:954
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:394
- reconciliation: implemented-only
- given: a draft Sprint With Us proposal naming an organization that has since lost its qualified status
- when: the vendor submits it
- then: the submission is refused, and a proposal naming no organization at all is refused with "An organization must be specified before submitting."

### R-2.9 · v1 · confirmed · accepted

A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.
- replaces: R-2.6

### D-proposals-10 · v1 · inferred · proposed

A Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program and that provides every service area the opportunity's resources call for.
- cites: src/back-end/lib/permissions.ts:1367
- cites: src/shared/lib/resources/organization.ts:141
- cites: src/shared/lib/validation/proposal/team-with-us.ts:177
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:457
- reconciliation: implemented-only
- given: a Team With Us opportunity calling for a service area the vendor's organization does not provide
- when: the vendor submits a proposal naming that organization
- then: the submission is refused with "The selected organization does not satisfy this opportunity's service areas."

### R-2.10 · v1 · confirmed · accepted

A Team With Us proposal is refused when the hourly rates it names, applied at each resource's target allocation across the opportunity's contract period, come to more than the opportunity's maximum budget; the check runs on both the create and the edit path, as the equivalent Sprint With Us check does.
- replaces: R-2.8

### D-proposals-11 · v1 · inferred · proposed

Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the same person may not be named twice.
- cites: src/back-end/lib/validation.ts:964
- cites: src/back-end/lib/validation.ts:1028
- cites: src/back-end/lib/validation.ts:360
- reconciliation: implemented-only
- given: a proposal naming a person whose membership of the organization is pending, inactive or absent
- when: the vendor submits it
- then: the submission is refused with "User is not an active member of the organization.", and naming the same person twice is refused with "Please select unique team members."
- note: a team member whose membership is still pending is shown as pending on the proposal rather than being hidden, so a vendor can see why the submission is blocked.

### D-proposals-12 · v1 · inferred · proposed

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name exactly one scrum master, cover every capability the opportunity requires, and stay within each phase's budget and the opportunity's total budget.
- cites: src/back-end/lib/validation.ts:1064
- cites: src/back-end/lib/validation.ts:1051
- cites: src/back-end/lib/validation.ts:1117
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:239
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:67
- reconciliation: implemented-only
- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason

### D-proposals-13 · v1 · inferred · proposed

A Team With Us proposal must name at least one person against a resource the opportunity asked for, each with an hourly rate of at least one dollar.
- cites: src/back-end/lib/validation.ts:360
- cites: src/shared/lib/validation/proposal/team-with-us.ts:201
- cites: src/shared/lib/resources/proposal/team-with-us.ts:206
- reconciliation: implemented-only
- given: a Team With Us opportunity listing one or more resources
- when: a vendor submits a proposal with no team members, with an hourly rate below one dollar, or naming a resource the opportunity does not list
- then: the submission is refused and the member, the rate or the resource is named as the reason

### D-proposals-14 · v1 · inferred · proposed

A response to an opportunity question is rejected if it is empty or longer than the word limit that question carries, or if it answers a question the opportunity does not ask.
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:180
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:166
- cites: src/shared/lib/validation/proposal/team-with-us.ts:73
- reconciliation: implemented-only
- given: an opportunity question carrying a word limit
- when: a vendor submits a response that is empty, that exceeds the word limit, or that is numbered against no question of the opportunity
- then: the submission is rejected with "No matching opportunity question." or with the word-limit error against that response

### D-proposals-15 · v1 · inferred · proposed

Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:684
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:663
- reconciliation: implemented-only
- given: a submitted Sprint With Us or Team With Us proposal
- when: the vendor edits it and names a different organization
- then: the edit is refused with "Organization cannot be changed once the proposal has been submitted", while the same edit on a draft or withdrawn proposal is accepted

### D-proposals-16 · v1 · inferred · proposed

A vendor may withdraw a submitted proposal at any time, and may put a withdrawn proposal back in only while the opportunity is still accepting proposals.
- cites: src/shared/lib/resources/proposal/code-with-us.ts:312
- cites: src/shared/lib/resources/proposal/code-with-us.ts:357
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/edit/tab/proposal.tsx:1146
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/edit/tab/proposal.tsx:1169
- reconciliation: implemented-only
- given: a submitted proposal on an opportunity whose deadline has passed
- when: the vendor withdraws it, and then tries to submit it again
- then: the withdrawal is accepted and the re-submission is refused, whereas before the deadline both are accepted

### D-proposals-18 · v1 · inferred · proposed

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.
- cites: src/back-end/lib/permissions.ts:440
- cites: src/back-end/lib/permissions.ts:444
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:507
- cites: src/back-end/lib/db/proposal/code-with-us.ts:583
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:910
- reconciliation: implemented-only
- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused

### D-proposals-19 · v1 · inferred · proposed

Public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed, and never see drafts or unsubmitted proposals.
- cites: src/back-end/lib/permissions.ts:421
- cites: src/back-end/lib/permissions.ts:444
- cites: src/shared/lib/resources/proposal/code-with-us.ts:403
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:344
- cites: src/back-end/docs/proposals/code-with-us.yaml:23
- reconciliation: implemented-only
- given: a published opportunity whose deadline has not yet passed and which carries both draft and submitted proposals
- when: the opportunity's author or an administrator lists its proposals
- then: the request is refused, and once the opportunity has closed the list shows the submitted proposals but never the drafts
- note: a withdrawn proposal is visible to administrators but hidden from the opportunity's own author.

### D-proposals-21 · v1 · inferred · proposed

A Code With Us proposal is scored once out of 100 to two decimal places, and entering that score moves the proposal from review to evaluated.
- cites: src/shared/lib/validation/proposal/code-with-us.ts:54
- cites: src/back-end/lib/db/proposal/code-with-us.ts:965
- cites: src/back-end/lib/db/proposal/code-with-us.ts:994
- cites: src/back-end/docs/proposals/code-with-us.yaml:205
- reconciliation: implemented-only
- given: a Code With Us proposal under review
- when: the opportunity's author enters a score of 87
- then: the proposal becomes evaluated, its history records that a score of "87%" was entered, and a score above 100, below zero or with more than two decimal places is refused

### D-proposals-22 · v1 · inferred · proposed

When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1038
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1020
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1544
- reconciliation: implemented-only
- given: an opportunity in evaluation with two proposals under review and one already disqualified
- when: the last of the two is scored
- then: the opportunity moves to processing with the note "Automatically moved to Processing as all proposals have been evaluated.", and disqualified, withdrawn and draft proposals are not counted

### D-proposals-23 · v1 · inferred · proposed

Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1100
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1140
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1228
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:901
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:405
- reconciliation: implemented-only
- given: a Sprint With Us opportunity still in its code challenge stage
- when: someone enters a team scenario score for one of its proposals
- then: the request is refused with "The opportunity is not in the correct stage of evaluation to perform that action."

### D-proposals-24 · v1 · inferred · proposed

After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1896
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1927
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1840
- cites: src/shared/config.ts:56
- cites: src/shared/config.ts:58
- reconciliation: implemented-only
- given: a Sprint With Us opportunity with six proposals scored on its questions, one of them below a question's minimum score
- when: the panel's agreed scores are finalised
- then: the proposal below the minimum is left behind, the remaining five are ranked by their question score and the top four move to the code challenge, while on a Team With Us opportunity the top three move to the challenge

### D-proposals-25 · v1 · inferred · proposed

A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1563
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1629
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1283
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1447
- reconciliation: implemented-only
- given: two Sprint With Us proposals still in contention, bidding 100,000 and 200,000
- when: a team scenario score is entered for the higher bid
- then: that proposal is given a price score of 50, its history records the calculated price score, and it becomes fully evaluated
- note: a Team With Us bid is the sum of each named person's hourly rate weighted by the target allocation of the resource they are named against, rather than a stated total cost.

### D-proposals-26 · v1 · inferred · proposed

A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1960
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1973
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:399
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1694
- cites: src/shared/lib/resources/proposal/team-with-us.ts:306
- reconciliation: implemented-only
- given: an opportunity whose questions, challenge, scenario and price carry stated weights
- when: a proposal has a score for every one of those stages
- then: its total is those scores combined in the stated proportions, and it takes a rank among the other fully evaluated proposals, highest total first

### D-proposals-27 · v1 · inferred · proposed

A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over.
- cites: src/back-end/lib/permissions.ts:486
- cites: src/back-end/lib/permissions.ts:792
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:562
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:583
- reconciliation: implemented-only
- given: a vendor's proposal that has been scored but whose opportunity has not been awarded
- when: the vendor opens their proposal
- then: no score and no rank are shown, and both appear once the proposal becomes awarded or not awarded

### D-proposals-28 · v1 · inferred · proposed

Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1136
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1160
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1673
- cites: src/shared/lib/resources/proposal/code-with-us.ts:368
- reconciliation: implemented-only
- given: an opportunity with one evaluated proposal, one already disqualified and one withdrawn
- when: an administrator awards the evaluated proposal
- then: that proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep the state they were in
- note: only a proposal that is fully evaluated, or one previously passed over, may be awarded.

### D-proposals-29 · v1 · inferred · proposed

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.
- cites: src/shared/lib/validation/proposal/code-with-us.ts:48
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:283
- cites: src/back-end/lib/db/proposal/code-with-us.ts:920
- cites: src/shared/lib/resources/proposal/code-with-us.ts:320
- reconciliation: implemented-only
- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated

### D-proposals-30 · v1 · inferred · proposed

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1282
- cites: src/back-end/lib/db/proposal/code-with-us.ts:994
- cites: docs/database-schema.md:206
- cites: src/shared/lib/resources/proposal/code-with-us.ts:111
- reconciliation: implemented-only
- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note

### D-proposals-32 · v1 · inferred · proposed

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:21
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:46
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:100
- cites: src/back-end/lib/mailer/notifications/proposal/sprint-with-us.tsx:108
- cites: src/back-end/lib/mailer/notifications/proposal/team-with-us.tsx:52
- reconciliation: implemented-only
- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator

### D-proposals-33 · v1 · inferred · proposed

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/export/one.tsx:132
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/views/exported-proposal.tsx:114
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/export/one.tsx:115
- cites: src/front-end/typescript/lib/app/router.ts:304
- reconciliation: implemented-only
- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too

### D-proposals-35 · v1 · open · obsolete

It cannot be determined whether the Sprint With Us stage between reviewing team questions and the code challenge is still reachable.
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:54
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:428
- cites: src/migrations/tasks/20240718222006_swu-evaluation-tables.ts:37
- cites: src/migrations/tasks/20240718222006_swu-evaluation-tables.ts:78
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1941
- reconciliation: conflicting
- given: a Sprint With Us proposal under review on its team questions
- when: it is moved to the stage the running code calls "evaluated questions"
- then: it is not established whether the move succeeds or is rejected
- note: the running code still allows this move and labels the stage with the value "EVALUATED_QUESTIONS", but the migration that introduced the evaluation panel renamed every stored occurrence of that value to "DEPRECATED_EVALUATED_QUESTIONS" and restricted the stored values to a list that no longer contains the old one. No later migration puts it back. On that reading the move would be rejected by the store even though the code offers it. The live path bypasses this stage entirely: finalising the panel's agreed scores moves proposals straight from review of the questions to the code challenge.
- note: The stage between reviewing team questions and the code challenge is deprecated in the old system by its own migration, which comments 'Unused status; deprecate', rewrites every stored occurrence and narrows the permitted values so the old spelling can no longer be stored; only two migrations ever touch that constraint and neither restores it, and the live path moves proposals straight from question review to the code challenge. The new system carries no stage between them.

### D-proposals-37 · v1 · inferred · obsolete

The address that lists proposals shows nothing but the words "Proposal List".
- cites: src/front-end/typescript/lib/pages/proposal/list.tsx:37
- cites: src/front-end/typescript/lib/app/router.ts:484
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:910
- reconciliation: defect
- given: any visitor, signed in or not
- when: they open the proposals list address
- then: a page appears carrying only the words "Proposal List" and no proposals at all
- note: the page is a stub that was never finished; the working place to see one's proposals is the vendor's dashboard, which lists their own proposals and their organizations' proposals under two headings. Nothing should carry this address forward without a decision about what belongs on it.
- note: An address that renders nothing but the words 'Proposal List' is an unfinished stub rather than behaviour to carry forward. A vendor reaches their own and their organizations' proposals from the dashboard, which D-proposals-18 already states; the proposal-list-stub entry in spec/contract/surface.yaml is removed with it.

### D-proposals-38 · v1 · inferred · proposed

Only public sector staff and administrators may take away every proposal of an opportunity in one document, and they choose whether that document names the proponents.
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/export/all.tsx:62
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/export/all.tsx:60
- cites: src/front-end/typescript/lib/app/router.ts:115
- cites: src/front-end/typescript/lib/app/router.ts:276
- reconciliation: implemented-only
- given: a closed opportunity carrying several submitted proposals
- when: a vendor opens the address that exports all of them, and then the opportunity's author opens it
- then: the vendor is refused, the author receives every proposal they are entitled to see in one document, and the author can ask for the same document with the proponents named anonymously
