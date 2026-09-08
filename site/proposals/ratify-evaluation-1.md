| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-07T04:41:56.566Z |
| holder | agent:product-owner |

# Which of the evaluation criteria that are still inferred or open become the contract?

**Recommendation.** 22 criterion(s) in evaluation are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

22 criterion(s) in the **evaluation** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-evaluation-2 · v1 · open · recovered

Every panel member must be an evaluator, a chair, or both; a member who is neither is rejected.

- reconciliation: implemented-only
- given: an opportunity with an evaluation panel
- when: a panel member is recorded who is neither an evaluator nor the chair
- then: the panel is rejected
- cites: src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts:57
- cites: src/migrations/tasks/20240527213854_add-evaluation-committee-panel-tables.ts:149
- note: this rule is held only in the database, not in the code that validates a submitted panel, so the observable failure is a stored-data error rather than a field-level message. What a person actually sees when it happens could not be determined without running the old application.
- note: the chair is allowed not to be an evaluator. The browser form offers the chair as a separate choice from the list of evaluators and marks that person as chair-but-not-evaluator unless one of the evaluators has been ticked as chair, so a panel of two evaluators plus a separate chair holds three people.

### D-evaluation-4 · v1 · inferred · recovered

The evaluation panel may be set or changed while an opportunity is a draft, under review, published, or in individual question evaluation, and is fixed from the consensus stage onwards.

- reconciliation: implemented-only
- given: an opportunity whose questions are being evaluated individually
- when: its owner changes the evaluation panel, and then tries again once the opportunity has moved to consensus
- then: the first change is accepted and the second is refused
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1998
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1382
- note: because the panel is recorded against a version of the opportunity and changing it writes a new version, a panel change also appears in the opportunity's history as an edit, and the count of evaluators the service waits for changes with it.

### D-evaluation-5 · v1 · inferred · recovered

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.

- reconciliation: implemented-only
- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:147
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
- note: the same change made while the opportunity is still a draft notifies nobody.

### D-evaluation-6 · v1 · inferred · recovered

The membership of an evaluation panel is shown only to an administrator, the opportunity's owner, and the people on the panel itself.

- reconciliation: implemented-only
- given: an opportunity with an evaluation panel
- when: a vendor, or a public sector employee who is neither the owner nor on the panel, opens the opportunity
- then: no panel membership is shown to them, while an administrator, the owner and each panel member all see it
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:892
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:934

### D-evaluation-7 · v1 · inferred · recovered

A panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating.

- reconciliation: implemented-only
- given: a draft opportunity whose panel names a public sector employee who did not create it
- when: that person opens their dashboard and then the opportunity
- then: the opportunity is listed under "Evaluations" and they can open it, whereas another public sector employee cannot see it at all
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:524
- cites: src/front-end/typescript/lib/pages/dashboard.tsx:789

### D-evaluation-8 · v1 · inferred · recovered

When an opportunity closes it enters individual question evaluation, and every evaluator on its panel is told it is ready to evaluate.

- reconciliation: implemented-only
- given: a published opportunity with a panel of two evaluators and a separate chair, and submitted proposals against it
- when: its proposal deadline passes
- then: the opportunity moves to individual question evaluation and the two evaluators are notified, while the chair who is not an evaluator is not
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1455
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1525
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:172
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1631
- note: this is the same closing event that moves the submitted proposals into review and gives each an anonymous proponent name; the evaluation domain inherits that from the proposals domain rather than restating it.

### D-evaluation-9 · v1 · inferred · recovered

Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation.

- reconciliation: implemented-only
- given: an opportunity in individual question evaluation
- when: the chair who is not an evaluator, or the opportunity's owner who is not on the panel, tries to score a proponent
- then: the attempt is refused, whereas an evaluator on the panel may score
- cites: src/back-end/lib/permissions.ts:1025
- cites: src/back-end/lib/permissions.ts:1542
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:203
- note: an evaluator who tries the same thing once the opportunity has moved to consensus is refused as well.

### D-evaluation-11 · v1 · inferred · recovered

An evaluation carries one score and one comment per question, the score being between zero and that question's maximum with at most two decimal places, and the comment being at least one word.

- reconciliation: implemented-only
- given: an evaluator scoring a proponent against a question worth five points
- when: they enter six, or a score with three decimal places, or leave the comment empty
- then: the entry is rejected and the evaluation cannot be submitted until every question has a score in range and a comment
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:58
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:65
- cites: src/shared/lib/validation/evaluations/sprint-with-us/team-questions.ts:136
- cites: src/shared/lib/validation/evaluations/team-with-us/resource-questions.ts:58
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:163

### D-evaluation-12 · v1 · inferred · recovered

Scores and comments are checked when an evaluation is submitted, not when it is saved as a draft.

- reconciliation: implemented-only
- given: an evaluator part-way through scoring a proponent
- when: they save a draft in which one score is above the question's maximum and one comment is empty
- then: the draft is saved as entered, and the evaluation is refused only later, when they try to submit
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:248
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:379
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1808
- note: the browser form checks each field as it is typed, so this is reachable through the service rather than through the form. Nothing in the code says whether unchecked drafts are intended; a human may want to rule on it.

### D-evaluation-13 · v1 · inferred · recovered

An evaluator may change their own evaluation only while it is still a draft and the opportunity is still in individual question evaluation; once submitted it cannot be changed at all.

- reconciliation: implemented-only
- given: an evaluator who has submitted their scores for a proponent
- when: they try to change a score or a comment
- then: the change is refused and the submitted scores stand
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:370
- cites: src/back-end/lib/permissions.ts:1056
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:94
- cites: src/back-end/lib/resources/proposal/team-with-us/resource-questions/evaluations.ts:370
- note: one evaluator cannot edit another's evaluation at any point, whatever its state.

### D-evaluation-14 · v1 · inferred · recovered

An evaluator submits every one of their evaluations for an opportunity in a single action, and the submission is refused unless each one scores every question of every proponent.

- reconciliation: implemented-only
- given: an evaluator with three proponents to score and a complete draft for only two of them
- when: they submit their scores for consensus
- then: the submission is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." and none of the three is submitted
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1748
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1825
- cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1205
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/evaluation.tsx:139
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/evaluation.tsx:505

### D-evaluation-15 · v1 · inferred · recovered

A request to submit one evaluation on its own is refused; submission is only accepted as the whole set for the opportunity.

- reconciliation: conflicting
- given: an evaluator with one complete draft evaluation
- when: a request is sent to submit that evaluation by itself
- then: the request is rejected as unrecognised, and the evaluation stays a draft
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:306
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:72
- note: the shared description of the evaluation interface declares a "submit" action on the single-evaluation route, but the service's own parser accepts only "edit" there and treats anything else as unreadable. The declared interface and the running service therefore disagree; the service is the stricter of the two.

### D-evaluation-16 · v1 · inferred · recovered

An opportunity moves from individual evaluation to consensus by itself, once every evaluator has submitted a score for every question of every proponent, and the chair and the opportunity's owner are told it is ready.

- reconciliation: implemented-only
- given: an opportunity in individual question evaluation with two evaluators, three proponents and four questions
- when: the second evaluator submits the last of their scores, bringing the total to twenty-four submitted scores
- then: the opportunity moves to consensus, and the chair and the opportunity's owner are notified
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1718
- cites: src/back-end/lib/db/evaluations/sprint-with-us/team-questions.ts:339
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:193
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1631
- note: the count is taken against the panel and the questions of the opportunity's most recent version, so changing the panel during individual evaluation changes how many submissions are awaited.

### D-evaluation-17 · v1 · inferred · recovered

Once an opportunity reaches consensus, every member of its panel can read every evaluator's individual scores and comments for a proponent, and before then no one but the evaluator who wrote them can.

- reconciliation: implemented-only
- given: an opportunity in individual question evaluation with two evaluators who have both scored a proponent
- when: the first evaluator asks to see the second's scores, and asks again after the opportunity has moved to consensus
- then: the first request is refused and the second returns the second evaluator's scores and comments beside their name
- cites: src/back-end/lib/permissions.ts:980
- cites: src/back-end/lib/permissions.ts:894
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/evaluations.ts:85
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:1246
- note: an administrator can read an individual evaluation at any stage.

### D-evaluation-18 · v1 · inferred · recovered

Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.

- reconciliation: implemented-only
- given: an opportunity in consensus
- when: an evaluator who is not the chair tries to record an agreed score for a proponent, and the chair records a second consensus for a proponent they have already agreed
- then: the evaluator's attempt is refused, and the chair's second attempt is refused as a duplicate
- cites: src/back-end/lib/permissions.ts:1007
- cites: src/back-end/lib/permissions.ts:1043
- cites: src/back-end/lib/permissions.ts:1524
- cites: src/back-end/lib/permissions.ts:1560
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/consensus.ts:155
- cites: src/back-end/lib/resources/proposal/sprint-with-us/team-questions/consensus.ts:193
- note: a consensus is scored against the same rules as an individual evaluation — one score and one comment per question, within the question's maximum.

### D-evaluation-19 · v1 · inferred · recovered

The chair may reopen and resubmit a consensus as often as they like until it is finalised, unlike an individual evaluation, which is fixed once submitted.

- reconciliation: implemented-only
- given: a consensus the chair has already submitted, on an opportunity still in consensus
- when: the chair changes an agreed score and submits again
- then: the change is accepted and the consensus is recorded as submitted afresh
- cites: src/shared/lib/resources/evaluations/sprint-with-us/team-questions.ts:106
- cites: src/shared/lib/resources/evaluations/team-with-us/resource-questions.ts:106
- cites: src/back-end/lib/permissions.ts:1043
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1922

### D-evaluation-20 · v1 · inferred · recovered

When the chair submits the consensus, the opportunity's owner and every administrator are told.

- reconciliation: implemented-only
- given: an opportunity in consensus whose agreed scores are complete
- when: the chair submits them
- then: the opportunity's owner and all administrators are notified that the consensus has been submitted
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:215
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2202

### D-evaluation-22 · v1 · inferred · recovered

Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.

- reconciliation: implemented-only
- given: a Sprint With Us opportunity in consensus with six proponents, five of whom met every minimum score
- when: the consensus scores are finalised
- then: every proponent's history records the agreed scores question by question, the four highest scoring of the five are moved into the code challenge, and the opportunity moves to the code challenge stage
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1820
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1897
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1923
- cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1952
- cites: src/back-end/lib/db/opportunity/team-with-us.ts:1834
- cites: src/shared/config.ts:56
- cites: src/shared/config.ts:58
- note: a proponent that is no longer under review of the questions — withdrawn or disqualified, say — is passed over even if their agreed scores would have placed them.

### D-evaluation-23 · v1 · inferred · recovered

When the consensus scores are finalised, the chair and the opportunity's owner are told.

- reconciliation: implemented-only
- given: an opportunity whose consensus scores are complete and submitted
- when: they are finalised
- then: the chair and the opportunity's owner are notified that the consensus has been finalised
- cites: src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx:240
- cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2230

### D-evaluation-24 · v1 · inferred · recovered

The tools for evaluating an opportunity are split by role: only an evaluator sees the evaluation instructions and the individual evaluation list, only the chair or the opportunity's owner sees the consensus list, and only the owner sees the panel itself.

- reconciliation: implemented-only
- given: an opportunity being evaluated
- when: an evaluator, the chair, the opportunity's owner and an unrelated public sector employee each open it
- then: the evaluator is offered the instructions and the individual evaluations, the chair is offered the consensus, the owner is offered the consensus and the panel, and the unrelated employee is offered none of them
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/index.ts:169
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/index.tsx:205
- cites: src/migrations/tasks/20240607173220_admin-evaluation-content-stubs.ts:8
- cites: src/front-end/typescript/config.ts:54
- note: the evaluation instructions are a fixed piece of editable site content, one for each program, so what an evaluator is told can be changed without changing the service.

### D-evaluation-25 · v1 · inferred · recovered

An evaluator works through the proponents one after another in anonymous-proponent order, saving as they move between them.

- reconciliation: implemented-only
- given: an evaluator scoring the second of three proponents
- when: they move to the next proponent
- then: their scores and comments for the second proponent are saved and the third proponent's questions are shown
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/components/team-questions-carousel.tsx:43
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/lib/components/team-questions-carousel.tsx:63
- cites: src/front-end/typescript/lib/pages/proposal/sprint-with-us/view/tab/team-questions.tsx:393
- note: the proponents are ordered by their anonymous names, so an evaluator never sees which organization they are scoring while the questions are being evaluated.

### D-evaluation-30 · v1 · inferred · recovered

The two programs run the same evaluation from end to end, differing only in what the questions are called, how many proponents are carried forward, and what the stage that follows is named.

- reconciliation: implemented-only
- given: one Sprint With Us and one Team With Us opportunity, each closing with proponents to evaluate
- when: each is taken through individual evaluation, consensus and finalising
- then: both follow published, individual question evaluation, consensus, and then their own next stage — the code challenge for Sprint With Us and the challenge for Team With Us — and neither can skip a stage or go back
- cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
- cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
- cites: src/migrations/tasks/20240718222006_swu-evaluation-tables.ts:8
- cites: src/migrations/tasks/20250506164908_twu-evaluation-tables.ts:8
- cites: src/back-end/lib/db/evaluations/team-with-us/resource-questions.ts:53
- note: Sprint With Us calls them team questions and carries four proponents forward; Team With Us calls them resource questions and carries three. Team With Us gained its panel about ten months after Sprint With Us did, and its tables were copied from the Sprint With Us ones.

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

The question is which of the 22 still-inferred or open evaluation criteria become the contract. I approve, and rule on all 22: sixteen confirmed, four edited, one marked a defect, none left short. What tipped the sixteen is that each was read against its cited lines in sources/old and the code leaves no second reading. The panel lifecycle is a literal status list in both programs (canChangeEvaluationPanel admits Draft, UnderReview, Published and the individual-question stage and nothing else, in sprint-with-us.ts:631 and team-with-us.ts:585, and the update handler at index.ts:1998 refuses outside it). The notification rules are five single functions with no alternate path: handleSWUPanelChange diffs the new panel ids against the existing ones and fires only when status is not Draft; handleSWUReadyForEvaluation filters on the evaluator flag with the comment 'Only notify evaluators'; handleSWUReadyForQuestionConsensus and handleSWUQuestionConsensusFinalized address the chair plus createdBy; handleSWUQuestionConsensusSubmitted addresses the author plus every admin. Closing is literal in closeSWUOpportunities: status becomes EvaluationTeamQuestionsIndividual with the note 'This opportunity has closed.', submitted proposals move to UnderReviewTeamQuestions and are stamped 'Proponent N'. Panel visibility is one guard (readOneSWUOpportunity attaches evaluationPanel and history only for admin, creator or a panel member) and panel-member reach into private opportunities is the orWhereIn subselect on swuEvaluationPanelMembers, surfaced as the dashboard tab literally labelled 'Evaluations'. Scoring rules are validateNumberWithPrecision(raw, 0, maxScore, 2) and validateGenericStringWords(raw, 'Notes', 1), with the score array required to match the question count. The draft/submitted asymmetry is two adjacent functions, isValidEvaluationStatusChange allowing only Draft to Submitted against isValidConsensusStatusChange allowing Submitted to Submitted as well, and the 'Only drafts can be edited' guard appears identically in the Sprint and Team resources. Consensus authority is chair-only at create, author-only at edit, with the duplicate refused by the same conflict check the individual path uses. Finalising is one transaction: a QuestionsScoreEntered history record per proposal, a filter on UnderReviewTeamQuestions plus every question's minimumScore, a sort and a slice to SWU_CODE_CHALLENGE_SCREEN_IN_COUNT = 4 (TWU 3), then the status move. Program parity is the two isValidStatusChange functions side by side. D-evaluation-12 I confirmed as a record rather than an endorsement: both write paths pass scores through getNumber and getString untouched and validation runs only on the submit path, so unvalidated drafts are the confirmed behaviour; whether the rebuild should keep them is a design question, not an archaeological one. Four I did not confirm because the code contradicts them. D-evaluation-17's note is wrong: an off-panel administrator cannot read an individual evaluation during either evaluation stage, because doesSWUOpportunityStatusAllowGovToViewTeamQuestionResponseEvaluations returns true only for code challenge, team scenario and awarded; the unconditional admin path exists for consensuses, not for individual evaluations. D-evaluation-24 says 'only the owner' where canGovUserViewTab tests isOpportunityOwnerOrAdmin, computed as creator or admin. D-evaluation-14 and D-evaluation-16 share one gap: the submit handler validates each evaluation in the set it is given, the browser sends only the drafts that exist, and the completeness count is taken over the proponents named in that submission, so an opportunity can reach consensus with a proponent an evaluator never opened. Each is edited to state what is actually enforced and name the gap, so no later stage builds on a guarantee that is not there. D-evaluation-2 I ruled a defect: the evaluator-or-chair rule exists only as the Postgres check constraint evaluatorOrChair on both panel tables, and validateSWUEvaluationPanelMembers checks minimum count, a single chair and uniqueness but never this, so the old application answers a bad panel with a constraint violation instead of a field message; the record stands and the replacement requires the service to refuse it. What would change this ruling: a second call site or a test showing any of the four gaps is closed elsewhere would turn that edit back into a plain confirmation, and evidence that a confirmed criterion has a bypass path I did not read would send it back to inferred.

**Conditions:**
- defect D-evaluation-2: A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation.
- confirm D-evaluation-4
- confirm D-evaluation-5
- confirm D-evaluation-6
- confirm D-evaluation-7
- confirm D-evaluation-8
- confirm D-evaluation-9
- confirm D-evaluation-11
- confirm D-evaluation-12
- confirm D-evaluation-13
- edit D-evaluation-14: An evaluator submits all of their existing draft evaluations for an opportunity in a single action, and the whole set is refused with "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again." — none of it submitted — unless every evaluation in the set carries an in-range score and a comment for every question of the opportunity; the service does not check that the evaluator holds an evaluation for every proponent, so a proponent they never opened is simply absent from the set rather than blocking the submission.
- confirm D-evaluation-15
- edit D-evaluation-16: An opportunity moves from individual evaluation to consensus by itself once the submitted individual scores number one per question per proponent per evaluator, counted against the panel and the questions of the opportunity's most recent version but only over the proponents named in the submission that triggers the check, and the chair and the opportunity's owner are then told it is ready.
- edit D-evaluation-17: Once an opportunity reaches consensus, every member of its panel can read every evaluator's individual scores and comments for a proponent, and before then no one but the evaluator who wrote them can; an administrator who is not on the panel gains access to individual evaluations only after the question stages have passed, at code challenge, team scenario or awarded, whereas a consensus may be read by an administrator at any stage.
- confirm D-evaluation-18
- confirm D-evaluation-19
- confirm D-evaluation-20
- confirm D-evaluation-22
- confirm D-evaluation-23
- edit D-evaluation-24: The tools for evaluating an opportunity are split by role: only an evaluator sees the evaluation instructions and the individual evaluation list, only the chair or the opportunity's owner or an administrator sees the consensus list, and only the owner or an administrator sees the panel itself.
- confirm D-evaluation-25
- confirm D-evaluation-30
