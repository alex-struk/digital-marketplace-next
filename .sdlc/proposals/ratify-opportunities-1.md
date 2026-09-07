---
gate: G1
question: "Which of the opportunities criteria that are still inferred or open become the contract?"
recommendation: "45 criterion(s) in opportunities are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T02:55:42.380Z
---

# Which of the opportunities criteria that are still inferred or open become the contract?

**Recommendation.** 45 criterion(s) in opportunities are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

45 criterion(s) in the **opportunities** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-opportunities-1 · v1 · inferred · recovered

Only signed-in public sector staff and administrators may create an opportunity; a request from a vendor or an anonymous visitor is refused.

- reconciliation: implemented-only
- given: a visitor who is not signed in, or is signed in as a vendor
- when: they attempt to create an opportunity
- then: the request is refused and no opportunity is created
- cites: src/back-end/lib/permissions.ts:345
- cites: src/back-end/lib/permissions.ts:604
- cites: src/back-end/lib/permissions.ts:1099
- cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:37

### D-opportunities-2 · v1 · open · recovered

Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards.

- reconciliation: conflicting
- given: a member of public sector staff creating a new opportunity
- when: they choose a program and complete creation
- then: the opportunity is filed under that program and offers only that program's fields, stages and actions
- cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:77
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
- cites: README.md:5
- note: the running code implements three programs, but the application's own README describes only Code With Us and Sprint With Us, and its generated database-schema document lists no Team With Us tables at all. Both documents predate Team With Us; a human should confirm that all three programs carry forward rather than assuming the documents are merely stale.

### D-opportunities-3 · v1 · inferred · recovered

An opportunity saved as a draft is accepted with incomplete content, and any missing or invalid dates are defaulted to fourteen days ahead.

- reconciliation: implemented-only
- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412

### D-opportunities-4 · v1 · inferred · recovered

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- cites: src/shared/lib/validation/opportunity/utility.ts:89
- cites: src/shared/lib/validation/opportunity/utility.ts:98
- cites: src/shared/lib/validation/opportunity/utility.ts:137
- cites: src/shared/lib/validation/opportunity/utility.ts:147

### D-opportunities-5 · v1 · inferred · recovered

An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they mark it as accepting remote work but leave the remote-work description empty
- then: the submission is rejected
- cites: src/shared/lib/validation/opportunity/utility.ts:107
- cites: src/shared/lib/validation/opportunity/utility.ts:120
- note: when remote work is not acceptable the remote-work description may be empty, and any value over 500 characters is rejected either way.

### D-opportunities-6 · v1 · inferred · recovered

A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Code With Us opportunity that is not a draft
- when: they submit a reward outside $1 to $70,000, or submit no skills
- then: the submission is rejected
- cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
- cites: src/shared/lib/validation/opportunity/code-with-us.ts:53
- cites: src/shared/config.ts:28
- note: duplicate skills are silently collapsed rather than rejected.

### D-opportunities-7 · v1 · inferred · recovered

A Sprint With Us opportunity must state a total maximum budget of at least $1 and at most $5,000,000, while a Team With Us opportunity must state a maximum budget of at least $1 with no upper limit.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a Sprint With Us budget above $5,000,000, or any budget below $1
- then: the submission is rejected
- cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
- cites: src/shared/lib/validation/opportunity/team-with-us.ts:176
- cites: src/shared/config.ts:30
- note: the absence of an upper budget limit on Team With Us is a difference from the other two programs, not a stated policy; nothing in the application explains it, so a human should rule on whether it carries forward.

### D-opportunities-8 · v1 · inferred · recovered

An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a proposal deadline in the past, or any later date that falls before the date preceding it
- then: the submission is rejected
- cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
- cites: src/shared/lib/validation/opportunity/utility.ts:29
- cites: src/shared/lib/index.ts:275
- cites: src/shared/config.ts:26
- note: when an already-published opportunity's deadline has passed, an edit is measured against that past deadline instead of today, so a closed opportunity can be edited without its dates being forced forward.

### D-opportunities-9 · v1 · inferred · recovered

A Sprint With Us or Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Sprint With Us or Team With Us opportunity that is not a draft
- when: they submit weights that do not total one hundred per cent
- then: the submission is rejected with a message saying the scoring weights must total 100%
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:615
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:436
- note: Sprint With Us weights four stages (questions, code challenge, team scenario, price); Team With Us weights three (questions, challenge, price). Each individual weight is separately required to fall between 0 and 100.

### D-opportunities-10 · v1 · inferred · recovered

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:628
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:206

### D-opportunities-11 · v1 · inferred · recovered

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, with at most one of them marked as chair.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Sprint With Us or Team With Us opportunity
- when: they submit fewer than two panel members, the same person twice, more than one chair, or anyone who is not a public sector employee
- then: the submission is rejected and the reason is named
- cites: src/back-end/lib/validation.ts:900
- cites: src/back-end/lib/validation.ts:847
- cites: src/shared/config.ts:32
- cites: src/shared/config.ts:34
- note: the rule as written in the application's own comment says "one and only one chair", but the code accepts a panel with no chair at all and rejects only a second chair. A human should rule on which was intended.

### D-opportunities-12 · v1 · inferred · recovered

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question, a guideline, a maximum score, a response word limit and a position, and an optional minimum score that must be lower than the question's maximum score.

- reconciliation: implemented-only
- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:371
- cites: src/shared/lib/validation/opportunity/team-with-us.ts:111
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:16
- note: the same limits apply to Sprint With Us "team questions" and Team With Us "resource questions"; the two differ only in name.

### D-opportunities-13 · v1 · inferred · recovered

Each resource on a Team With Us opportunity names one service area and a target allocation between 1 and 100 per cent of full time.

- reconciliation: implemented-only
- given: a member of public sector staff creating or editing a Team With Us opportunity that is not a draft
- when: they submit a resource with a target allocation outside 1 to 100, or a service area that is not one of the five recognised areas
- then: the submission is rejected
- cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:239

### D-opportunities-14 · v1 · inferred · recovered

An opportunity moves through the states draft, under review, published, one or more program-specific evaluation stages, processing, and finally awarded or cancelled.

- reconciliation: implemented-only
- given: any opportunity
- when: its state is read at any point in its life
- then: the state is one of the values recognised for its program, and no other value is accepted by the store
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
- cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:36
- note: Code With Us has a single evaluation stage; Sprint With Us has four (team questions individual, team questions consensus, code challenge, team scenario); Team With Us has three (resource questions individual, resource questions consensus, challenge).

### D-opportunities-15 · v1 · inferred · recovered

An opportunity may only change state along the permitted path for its program, and a request for any other change is refused.

- reconciliation: implemented-only
- given: an opportunity in a given state
- when: someone requests a change to a state that is not reachable from it — for example from draft straight to an evaluation stage, or out of an awarded or cancelled opportunity
- then: the request is refused and the opportunity's state is unchanged
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
- note: a draft may go to under review or straight to published; under review may only go to published; published and every evaluation stage may go to the next stage or to cancelled; awarded and cancelled are final.

### D-opportunities-16 · v1 · inferred · recovered

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- reconciliation: implemented-only
- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:705
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1354
- note: Code With Us checks only title, teaser, remote-work fields, location and description at this point, while Sprint With Us additionally checks budget, skills, weights and every phase — so a Code With Us opportunity can reach "under review" with a missing reward or missing skills and be caught only at publication.

### D-opportunities-17 · v1 · inferred · recovered

Only an administrator may publish an opportunity.

- reconciliation: implemented-only
- given: an opportunity in draft or under review
- when: a member of public sector staff who is not an administrator asks to publish it
- then: the request is refused and the opportunity stays unpublished
- cites: src/back-end/lib/permissions.ts:390
- cites: src/back-end/lib/permissions.ts:632
- cites: src/back-end/lib/permissions.ts:1354
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1463

### D-opportunities-18 · v1 · inferred · recovered

Publishing an opportunity records the moment of publication, which is thereafter shown as the opportunity's published date.

- reconciliation: implemented-only
- given: an opportunity that has been published
- when: anyone views it
- then: the date shown as its publication date is the moment of the first publication, even if it was later republished
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:430
- cites: docs/database-schema.md:136

### D-opportunities-20 · v1 · inferred · recovered

On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation.

- reconciliation: implemented-only
- given: a published Sprint With Us or Team With Us opportunity with submitted proposals
- when: it closes at its proposal deadline
- then: each submitted proposal is labelled "Proponent 1", "Proponent 2" and so on
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1498
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1488
- note: Code With Us does not anonymise proponents.

### D-opportunities-21 · v1 · inferred · recovered

An opportunity moves to processing on its own once every proposal still in contention has been scored at its program's final evaluation stage.

- reconciliation: implemented-only
- given: an opportunity at its final evaluation stage with at least one proposal still in contention
- when: the last of those proposals is scored
- then: the opportunity moves to processing and the change is recorded with a note saying it was moved automatically because all proposals have been evaluated
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:2136
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1789

### D-opportunities-22 · v1 · inferred · recovered

Awarding a proposal moves its opportunity to awarded and records the winning proponent against it; every other proposal still in contention is marked not awarded.

- reconciliation: implemented-only
- given: an opportunity in processing with proposals against it
- when: an administrator awards one of those proposals
- then: the opportunity moves to awarded, the winning proponent is recorded against it, and the remaining proposals are marked not awarded
- cites: src/back-end/lib/db/proposal/code-with-us.ts:1159
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:1733
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1463

### D-opportunities-23 · v1 · inferred · recovered

An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.

- reconciliation: implemented-only
- given: an awarded opportunity
- when: a visitor who may not see proposal scores views it
- then: the successful proponent's name is shown and their contact details and score are withheld
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:445

### D-opportunities-24 · v1 · inferred · recovered

Only an administrator may cancel an opportunity, and only once it has been published.

- reconciliation: implemented-only
- given: an opportunity that is published or at any evaluation stage or in processing
- when: an administrator cancels it, giving an optional note of up to 1,000 characters
- then: the opportunity moves to cancelled and stops accepting proposals
- cites: src/back-end/lib/permissions.ts:415
- cites: src/back-end/lib/permissions.ts:676
- cites: src/back-end/lib/permissions.ts:1178
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:823
- note: a draft or under-review opportunity cannot be cancelled — it is deleted instead.

### D-opportunities-25 · v1 · open · recovered

An opportunity may be deleted only while it is a draft or under review, and only by an administrator or, for a draft, by the member of public sector staff who created it.

- reconciliation: conflicting
- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- cites: src/back-end/lib/permissions.ts:367
- cites: src/back-end/lib/permissions.ts:636
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
- cites: src/back-end/docs/opportunities/code-with-us.yaml:112
- note: the application's own interface documentation says deletion is permitted only for a draft, while the code also permits an administrator to delete an opportunity that is under review. The three programs also disagree with each other: for Code With Us and Sprint With Us the creating staff member may delete only a draft, but for Team With Us they may also delete one that is under review. A human should rule on the intended rule before it is carried forward.

### D-opportunities-28 · v1 · inferred · recovered

The names of the people who created and last changed an opportunity are shown only to administrators and to those people themselves.

- reconciliation: implemented-only
- given: a published opportunity
- when: it is viewed by someone who is neither an administrator nor the person who created or last changed it
- then: the creating and changing people's names are absent from what is shown
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:243

### D-opportunities-29 · v1 · inferred · recovered

An opportunity's administrator and its author can see its full change history, how many times it has been viewed, how many people are watching it and how many proposals have been submitted; nobody else can.

- reconciliation: implemented-only
- given: a published opportunity that has been viewed, watched and proposed against
- when: its author or an administrator opens it
- then: they see its history of state changes and events and its counts of views, watchers and submitted proposals
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:477
- cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
- cites: docs/database-schema.md:136
- note: the reporting counts are withheld while the opportunity is still a draft or under review, even from the author.

### D-opportunities-30 · v1 · inferred · recovered

Public sector staff cannot see the proposals submitted against an opportunity until it has left the published state.

- reconciliation: implemented-only
- given: a published opportunity that has received proposals
- when: its author or an administrator asks to see the proposals
- then: the request is refused until the opportunity has closed and moved to an evaluation stage
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:344
- cites: src/back-end/lib/permissions.ts:426

### D-opportunities-32 · v1 · inferred · recovered

An addendum of 1 to 5,000 characters may be added to any opportunity that is no longer a draft, by an administrator or by the staff member who created it, and cannot be removed afterwards.

- reconciliation: implemented-only
- given: a published opportunity
- when: its author adds an addendum
- then: the addendum is appended to the opportunity with its author and date, an entry is added to the opportunity's history, and there is no action that removes it
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
- cites: src/back-end/lib/permissions.ts:403
- cites: src/shared/lib/validation/addendum.ts:3
- cites: src/back-end/docs/opportunities/code-with-us.yaml:98

### D-opportunities-33 · v1 · inferred · recovered

An administrator or an opportunity's author may attach a private note, with files, to a Code With Us or Sprint With Us opportunity's history at any point in its life.

- reconciliation: implemented-only
- given: a Code With Us or Sprint With Us opportunity in any state
- when: its author adds a note of up to 1,000 characters with attachments
- then: the note and its attachments appear in the opportunity's history, which only the author and administrators can see
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1721
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:374
- note: Team With Us offers no such action at all. Nothing in the application explains the omission, so a human should decide whether it is a gap to close or a deliberate difference.

### D-opportunities-35 · v1 · inferred · recovered

Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.

- reconciliation: implemented-only
- given: an opportunity ready to be published and people who have turned notifications on
- when: an administrator publishes it
- then: each of those people receives a notice that a new opportunity has been posted, and the opportunity's author receives a confirmation
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146

### D-opportunities-36 · v1 · inferred · recovered

Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.

- reconciliation: implemented-only
- given: a published opportunity with watchers and submitted proposals
- when: an administrator edits it or adds an addendum
- then: its watchers, its proponents and its author are each notified once
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
- note: nobody is notified when the opportunity is a draft or has been cancelled.

### D-opportunities-37 · v1 · inferred · recovered

Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.

- reconciliation: implemented-only
- given: a published opportunity with watchers and submitted proposals
- when: an administrator cancels it
- then: its watchers and proponents are told it has been cancelled, and its author is told separately that the cancellation was actioned
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197

### D-opportunities-38 · v1 · inferred · recovered

Submitting an opportunity for review notifies every administrator, and confirms the submission to its author.

- reconciliation: implemented-only
- given: a complete draft opportunity
- when: its author submits it for review
- then: every administrator is notified that an opportunity awaits review, and the author receives a confirmation
- cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:386

### D-opportunities-39 · v1 · inferred · recovered

The opportunity list groups opportunities into unpublished, open and closed, showing open opportunities with the nearest proposal deadline first, closed ones most recently closed first, and unpublished ones most recently changed first.

- reconciliation: implemented-only
- given: a set of opportunities in a mix of states
- when: someone opens the opportunity list
- then: each opportunity appears in exactly one of the three groups, ordered as described
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:194
- note: an opportunity counts as open only while it is published and its proposal deadline is still in the future; everything published and past its deadline, including cancelled and awarded opportunities, counts as closed.

### D-opportunities-40 · v1 · inferred · recovered

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- reconciliation: implemented-only
- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
- cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:60
- note: the state filter offers draft, under review, published, evaluation and awarded; there is no option for opportunities in processing or cancelled, so those can only be found by clearing the filter.

### D-opportunities-42 · v1 · inferred · recovered

Only an administrator can open the full report of a completed opportunity, which shows the opportunity, its addenda, its history and every proposal in one continuous document.

- reconciliation: implemented-only
- given: an opportunity that has been evaluated
- when: a member of public sector staff who is not an administrator opens its report address
- then: they are refused, while an administrator opening the same address sees the whole record in one document
- cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/complete/index.tsx:184
- cites: src/front-end/typescript/lib/app/router.ts:741

### D-opportunities-43 · v1 · inferred · recovered

Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.

- reconciliation: implemented-only
- given: a Sprint With Us or Team With Us opportunity at the questions consensus stage
- when: its author asks to move it on while a consensus is unsubmitted, or while no proponent has cleared every question's minimum score
- then: the request is refused and the reason is named
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:973

### D-opportunities-44 · v1 · inferred · recovered

Advancing a Sprint With Us opportunity to the team scenario stage is refused unless every proponent in the code challenge has been scored or disqualified and at least one remains screened in.

- reconciliation: implemented-only
- given: a Sprint With Us opportunity at the code challenge stage
- when: its author asks to move it to the team scenario stage while a proponent is unscored and not disqualified
- then: the request is refused with a message saying all proponents must be scored first
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1593

### D-opportunities-45 · v1 · inferred · recovered

The evaluation panel of a Sprint With Us or Team With Us opportunity may be changed only while the opportunity is a draft, under review, published, or at the first questions stage.

- reconciliation: implemented-only
- given: a Sprint With Us or Team With Us opportunity that has reached the consensus stage or beyond
- when: its author asks to change the evaluation panel
- then: the request is refused and the panel stays as it was
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1997

### D-opportunities-46 · v1 · inferred · recovered

A member of public sector staff who is not an administrator can publish a Code With Us opportunity directly, by creating it as published rather than by publishing an existing one.

- reconciliation: defect
- given: a member of public sector staff who is not an administrator
- when: they create a Code With Us opportunity with its state set to published
- then: the opportunity is created and published, and the subscriber notifications for a published opportunity are sent
- cites: src/back-end/lib/permissions.ts:345
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:188
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:394
- cites: src/back-end/lib/permissions.ts:604
- note: this contradicts the administrator-only publication rule recovered as D-opportunities-17. The equivalent Sprint With Us and Team With Us creation checks refuse this case explicitly, so the Code With Us omission reads as an oversight rather than an intended difference. There is no replacement criterion because the corrected behaviour is already stated by D-opportunities-17; a human should rule on whether the rebuild simply closes the hole.

### D-opportunities-47 · v1 · open · recovered

A Team With Us opportunity in processing can be awarded, even though the recorded set of permitted state changes does not include that step.

- reconciliation: conflicting
- given: a Team With Us opportunity in processing
- when: an administrator awards one of its proposals
- then: the opportunity becomes awarded
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:483
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:501
- cites: src/back-end/lib/db/proposal/team-with-us.ts:1463
- note: the permitted-change table for Team With Us allows only cancellation out of processing, while the equivalent tables for the other two programs allow the award. Awarding does not consult that table, so the award succeeds anyway. Whether the table or the award path is wrong cannot be determined from the application; a human should rule.

### D-opportunities-48 · v1 · inferred · recovered

A Sprint With Us or Team With Us opportunity can be moved out of its consensus stage by a second, older action that does not check whether the consensus evaluations have been submitted.

- reconciliation: defect
- given: a Sprint With Us opportunity at the questions consensus stage with consensus evaluations still unsubmitted
- when: its author uses the older "start code challenge" action rather than the newer "finalize consensuses" action
- then: the opportunity advances to the code challenge stage without the consensus check being applied
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1550
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1043
- note: the application marks the Sprint With Us version of this action as deprecated in a comment but still accepts it; the Team With Us equivalent carries no such comment. There is no replacement criterion because the intended guard is already stated by D-opportunities-43; a human should rule on removing the older path.

### D-opportunities-49 · v1 · open · recovered

The author of a published opportunity, who is not an administrator, can change its details.

- reconciliation: conflicting
- given: a published opportunity created by a member of public sector staff who is not an administrator
- when: that person submits a change to its details
- then: the change is accepted and a new version is recorded
- cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
- cites: src/back-end/lib/permissions.ts:349
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
- cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:582
- note: the interface offers the edit only to administrators once an opportunity is published, but the underlying service accepts it from the author too. The two disagree, and nothing in the application says which is intended.

### D-opportunities-50 · v1 · inferred · recovered

"Suspended" remains a permitted stored state for an opportunity although no action can put an opportunity into it.

- reconciliation: defect
- given: the set of states an opportunity may hold
- when: any state change is attempted
- then: no path leads to the suspended state, and no listing, filter or transition treats it as reachable
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:21
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
- cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:14
- note: the state is named "deprecated suspended" in the application's own code but is still accepted by the store's constraint, so historical records may hold it. There is no replacement criterion: whether the rebuild must still display an opportunity left in this state from the old data is a question for a human, not something the application answers.

### D-opportunities-51 · v1 · open · recovered

The application's published interface description for opportunities is incomplete: it omits the Team With Us program entirely, omits the "submit for review" and "add note" actions, and describes only two of the three states an opportunity may be created in.

- reconciliation: documented-only
- given: someone reading the application's own interface description to learn what an opportunity supports
- when: they compare it against what the service actually accepts
- then: they find actions and states the description does not mention, and no description at all for one of the three programs
- cites: src/back-end/docs/opportunities/code-with-us.yaml:88
- cites: src/back-end/docs/opportunities/code-with-us.yaml:180
- cites: src/back-end/docs/opportunities/sprint-with-us.yaml:86
- cites: src/shared/lib/resources/opportunity/code-with-us.ts:205
- cites: src/shared/lib/validation/opportunity/code-with-us.ts:39
- note: recorded so that the gap is not mistaken for absent behaviour by a later reader. The behaviours themselves are stated in the criteria above; this criterion is about the documentation being an unreliable second source, which is why several criteria here are graded on code alone.

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

The question is which of the 45 opportunities criteria still inferred or open become the contract, and the ruling is approve with a condition on every one of them. I confirmed 36 because I read the cited lines at the pinned commit myself rather than accepting the recovery's report, and in each case a second witness independent of the recovery exists in the code: the enforcing check and the call site that applies it. Concretely — permissions.ts:345 gates creation to admin or government and the create endpoint at code-with-us.ts:188 additionally requires a signed-in session (D-1); validation/opportunity/utility.ts sets title 1-200, teaser 0-500, description 1-10,000, location minimum 1, and remote description 1-if-remote-else-0 to 500 (D-4, D-5); config.ts fixes CWU_MAX_BUDGET at 70,000 and SWU_MAX_BUDGET at 5,000,000 while validateMaxBudget for Team With Us passes undefined as its ceiling (D-6, D-7); the date chain at code-with-us.ts:238-255 feeds each validated date as the next one's minimum and setDateTo4PM with TIMEZONE America/Vancouver records them at 4 p.m. Pacific (D-8); isValidStatusChange in all three shared resource files reads exactly as the note describes (D-14, D-15); submitForReview at code-with-us.ts:705 checks only title, teaser, remote fields, location and description (D-16); publishCWUOpportunity and cancelCWUOpportunity are isAdmin alone (D-17, D-24); processForRole at db/opportunity/code-with-us.ts:243 deletes createdBy and updatedBy for anyone who is neither admin nor either of those people (D-28); the same file takes the earliest Published status row as publishedAt (D-18), withholds email and createdBy on the successful proponent unless the score is present (D-23), and gates history and reporting counts on admin-or-owner with the counts further gated on publicOpportunityStatuses (D-29); the mailer handlers match the notification criteria one for one (D-35 to D-38); the list groups and sorts as described and offers exactly the five status filters named (D-39, D-40); canChangeEvaluationPanel allows draft, under review, published and the first questions stage only (D-45); finalizeQuestionConsensuses and startTeamScenario carry the guards claimed (D-43, D-44); addNote appears in only the four Code With Us and Sprint With Us files, confirming the Team With Us omission by absence (D-33). D-2 is confirmed on a different witness: constitution article J1, adopted by the tech lead at G-POL, states that the service administers all three programs, so the README and generated schema document naming two are stale documentation rather than an open scope question — and no criterion here was raised on the strength of those documents, which my earlier ruling ruled out. D-3 is edited rather than confirmed because the recovered wording overstates the defaulting: code-with-us.ts:259-272 defaults the proposal deadline, assignment date and start date to fourteen days ahead but coerces the completion date to null. Four are defects the rebuild must not inherit and I rule them without escalating, because in each the code leaves one reading: the Code With Us create path applies only createCWUOpportunity before accepting status Published and then fires the published-subscriber notifications at :394, while the other two programs refuse it, so it is a hole rather than a policy (D-46); the Team With Us transition table permits only cancellation out of processing while canTWUOpportunityBeAwarded returns true for it and the award path never consults the table, and both other programs' tables allow the award, so the table is the outlier (D-47); startCodeChallenge carries the application's own 'todo: remove - not needed any more - the block is deprecated' comment and checks only the screened-in count while finalizeQuestionConsensuses checks the consensuses, so two paths out of one stage enforce different rules (D-48); and 'SUSPENDED' is named DeprecatedSuspended in the enum, is unreachable in every transition table and is still accepted by the store's constraint (D-50). Three I will not decide, because two readings of the intent are each plausible and the disagreement is about what the service should do rather than what it does: whether an evaluation panel requires a chair, where the code's own comment contradicts the code (D-11); which deletion rule carries forward, where the three programs disagree with each other and with the OpenAPI (D-25); and whether the author of a published opportunity may edit it, where the service accepts what the interface withholds (D-49) — each is spiked with the question that would settle it. D-51 is obsoleted: it records that the old application's documentation is incomplete, which is a property of the recovered sources rather than a behaviour the rebuilt system must exhibit, and the behaviours behind it are already stated by the criteria above. I am not escalating the gate: the tier is STANDARD, the stage reported no confidence shortfall, and the per-criterion ambiguities have their own mechanism in the three spikes. The ruling would change if any confirm here rested on the old README, generated schema document or OpenAPI files rather than on the enforcing code, or if a spiked criterion came back on the next follow-up still unanswered and were then confirmed rather than decided on evidence.

**Conditions:**
- confirm D-opportunities-1
- confirm D-opportunities-2
- edit D-opportunities-3: An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.
- confirm D-opportunities-4
- confirm D-opportunities-5
- confirm D-opportunities-6
- confirm D-opportunities-7
- confirm D-opportunities-8
- confirm D-opportunities-9
- confirm D-opportunities-10
- spike D-opportunities-11: Must a Sprint With Us or Team With Us evaluation panel have exactly one chair, as the application's own comment states, or is a chair optional, as the code allows?
- confirm D-opportunities-12
- confirm D-opportunities-13
- confirm D-opportunities-14
- confirm D-opportunities-15
- confirm D-opportunities-16
- confirm D-opportunities-17
- confirm D-opportunities-18
- confirm D-opportunities-20
- confirm D-opportunities-21
- confirm D-opportunities-22
- confirm D-opportunities-23
- confirm D-opportunities-24
- spike D-opportunities-25: Which single deletion rule carries forward across all three programs: may an administrator delete an opportunity that is under review as well as one in draft, and may the creating public sector employee delete one that is under review, or only a draft?
- confirm D-opportunities-28
- confirm D-opportunities-29
- confirm D-opportunities-30
- confirm D-opportunities-32
- confirm D-opportunities-33
- confirm D-opportunities-35
- confirm D-opportunities-36
- confirm D-opportunities-37
- confirm D-opportunities-38
- confirm D-opportunities-39
- confirm D-opportunities-40
- confirm D-opportunities-42
- confirm D-opportunities-43
- confirm D-opportunities-44
- confirm D-opportunities-45
- defect D-opportunities-46: Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.
- defect D-opportunities-47: The permitted state changes for a Team With Us opportunity in processing are awarded and cancelled, matching Code With Us and Sprint With Us, so the recorded transitions and the award path agree.
- defect D-opportunities-48: There is exactly one path out of a questions consensus stage, and it refuses to advance unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.
- spike D-opportunities-49: May the author of a published opportunity who is not an administrator change its details, as the service accepts, or is editing after publication administrator-only, as the interface enforces?
- defect D-opportunities-50: The rebuilt system defines no suspended state for an opportunity: none can be created in it, moved to it or stored in it, and any historical record carrying it is mapped to a defined state before the rebuilt system reads it.
- obsolete D-opportunities-51: It records that the old application's own interface description is incomplete, which is a property of the recovered sources rather than a behaviour the rebuilt system must exhibit; the behaviours it points at are already carried by the criteria above, and the documentation's unreliability belongs in the archaeology journal.
