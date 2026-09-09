# evaluation

## Tests

| id | test |
| --- | --- |
| R-5.1 | acceptance/evaluation/R-5.1.spec.ts |
| R-5.2 | — |
| R-5.3 | not testable: The given is an evaluator who has already started an evaluation of one proponent. An evaluation can be started only while the opportunity is in individual question evaluation, which an opportunity reaches only by closing at its proposal deadline, and no page, action or observation brings that about (see R-1.1). The observation the refusal would be read from, duplicate_evaluation_error, is named on both individual-create surfaces, but nothing in the surface can put an evaluator in front of it. |
| R-5.4 | — |
| R-5.5 | — |
| R-5.6 | — |
| R-5.7 | — |
| R-5.8 | — |
| R-5.9 | acceptance/evaluation/R-5.9.spec.ts |
| R-5.10 | not testable: The refusal is shown when the consensus scores of an opportunity in consensus are finalised. The consensus stage lies two stages beyond a closure the surface cannot bring about (see R-1.1), so finalize_consensus_scores has no opportunity to act on and no_screenable_proponent_error, which both consensus lists name, has nothing to return. No proponent can be given a question score to fall short of a minimum with either, since scoring happens after the closure as well. |
| R-5.11 | not testable: The subject is an individual evaluation, and none can exist. Recording one needs the opportunity to be in individual question evaluation, which is reached only by a closure the surface cannot bring about (see R-1.1), so there is nothing for an administrator, an owner, a panel member or an unconnected public sector employee to be granted or refused. The stage half of the claim is out of reach for the same reason: no opportunity can be got past the question stages. |
| R-5.12 | not testable: The given is an opportunity in consensus whose owner is not on its panel, and the consensus stage cannot be reached (see R-1.1). The observation written for exactly this outcome, evaluation-consensus-list.empty_for_owner_not_on_panel, exists on both programs, but no opportunity can be brought to the state in which the page would have to explain itself. |
| R-5.13 | not testable: Finalising happens only from the consensus stage, which lies beyond a closure the surface cannot bring about (see R-1.1). Neither half of the given can be built: no proponent can be left under review of the questions with no submitted consensus, because no consensus can be recorded at all, and not_all_consensuses_submitted_error has nothing to be read on. |
| R-5.14 | not testable: The criterion is about who is offered the finalise action on an opportunity in consensus, and the consensus stage cannot be reached (see R-1.1). Nor would the offer itself be readable: the consensus lists name finalize_consensus_scores as an action and finalize_confirmation_modal as what follows it, and neither reports whether the action stands ready for the person looking, so an owner who was offered nothing could not be told from one whose request simply failed. |
| R-5.15 | — |
| R-5.16 | acceptance/evaluation/R-5.16.spec.ts |
| R-5.17 | acceptance/evaluation/R-5.17.spec.ts |
| R-5.18 | acceptance/evaluation/R-5.18.spec.ts |
| R-5.19 | acceptance/evaluation/R-5.19.spec.ts |
| R-5.20 | not testable: The when is an opportunity closing at its proposal deadline. A published opportunity is refused a deadline earlier than today, and no page, action or observation makes the request that runs the closing hook (see R-1.1), so the move into individual question evaluation never happens and the notice to each evaluator on the panel is never sent. With no closure there is nothing to search the mail catcher for and nothing to read a status back from. |
| R-5.21 | not testable: The given is an opportunity in individual question evaluation, which is reached only by a closure the surface cannot bring about (see R-1.1). The individual evaluation surfaces exist for all of the people the criterion contrasts, but none of them has an opportunity to act on, so neither the evaluator who may score nor the chair and the owner who may not can make the attempt. |
| R-5.22 | not testable: The given is an evaluator scoring a proponent against a question, and no evaluation form can be opened: recording an evaluation needs the opportunity to be in individual question evaluation, reached only by a closure the surface cannot bring about (see R-1.1). score_out_of_range_error and empty_notes_error are named on all four individual evaluation surfaces, and nothing can put a score or a comment in front of either. |
| R-5.23 | not testable: The criterion turns on the difference between saving a draft evaluation and submitting one, and neither can be done. Both need an opportunity in individual question evaluation, which no page, action or observation reaches (see R-1.1). The criterion's own note says the case is reachable through the service rather than through the form, and the surface is the form. |
| R-5.24 | not testable: The given is an evaluator who has submitted their scores for a proponent. Nothing in the surface reaches an individual evaluation at all, draft or submitted, because the stage it lives in needs a closure that cannot be brought about (see R-1.1). read_only_after_submitted is named on both individual-edit surfaces and has nothing to report. |
| R-5.25 | not testable: The given is an evaluator holding draft evaluations for some of an opportunity's proponents. Drafts cannot be made, because the individual question evaluation stage is reached only by a closure the surface cannot bring about (see R-1.1), so submit_scores_for_consensus has nothing to submit and incomplete_evaluation_error nothing to report. The second half — that a proponent the evaluator never opened does not block the submission — needs the same drafts and the same proponents. |
| R-5.26 | not testable: Two things are missing. The evaluation the request would name cannot exist, since individual evaluations need a stage reached only by a closure the surface cannot bring about (see R-1.1); and no action submits one evaluation on its own. The individual-edit surfaces offer save_changes and save_and_go_to_next_proponent only, and the sole submission in the contract is submit_scores_for_consensus on the individual list, which is the whole set. The request the criterion says is rejected therefore cannot be made. |
| R-5.27 | not testable: The when is the last of a set of individual scores being submitted, which needs an opportunity in individual question evaluation with proponents and submitted evaluations — none of which can be had, because the stage is reached only by a closure the surface cannot bring about (see R-1.1). The move to consensus and the notices to the chair and the owner both hang off that submission. |
| R-5.28 | not testable: Every reader in the criterion is asking for an individual evaluation or a consensus, and neither can exist: both live in stages reached only by a closure the surface cannot bring about (see R-1.1). panel_member_score and panel_member_notes are named on the consensus surfaces, and with no evaluation written and no stage to move between, the before-and-after contrast the criterion is built on has nothing to compare. |
| R-5.29 | not testable: The given is an opportunity in consensus, which cannot be reached (see R-1.1). Neither the chair recording an agreed score nor an evaluator being refused one can be attempted, and duplicate_consensus_error on both consensus-create surfaces has nothing to report. |
| R-5.30 | not testable: The given is a consensus the chair has already submitted, and no consensus can be recorded, because the consensus stage is reached only by a closure the surface cannot bring about (see R-1.1). editable_after_submitted is named on both consensus-edit surfaces and has nothing to be read on. |
| R-5.31 | not testable: The when is the chair submitting the agreed scores of an opportunity in consensus. The consensus stage cannot be reached (see R-1.1), so submit_final_consensus_scores has nothing to act on and no message to the owner or to the administrators is ever produced for the mail catcher to be searched for. |
| R-5.32 | not testable: The given is a Sprint With Us opportunity in consensus with proponents carrying agreed scores. Consensus lies beyond a closure the surface cannot bring about (see R-1.1), so nothing can be finalised, no proponent can be screened in or passed over, and the next stage is never entered. The ceiling of four proponents for Sprint With Us and three for Team With Us has no set of proponents to be applied to. |
| R-5.33 | not testable: The when is the consensus scores being finalised, which needs the consensus stage and therefore a closure the surface cannot bring about (see R-1.1). With no finalising there is no notice to the chair or to the owner for the mail catcher to hold. |
| R-5.34 | not testable: The given is an opportunity being evaluated. Every stage in which the instructions, the individual evaluation list and the consensus list belong to somebody is reached only by a closure the surface cannot bring about (see R-1.1), so three of the four tools cannot be looked for; and the contrast needs four different people looking at one opportunity, while the target mints a session for only one public sector employee besides the administrator. The fourth tool, the panel itself, is reachable and is exercised by R-5.18. |
| R-5.35 | not testable: The given is an evaluator part-way through the proponents of an opportunity in individual question evaluation, a stage reached only by a closure the surface cannot bring about (see R-1.1). save_and_go_to_next_proponent and save_and_go_to_previous_proponent are named on the individual-create surfaces, and anonymous_proponent_name would report the order, but there are no proponents to move between and no scores to be saved on the way. |
| R-5.36 | not testable: The claim is that both programs run the whole evaluation, from published through individual question evaluation and consensus to their own next stage. Neither can leave published: an opportunity moves on only by closing at its proposal deadline, and no page, action or observation makes that happen (see R-1.1). Neither the sameness of the two runs nor the three differences the criterion allows can be observed on a walk that stops at the first stage. |
| R-5.37 | not testable: The panel a test can submit never holds a member with no role. The three actions that put somebody on a panel — add_panel_member, choose_panel_chair and mark_member_as_chair — each give that member a role, and nothing adds one without, so the offending panel cannot be composed. The outcome is unreadable as well: the panel surfaces name minimum_members_error, duplicate_member_error, non_public_sector_member_error and missing_chair_error, and none of them is a field-level message identifying a member who is neither an evaluator nor the chair. Needs an add_panel_member that can withhold a role, and an observation of that refusal. |

### R-5.1 · v1 · confirmed · accepted

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.
- cites: src/back-end/lib/validation.ts:914
- cites: src/back-end/lib/validation.ts:938
- cites: src/back-end/lib/validation.ts:949
- cites: src/back-end/lib/validation.ts:856
- cites: src/back-end/lib/validation.ts:487
- cites: src/shared/config.ts:32
- cites: src/shared/config.ts:34
- cites: src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts:38
- reconciliation: implemented-only
- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- note: the minimum of two members is the same for both programs.

### R-5.2 · v1 · confirmed · accepted

A panel with no chair at all is accepted by the service, although the browser form refuses to submit one.
- cites: src/back-end/lib/validation.ts:891
- cites: src/back-end/lib/validation.ts:938
- cites: src/front-end/typescript/lib/components/swu-evaluation-panel.tsx:83
- cites: src/front-end/typescript/lib/components/twu-evaluation-panel.tsx:71
- reconciliation: defect
- given: an opportunity being given an evaluation panel
- when: a panel of two evaluators with nobody marked as chair reaches the service without going through the browser form
- then: the panel is accepted and stored, and the opportunity then has no one who can record a consensus
- superseded-by: R-5.9
- note: the description written against the validation says it checks "that there is one and only one chair", but the check only rejects more than one; zero passes. The browser form separately refuses to submit without a chair, so the two disagree. A human should rule on whether the service must require a chair; no replacement criterion is offered until then.
- note: superseded by R-5.9

### R-5.3 · v1 · confirmed · accepted

An evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:240
- cites: src/back-end/lib/resources/proposal/team-with-us/resource-questions/evaluations.ts:243
- reconciliation: implemented-only
- given: an evaluator who has already started an evaluation of one proponent
- when: they start a second evaluation of the same proponent
- then: the request is refused with "You already have a team question evaluation for this proposal." and no second evaluation is created
- note: the Team With Us wording is the same sentence with "resource question" in place of "team question".

### R-5.4 · v1 · confirmed · accepted

Consensus scores cannot be finalised until every consensus recorded for the opportunity has been submitted, and at least one proponent has met the minimum score on every question that sets one.
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1510
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1527
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1002
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1019
- reconciliation: defect
- given: an opportunity in consensus with one agreed set of scores still a draft
- when: someone tries to finalise the consensus scores
- then: it is refused with "Not all consensuses have been submitted."
- superseded-by: R-5.10
- note: when every consensus is submitted but none of the proponents clears every question's minimum score, the refusal is instead "You must have at least one proponent that can be screened into the Code Challenge." Team With Us uses that same sentence even though its next stage is called the Challenge, so the message names the wrong stage there.
- note: superseded by R-5.10

### R-5.5 · v1 · confirmed · accepted

Once an opportunity has passed the question stages, any signed-in public sector employee can read any panel member's individual evaluation of any proponent, whether or not they had anything to do with that opportunity.
- cites: src/back-end/lib/permissions.ts:894
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:746
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:118
- cites: src/back-end/lib/permissions.ts:1411
- reconciliation: defect
- given: an opportunity that has reached the code challenge stage, and a public sector employee who is neither its owner nor on its panel
- when: they ask for one panel member's evaluation of one proponent
- then: the scores and comments are returned to them
- superseded-by: R-5.11
- note: reading a single evaluation is guarded only by being a public sector employee plus the opportunity's stage; the proponent lookup that precedes it does not restrict who may look. The listing of evaluations is narrowed to the reader's own, so only the single-evaluation route is affected. Nothing in the code says the wide access is deliberate; a human should rule on who ought to see individual evaluations after the questions are done. No replacement criterion is offered until that ruling.
- note: superseded by R-5.11

### R-5.6 · v1 · confirmed · accepted

The opportunity's owner is offered the consensus list but is shown nothing in it unless they are on the panel, until the opportunity has passed the question stages.
- cites: src/back-end/lib/permissions.ts:955
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:746
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/index.ts:186
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/index.tsx:201
- reconciliation: defect
- given: an opportunity in consensus whose owner is not on its evaluation panel
- when: the owner opens the consensus list
- then: the list opens but shows no agreed scores, and the same list shows them once the opportunity has moved to the code challenge
- superseded-by: R-5.12
- note: the browser offers the list to the owner while the service withholds the contents from anyone who is not on the panel, and the browser turns the refusal into an empty list rather than a message, so the owner is given no reason. A human should rule on whether an owner who is not on the panel should see the consensus while it is being agreed.
- note: superseded by R-5.12

### R-5.7 · v1 · confirmed · accepted

Whether every proponent must have an agreed set of scores before the consensus can be finalised could not be determined.
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1503
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/consensus.tsx:640
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/consensus.tsx:653
- reconciliation: defect
- given: an opportunity in consensus with three proponents and agreed scores recorded for only two of them
- when: the consensus scores are finalised
- then: it is unclear whether the third proponent should block finalising, or be passed over
- superseded-by: R-5.13
- note: the browser refuses to submit a consensus unless there is one for every proponent, so through the form the case cannot arise. The service checks only that the consensuses that exist have all been submitted, never that one exists per proponent, so a partial set reaching it directly would finalise and leave the missing proponent stranded in the question stage, neither screened in nor screened out. A human should rule on which of the two is the intended rule.
- note: superseded by R-5.13

### R-5.8 · v1 · confirmed · accepted

Only an administrator is offered the action that finalises consensus scores, although the service also accepts it from the opportunity's owner.
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/consensus.tsx:653
- cites: src/front-end/typescript/lib/pages/opportunity/team-with-us/edit/tab/consensus.tsx:654
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:868
- cites: src/back-end/lib/permissions.ts:614
- reconciliation: defect
- given: an opportunity in consensus, all its agreed scores submitted, whose owner is a public sector employee who is not an administrator
- when: the owner opens the consensus list, and separately sends the request to finalise
- then: no finalise action is offered to them, but the request they send is accepted and the scores are finalised
- superseded-by: R-5.14
- note: the chair is offered nothing here either, even though the chair is the person who agreed the scores. A human should rule on whether finalising belongs to administrators alone or also to the opportunity's owner.
- note: superseded by R-5.14

### R-5.9 · v1 · confirmed · accepted

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.
- replaces: R-5.2

### R-5.10 · v1 · confirmed · accepted

The refusal shown when no proponent clears every question's minimum score must name the stage that actually follows — the Code Challenge for Sprint With Us and the Challenge for Team With Us.
- replaces: R-5.4

### R-5.11 · v1 · confirmed · accepted

An individual evaluation may be read only by an administrator, the opportunity's owner, and the members of that opportunity's evaluation panel, at every stage; passing the question stages does not open it to public sector employees with no connection to the opportunity.
- replaces: R-5.5

### R-5.12 · v1 · confirmed · accepted

When the consensus list is withheld from the opportunity's owner because they are not on the evaluation panel, the page must say so rather than opening as an empty list with no explanation.
- replaces: R-5.6

### R-5.13 · v1 · confirmed · accepted

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.
- replaces: R-5.7

### R-5.14 · v1 · confirmed · accepted

The action that finalises consensus scores must be offered to whoever the service accepts it from — the opportunity's owner as well as an administrator — so that the browser and the service agree on who may finalise.
- replaces: R-5.8

### R-5.15 · v1 · confirmed · accepted

Every panel member must be an evaluator, a chair, or both; a member who is neither is rejected.
- cites: src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts:57
- cites: src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts:149
- reconciliation: defect
- given: an opportunity with an evaluation panel
- when: a panel member is recorded who is neither an evaluator nor the chair
- then: the panel is rejected
- superseded-by: R-5.37
- note: this rule is held only in the database, not in the code that validates a submitted panel, so the observable failure is a stored-data error rather than a field-level message. What a person actually sees when it happens could not be determined without running the old application.
- note: the chair is allowed not to be an evaluator. The browser form offers the chair as a separate choice from the list of evaluators and marks that person as chair-but-not-evaluator unless one of the evaluators has been ticked as chair, so a panel of two evaluators plus a separate chair holds three people.
- note: superseded by R-5.37

### R-5.16 · v1 · confirmed · accepted

The evaluation panel may be set or changed while an opportunity is a draft, under review, published, or in individual question evaluation, and is fixed from the consensus stage onwards.
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1998
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1382
- reconciliation: implemented-only
- given: an opportunity whose questions are being evaluated individually
- when: its owner changes the evaluation panel, and then tries again once the opportunity has moved to consensus
- then: the first change is accepted and the second is refused
- note: because the panel is recorded against a version of the opportunity and changing it writes a new version, a panel change also appears in the opportunity's history as an edit, and the count of evaluators the service waits for changes with it.

### R-5.17 · v1 · confirmed · accepted

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:147
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
- reconciliation: implemented-only
- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- note: the same change made while the opportunity is still a draft notifies nobody.

### R-5.18 · v1 · confirmed · accepted

The membership of an evaluation panel is shown only to an administrator, the opportunity's owner, and the people on the panel itself.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:892
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:934
- reconciliation: implemented-only
- given: an opportunity with an evaluation panel
- when: a vendor, or a public sector employee who is neither the owner nor on the panel, opens the opportunity
- then: no panel membership is shown to them, while an administrator, the owner and each panel member all see it

### R-5.19 · v1 · confirmed · accepted

A panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:524
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:789
- reconciliation: implemented-only
- given: a draft opportunity whose panel names a public sector employee who did not create it
- when: that person opens their dashboard and then the opportunity
- then: the opportunity is listed under "Evaluations" and they can open it, whereas another public sector employee cannot see it at all

### R-5.20 · v1 · confirmed · accepted

When an opportunity closes it enters individual question evaluation, and every evaluator on its panel is told it is ready to evaluate.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1455
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1525
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:172
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1631
- reconciliation: implemented-only
- given: a published opportunity with a panel of two evaluators and a separate chair, and submitted proposals against it
- when: its proposal deadline passes
- then: the opportunity moves to individual question evaluation and the two evaluators are notified, while the chair who is not an evaluator is not
- note: this is the same closing event that moves the submitted proposals into review and gives each an anonymous proponent name; the evaluation domain inherits that from the proposals domain rather than restating it.

### R-5.21 · v1 · confirmed · accepted

Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation.
- cites: src/back-end/lib/permissions.ts:1025
- cites: src/back-end/lib/permissions.ts:1542
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:203
- reconciliation: implemented-only
- given: an opportunity in individual question evaluation
- when: the chair who is not an evaluator, or the opportunity's owner who is not on the panel, tries to score a proponent
- then: the attempt is refused, whereas an evaluator on the panel may score
- note: an evaluator who tries the same thing once the opportunity has moved to consensus is refused as well.

### R-5.22 · v1 · confirmed · accepted

An evaluation carries one score and one comment per question, the score being between zero and that question's maximum with at most two decimal places, and the comment being at least one word.
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:58
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:65
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:136
- cites: src/shared/lib/validation/evaluations/team-with-us/resource-questions.ts:58
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:163
- reconciliation: implemented-only
- given: an evaluator scoring a proponent against a question worth five points
- when: they enter six, or a score with three decimal places, or leave the comment empty
- then: the entry is rejected and the evaluation cannot be submitted until every question has a score in range and a comment

### R-5.23 · v1 · confirmed · accepted

Scores and comments are checked when an evaluation is submitted, not when it is saved as a draft.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:248
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:379
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1808
- reconciliation: implemented-only
- given: an evaluator part-way through scoring a proponent
- when: they save a draft in which one score is above the question's maximum and one comment is empty
- then: the draft is saved as entered, and the evaluation is refused only later, when they try to submit
- note: the browser form checks each field as it is typed, so this is reachable through the service rather than through the form. Nothing in the code says whether unchecked drafts are intended; a human may want to rule on it.

### R-5.24 · v1 · confirmed · accepted

An evaluator may change their own evaluation only while it is still a draft and the opportunity is still in individual question evaluation; once submitted it cannot be changed at all.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:370
- cites: src/back-end/lib/permissions.ts:1056
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:94
- cites: src/back-end/lib/resources/proposal/team-with-us/resource-questions/evaluations.ts:370
- reconciliation: implemented-only
- given: an evaluator who has submitted their scores for a proponent
- when: they try to change a score or a comment
- then: the change is refused and the submitted scores stand
- note: one evaluator cannot edit another's evaluation at any point, whatever its state.

### R-5.25 · v2 · confirmed · accepted

An evaluator submits all of their existing draft evaluations for an opportunity in a single action, and the whole set is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." — none of it submitted — unless every evaluation in the set carries an in-range score and a comment for every question of the opportunity; the service does not check that the evaluator holds an evaluation for every proponent, so a proponent they never opened is simply absent from the set rather than blocking the submission.
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1748
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1825
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1205
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/evaluation.tsx:139
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/evaluation.tsx:505
- reconciliation: implemented-only
- given: an evaluator with three proponents to score and a complete draft for only two of them
- when: they submit their scores for consensus
- then: the submission is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." and none of the three is submitted

### R-5.26 · v1 · confirmed · accepted

A request to submit one evaluation on its own is refused; submission is only accepted as the whole set for the opportunity.
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:306
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:72
- reconciliation: conflicting
- given: an evaluator with one complete draft evaluation
- when: a request is sent to submit that evaluation by itself
- then: the request is rejected as unrecognised, and the evaluation stays a draft
- note: the shared description of the evaluation interface declares a "submit" action on the single-evaluation route, but the service's own parser accepts only "edit" there and treats anything else as unreadable. The declared interface and the running service therefore disagree; the service is the stricter of the two.

### R-5.27 · v2 · confirmed · accepted

An opportunity moves from individual evaluation to consensus by itself once the submitted individual scores number one per question per proponent per evaluator, counted against the panel and the questions of the opportunity's most recent version but only over the proponents named in the submission that triggers the check, and the chair and the opportunity's owner are then told it is ready.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1718
- cites: src/back-end/lib/db/evaluations/sprint-with-us/team-questions.ts:339
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:193
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1631
- reconciliation: implemented-only
- given: an opportunity in individual question evaluation with two evaluators, three proponents and four questions
- when: the second evaluator submits the last of their scores, bringing the total to twenty-four submitted scores
- then: the opportunity moves to consensus, and the chair and the opportunity's owner are notified
- note: the count is taken against the panel and the questions of the opportunity's most recent version, so changing the panel during individual evaluation changes how many submissions are awaited.

### R-5.28 · v2 · confirmed · accepted

Once an opportunity reaches consensus, every member of its panel can read every evaluator's individual scores and comments for a proponent, and before then no one but the evaluator who wrote them can; an administrator who is not on the panel gains access to individual evaluations only after the question stages have passed, at code challenge, team scenario or awarded, whereas a consensus may be read by an administrator at any stage.
- cites: src/back-end/lib/permissions.ts:980
- cites: src/back-end/lib/permissions.ts:894
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:85
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:1246
- reconciliation: implemented-only
- given: an opportunity in individual question evaluation with two evaluators who have both scored a proponent
- when: the first evaluator asks to see the second's scores, and asks again after the opportunity has moved to consensus
- then: the first request is refused and the second returns the second evaluator's scores and comments beside their name
- note: an administrator can read an individual evaluation at any stage.

### R-5.29 · v1 · confirmed · accepted

Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.
- cites: src/back-end/lib/permissions.ts:1007
- cites: src/back-end/lib/permissions.ts:1043
- cites: src/back-end/lib/permissions.ts:1524
- cites: src/back-end/lib/permissions.ts:1560
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/consensus.ts:155
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/consensus.ts:193
- reconciliation: implemented-only
- given: an opportunity in consensus
- when: an evaluator who is not the chair tries to record an agreed score for a proponent, and the chair records a second consensus for a proponent they have already agreed
- then: the evaluator's attempt is refused, and the chair's second attempt is refused as a duplicate
- note: a consensus is scored against the same rules as an individual evaluation — one score and one comment per question, within the question's maximum.

### R-5.30 · v1 · confirmed · accepted

The chair may reopen and resubmit a consensus as often as they like until it is finalised, unlike an individual evaluation, which is fixed once submitted.
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:106
- cites: src/shared/lib/resources/evaluations/team-with-us/resource-questions.ts:106
- cites: src/back-end/lib/permissions.ts:1043
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1922
- reconciliation: implemented-only
- given: a consensus the chair has already submitted, on an opportunity still in consensus
- when: the chair changes an agreed score and submits again
- then: the change is accepted and the consensus is recorded as submitted afresh

### R-5.31 · v1 · confirmed · accepted

When the chair submits the consensus, the opportunity's owner and every administrator are told.
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:215
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2202
- reconciliation: implemented-only
- given: an opportunity in consensus whose agreed scores are complete
- when: the chair submits them
- then: the opportunity's owner and all administrators are notified that the consensus has been submitted

### R-5.32 · v1 · confirmed · accepted

Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1820
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1897
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1923
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1952
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1834
- cites: src/shared/config.ts:56
- cites: src/shared/config.ts:58
- reconciliation: implemented-only
- given: a Sprint With Us opportunity in consensus with six proponents, five of whom met every minimum score
- when: the consensus scores are finalised
- then: every proponent's history records the agreed scores question by question, the four highest scoring of the five are moved into the code challenge, and the opportunity moves to the code challenge stage
- note: a proponent that is no longer under review of the questions — withdrawn or disqualified, say — is passed over even if their agreed scores would have placed them.

### R-5.33 · v1 · confirmed · accepted

When the consensus scores are finalised, the chair and the opportunity's owner are told.
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:240
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2230
- reconciliation: implemented-only
- given: an opportunity whose consensus scores are complete and submitted
- when: they are finalised
- then: the chair and the opportunity's owner are notified that the consensus has been finalised

### R-5.34 · v2 · confirmed · accepted

The tools for evaluating an opportunity are split by role: only an evaluator sees the evaluation instructions and the individual evaluation list, only the chair or the opportunity's owner or an administrator sees the consensus list, and only the owner or an administrator sees the panel itself.
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/index.ts:169
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/index.tsx:205
- cites: src/migrations/tasks/20240607173220_admin-evaluation-content-stubs.ts:8
- cites: src/front-end/typescript/config.ts:54
- reconciliation: implemented-only
- given: an opportunity being evaluated
- when: an evaluator, the chair, the opportunity's owner and an unrelated public sector employee each open it
- then: the evaluator is offered the instructions and the individual evaluations, the chair is offered the consensus, the owner is offered the consensus and the panel, and the unrelated employee is offered none of them
- note: the evaluation instructions are a fixed piece of editable site content, one for each program, so what an evaluator is told can be changed without changing the service.

### R-5.35 · v1 · confirmed · accepted

An evaluator works through the proponents one after another in anonymous-proponent order, saving as they move between them.
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/components/team-questions-carousel.tsx:43
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/components/team-questions-carousel.tsx:63
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:393
- reconciliation: implemented-only
- given: an evaluator scoring the second of three proponents
- when: they move to the next proponent
- then: their scores and comments for the second proponent are saved and the third proponent's questions are shown
- note: the proponents are ordered by their anonymous names, so an evaluator never sees which organization they are scoring while the questions are being evaluated.

### R-5.36 · v1 · confirmed · accepted

The two programs run the same evaluation from end to end, differing only in what the questions are called, how many proponents are carried forward, and what the stage that follows is named.
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
- cites: src/migrations/tasks/20240718222006_swu-evaluation-tables.ts:8
- cites: src/migrations/tasks/20250506164908_twu-evaluation-tables.ts:8
- cites: src/back-end/lib/db/evaluations/team-with-us/resource-questions.ts:53
- reconciliation: implemented-only
- given: one Sprint With Us and one Team With Us opportunity, each closing with proponents to evaluate
- when: each is taken through individual evaluation, consensus and finalising
- then: both follow published, individual question evaluation, consensus, and then their own next stage — the code challenge for Sprint With Us and the challenge for Team With Us — and neither can skip a stage or go back
- note: Sprint With Us calls them team questions and carries four proponents forward; Team With Us calls them resource questions and carries three. Team With Us gained its panel about ten months after Sprint With Us did, and its tables were copied from the Sprint With Us ones.

### R-5.37 · v1 · confirmed · accepted

A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation.
- replaces: R-5.15
