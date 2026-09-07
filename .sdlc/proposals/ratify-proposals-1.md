---
gate: G1
question: "Which of the proposals criteria that are still inferred or open become the contract?"
recommendation: "28 criterion(s) in proposals are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T03:26:07.438Z
---

# Which of the proposals criteria that are still inferred or open become the contract?

**Recommendation.** 28 criterion(s) in proposals are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

28 criterion(s) in the **proposals** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-proposals-3 · v1 · inferred · recovered

An organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused with a pointer to the existing proposal.

- reconciliation: implemented-only
- given: an opportunity that already carries a proposal naming a given organization
- when: a different vendor who administers that same organization names it on a new proposal, or an existing proposal is edited to name it
- then: the request is refused with "Please select a different organization." and the identifier of the existing proposal is returned alongside the refusal
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:331
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:581
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:299
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:343

### D-proposals-4 · v1 · inferred · recovered

A proposal saved as a draft is accepted however incomplete it is, but its attachments are checked even in draft.

- reconciliation: implemented-only
- given: a vendor filling in a new proposal with most fields still blank
- when: they save it as a draft, attaching a file that does not exist
- then: no content validation error is raised for the blank fields, and the save is refused only because of the attachment
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:383
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:371
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:352
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:397

### D-proposals-5 · v1 · inferred · recovered

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.

- reconciliation: implemented-only
- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- cites: src/shared/lib/validation/proposal/code-with-us.ts:36
- cites: src/shared/lib/validation/proposal/code-with-us.ts:40
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:395

### D-proposals-6 · v1 · inferred · recovered

A Code With Us proponent is either a named individual with a legal name, an email address and a full postal address, or one of the organizations the vendor belongs to.

- reconciliation: implemented-only
- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- cites: src/shared/lib/resources/proposal/code-with-us.ts:184
- cites: src/shared/lib/validation/proposal/code-with-us.ts:115
- cites: src/back-end/lib/validation.ts:774

### D-proposals-8 · v1 · inferred · recovered

A proposal cannot be submitted to an opportunity that is not published or whose proposal deadline has passed.

- reconciliation: implemented-only
- given: an opportunity whose proposal deadline has passed
- when: a vendor submits a draft proposal against it, or creates a new proposal already marked as submitted
- then: both requests are refused with "This opportunity is no longer accepting proposals." and the proposal stays in draft or is not created
- cites: src/back-end/lib/resources/proposal/code-with-us.ts:321
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
- cites: src/shared/lib/resources/proposal/code-with-us.ts:305
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:413
- cites: src/shared/lib/resources/proposal/team-with-us.ts:320

### D-proposals-9 · v1 · inferred · recovered

A Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program, and the organization is re-checked at the moment of submission.

- reconciliation: implemented-only
- given: a draft Sprint With Us proposal naming an organization that has since lost its qualified status
- when: the vendor submits it
- then: the submission is refused, and a proposal naming no organization at all is refused with "An organization must be specified before submitting."
- cites: src/back-end/lib/permissions.ts:830
- cites: src/shared/lib/resources/organization.ts:131
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:954
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:394

### D-proposals-10 · v1 · inferred · recovered

A Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program and that provides every service area the opportunity's resources call for.

- reconciliation: implemented-only
- given: a Team With Us opportunity calling for a service area the vendor's organization does not provide
- when: the vendor submits a proposal naming that organization
- then: the submission is refused with "The selected organization does not satisfy this opportunity's service areas."
- cites: src/back-end/lib/permissions.ts:1367
- cites: src/shared/lib/resources/organization.ts:141
- cites: src/shared/lib/validation/proposal/team-with-us.ts:177
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:457

### D-proposals-11 · v1 · inferred · recovered

Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the same person may not be named twice.

- reconciliation: implemented-only
- given: a proposal naming a person whose membership of the organization is pending, inactive or absent
- when: the vendor submits it
- then: the submission is refused with "User is not an active member of the organization.", and naming the same person twice is refused with "Please select unique team members."
- cites: src/back-end/lib/validation.ts:964
- cites: src/back-end/lib/validation.ts:1028
- cites: src/back-end/lib/validation.ts:360
- note: a team member whose membership is still pending is shown as pending on the proposal rather than being hidden, so a vendor can see why the submission is blocked.

### D-proposals-12 · v1 · inferred · recovered

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name exactly one scrum master, cover every capability the opportunity requires, and stay within each phase's budget and the opportunity's total budget.

- reconciliation: implemented-only
- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- cites: src/back-end/lib/validation.ts:1064
- cites: src/back-end/lib/validation.ts:1051
- cites: src/back-end/lib/validation.ts:1117
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:239
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:67

### D-proposals-13 · v1 · inferred · recovered

A Team With Us proposal must name at least one person against a resource the opportunity asked for, each with an hourly rate of at least one dollar.

- reconciliation: implemented-only
- given: a Team With Us opportunity listing one or more resources
- when: a vendor submits a proposal with no team members, with an hourly rate below one dollar, or naming a resource the opportunity does not list
- then: the submission is refused and the member, the rate or the resource is named as the reason
- cites: src/back-end/lib/validation.ts:360
- cites: src/shared/lib/validation/proposal/team-with-us.ts:201
- cites: src/shared/lib/resources/proposal/team-with-us.ts:206

### D-proposals-14 · v1 · inferred · recovered

A response to an opportunity question is rejected if it is empty or longer than the word limit that question carries, or if it answers a question the opportunity does not ask.

- reconciliation: implemented-only
- given: an opportunity question carrying a word limit
- when: a vendor submits a response that is empty, that exceeds the word limit, or that is numbered against no question of the opportunity
- then: the submission is rejected with "No matching opportunity question." or with the word-limit error against that response
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:180
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:166
- cites: src/shared/lib/validation/proposal/team-with-us.ts:73

### D-proposals-15 · v1 · inferred · recovered

Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.

- reconciliation: implemented-only
- given: a submitted Sprint With Us or Team With Us proposal
- when: the vendor edits it and names a different organization
- then: the edit is refused with "Organization cannot be changed once the proposal has been submitted", while the same edit on a draft or withdrawn proposal is accepted
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:684
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:663

### D-proposals-16 · v1 · inferred · recovered

A vendor may withdraw a submitted proposal at any time, and may put a withdrawn proposal back in only while the opportunity is still accepting proposals.

- reconciliation: implemented-only
- given: a submitted proposal on an opportunity whose deadline has passed
- when: the vendor withdraws it, and then tries to submit it again
- then: the withdrawal is accepted and the re-submission is refused, whereas before the deadline both are accepted
- cites: src/shared/lib/resources/proposal/code-with-us.ts:312
- cites: src/shared/lib/resources/proposal/code-with-us.ts:357
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/edit/tab/proposal.tsx:1146
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/edit/tab/proposal.tsx:1169

### D-proposals-18 · v1 · inferred · recovered

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.

- reconciliation: implemented-only
- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused
- cites: src/back-end/lib/permissions.ts:440
- cites: src/back-end/lib/permissions.ts:444
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:507
- cites: src/back-end/lib/db/proposal/code-with-us.ts:583
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:910

### D-proposals-19 · v1 · inferred · recovered

Public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed, and never see drafts or unsubmitted proposals.

- reconciliation: implemented-only
- given: a published opportunity whose deadline has not yet passed and which carries both draft and submitted proposals
- when: the opportunity's author or an administrator lists its proposals
- then: the request is refused, and once the opportunity has closed the list shows the submitted proposals but never the drafts
- cites: src/back-end/lib/permissions.ts:421
- cites: src/back-end/lib/permissions.ts:444
- cites: src/shared/lib/resources/proposal/code-with-us.ts:403
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:344
- cites: src/back-end/docs/proposals/code-with-us.yaml:23
- note: a withdrawn proposal is visible to administrators but hidden from the opportunity's own author.

### D-proposals-21 · v1 · inferred · recovered

A Code With Us proposal is scored once out of 100 to two decimal places, and entering that score moves the proposal from review to evaluated.

- reconciliation: implemented-only
- given: a Code With Us proposal under review
- when: the opportunity's author enters a score of 87
- then: the proposal becomes evaluated, its history records that a score of "87%" was entered, and a score above 100, below zero or with more than two decimal places is refused
- cites: src/shared/lib/validation/proposal/code-with-us.ts:54
- cites: src/back-end/lib/db/proposal/code-with-us.ts:965
- cites: src/back-end/lib/db/proposal/code-with-us.ts:994
- cites: src/back-end/docs/proposals/code-with-us.yaml:205

### D-proposals-22 · v1 · inferred · recovered

When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.

- reconciliation: implemented-only
- given: an opportunity in evaluation with two proposals under review and one already disqualified
- when: the last of the two is scored
- then: the opportunity moves to processing with the note "Automatically moved to Processing as all proposals have been evaluated.", and disqualified, withdrawn and draft proposals are not counted
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1038
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1020
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1544

### D-proposals-23 · v1 · inferred · recovered

Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.

- reconciliation: implemented-only
- given: a Sprint With Us opportunity still in its code challenge stage
- when: someone enters a team scenario score for one of its proposals
- then: the request is refused with "The opportunity is not in the correct stage of evaluation to perform that action."
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1100
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1140
- cites: src/back-end/lib/resources/proposal/sprint-with-us/index.ts:1228
- cites: src/back-end/lib/resources/proposal/team-with-us/index.ts:901
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:405

### D-proposals-24 · v1 · inferred · recovered

After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.

- reconciliation: implemented-only
- given: a Sprint With Us opportunity with six proposals scored on its questions, one of them below a question's minimum score
- when: the panel's agreed scores are finalised
- then: the proposal below the minimum is left behind, the remaining five are ranked by their question score and the top four move to the code challenge, while on a Team With Us opportunity the top three move to the challenge
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1896
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1927
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1840
- cites: src/shared/config.ts:56
- cites: src/shared/config.ts:58

### D-proposals-25 · v1 · inferred · recovered

A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.

- reconciliation: implemented-only
- given: two Sprint With Us proposals still in contention, bidding 100,000 and 200,000
- when: a team scenario score is entered for the higher bid
- then: that proposal is given a price score of 50, its history records the calculated price score, and it becomes fully evaluated
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1563
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1629
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1283
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1447
- note: a Team With Us bid is the sum of each named person's hourly rate weighted by the target allocation of the resource they are named against, rather than a stated total cost.

### D-proposals-26 · v1 · inferred · recovered

A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.

- reconciliation: implemented-only
- given: an opportunity whose questions, challenge, scenario and price carry stated weights
- when: a proposal has a score for every one of those stages
- then: its total is those scores combined in the stated proportions, and it takes a rank among the other fully evaluated proposals, highest total first
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1960
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1973
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:399
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1694
- cites: src/shared/lib/resources/proposal/team-with-us.ts:306

### D-proposals-27 · v1 · inferred · recovered

A vendor sees the scores and rank of their own proposal only after the opportunity has been awarded or their proposal has been passed over.

- reconciliation: implemented-only
- given: a vendor's proposal that has been scored but whose opportunity has not been awarded
- when: the vendor opens their proposal
- then: no score and no rank are shown, and both appear once the proposal becomes awarded or not awarded
- cites: src/back-end/lib/permissions.ts:486
- cites: src/back-end/lib/permissions.ts:792
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:562
- cites: src/shared/lib/resources/proposal/sprint-with-us.ts:583

### D-proposals-28 · v1 · inferred · recovered

Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.

- reconciliation: implemented-only
- given: an opportunity with one evaluated proposal, one already disqualified and one withdrawn
- when: an administrator awards the evaluated proposal
- then: that proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep the state they were in
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1136
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1160
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1673
- cites: src/shared/lib/resources/proposal/code-with-us.ts:368
- note: only a proposal that is fully evaluated, or one previously passed over, may be awarded.

### D-proposals-29 · v1 · inferred · recovered

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.

- reconciliation: implemented-only
- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated
- cites: src/shared/lib/validation/proposal/code-with-us.ts:48
- cites: src/shared/lib/validation/proposal/sprint-with-us.ts:283
- cites: src/back-end/lib/db/proposal/code-with-us.ts:920
- cites: src/shared/lib/resources/proposal/code-with-us.ts:320

### D-proposals-30 · v1 · inferred · recovered

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- reconciliation: implemented-only
- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1282
- cites: src/back-end/lib/db/proposal/code-with-us.ts:994
- cites: docs/database-schema.md:206
- cites: src/shared/lib/resources/proposal/code-with-us.ts:111

### D-proposals-32 · v1 · inferred · recovered

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- reconciliation: implemented-only
- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:21
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:46
- cites: src/back-end/lib/mailer/notifications/proposal/code-with-us.tsx:100
- cites: src/back-end/lib/mailer/notifications/proposal/sprint-with-us.tsx:108
- cites: src/back-end/lib/mailer/notifications/proposal/team-with-us.tsx:52

### D-proposals-33 · v1 · inferred · recovered

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- reconciliation: implemented-only
- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/export/one.tsx:132
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/views/exported-proposal.tsx:114
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/export/one.tsx:115
- cites: src/front-end/typescript/lib/app/router.ts:304

### D-proposals-38 · v1 · inferred · recovered

Only public sector staff and administrators may take away every proposal of an opportunity in one document, and they choose whether that document names the proponents.

- reconciliation: implemented-only
- given: a closed opportunity carrying several submitted proposals
- when: a vendor opens the address that exports all of them, and then the opportunity's author opens it
- then: the vendor is refused, the author receives every proposal they are entitled to see in one document, and the author can ask for the same document with the proponents named anonymously
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/export/all.tsx:62
- cites: src/front-end/typescript/lib/pages/proposal/code-with-us/export/all.tsx:60
- cites: src/front-end/typescript/lib/app/router.ts:115
- cites: src/front-end/typescript/lib/app/router.ts:276

## Ratification conditions

One condition per line, and exactly one of these forms:

- `contract <ID>` — leave as recovered. It does not promote the criterion — `confirm`, `edit` and
  `defect` all do — so this is a no-op on anything still `inferred` or `open`. No text after the ID.
- `confirm <ID>` — the evidence now supports raising its confidence to `confirmed`. No text after the ID.
- `edit <ID>: <new statement>` — the behaviour is right, the wording is not; confidence rises to
  `confirmed` too, since the deliberate rewording is itself a second witness.
- `defect <ID>: <replacement statement>` — the old system does this and the new one should not; the row
  is kept as the record, its confidence rises to `confirmed` (it is a confirmed record of current
  behaviour, marked defect), and the replacement is filed against it.
- `spike <ID>: <question>` — not yet decided; confidence drops to `open` and the question is recorded.
- `obsolete <ID>: <why>` or `drop <ID>: <why>` — not to be carried forward at all.

The ID is the criterion's own id exactly as the domain file spells it. `contract` and `confirm`
take no text; every other verb requires a colon and text on the same line. A condition may not
span more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is which of the 28 still-inferred proposals criteria become the contract. I approve, and I rule on every one: 23 are confirmed and 5 are edited into wording the code actually supports. What tipped the 23 is that each was checked against its cited lines in sources/old and the code leaves no second reading — the refusal strings are verbatim in the source and unique to their guard ("Please select a different organization." on both the create and edit paths of all three programs; "An organization must be specified before submitting."; "The selected organization does not satisfy this opportunity's service areas."; "The opportunity is not in the correct stage of evaluation to perform that action.", ten occurrences across the Sprint and Team resources; "Automatically moved to Processing as all proposals have been evaluated."), the arithmetic is literal in the source (price score is lowestBid/ownBid*100 over proposals in UnderReview/EvaluatedTeamScenario, so the 100k/200k example is 50; total score is the four stage scores weighted /100; screen-in counts are SWU_CODE_CHALLENGE_SCREEN_IN_COUNT=4 and TWU=3 applied after the per-question minimum-score filter), and the visibility rules are single functions with no alternate path (isCWUProposalStatusVisibleToGovernment hides draft and submitted and shows withdrawn to Admin only, matching the note on D-proposals-19; vendors get scores only at Awarded/NotAwarded in both readOwnSWUProposals and the readMany loop; the export anonymity flag is literally viewer-is-not-a-vendor AND not-yet-in-code-challenge). Five criteria I did not confirm because the code contradicts them: the Code With Us proponent organization is checked only for existence, never for the vendor's membership; the friendly deadline message exists once, on the Code With Us create path only, with no equivalent guard on Sprint or Team With Us creation; the duplicate-member refusal is Team With Us only; the server rejects more than one scrum master but accepts none; and a Team With Us resource is only checked to exist, not to belong to the opportunity. Each is edited to state what is enforced and to name the gap, so the next stage does not build on a guarantee that is not there. What would change this ruling: a test or a second call site showing that any of those five gaps is in fact closed elsewhere would turn that edit back into a plain confirmation, and conversely, evidence that any confirmed criterion has a bypass path I did not read would send it back to inferred.

**Conditions:**
- confirm D-proposals-3
- confirm D-proposals-4
- confirm D-proposals-5
- edit D-proposals-6: A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.
- edit D-proposals-8: A proposal cannot move from draft to submitted once the opportunity's proposal deadline has passed, and a Code With Us proposal cannot be created already marked as submitted after that deadline, which is refused with "This opportunity is no longer accepting proposals."; the equivalent guard is absent from Sprint With Us and Team With Us creation, where the only barrier is that a closed opportunity is no longer visible to a vendor.
- confirm D-proposals-9
- confirm D-proposals-10
- edit D-proposals-11: Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, refused with "User is not an active member of the organization.", and a Team With Us proposal additionally refuses the same person named twice with "Please select unique team members.", while a Sprint With Us phase applies no such uniqueness check.
- edit D-proposals-12: A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.
- edit D-proposals-13: A Team With Us proposal must name at least one team member, each with an hourly rate of at least one dollar and each against a resource that exists, though the service does not check that the resource belongs to the opportunity being bid on.
- confirm D-proposals-14
- confirm D-proposals-15
- confirm D-proposals-16
- confirm D-proposals-18
- confirm D-proposals-19
- confirm D-proposals-21
- confirm D-proposals-22
- confirm D-proposals-23
- confirm D-proposals-24
- confirm D-proposals-25
- confirm D-proposals-26
- confirm D-proposals-27
- confirm D-proposals-28
- confirm D-proposals-29
- confirm D-proposals-30
- confirm D-proposals-32
- confirm D-proposals-33
- confirm D-proposals-38
