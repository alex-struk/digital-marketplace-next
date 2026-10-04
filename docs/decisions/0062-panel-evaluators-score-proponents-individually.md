# 0062 · Panel evaluators score proponents individually (slice 17)

- Status: accepted for the build (slice 17)
- Date: 2026-10-04

## Context

Slice 17 builds individual question evaluation for Sprint With Us and Team With Us opportunities:
the dashboard's Evaluations section, the evaluator's Instructions and Evaluation tabs, the
per-proponent scoring screens, saving drafts, submitting the whole set, the automatic move to
consensus with its notice, and who may read an individual evaluation (R-5.3, R-5.11, R-5.19,
R-5.21 to R-5.28, R-5.34 to R-5.36). It also answers for three things earlier slices built: the
anonymous names and first review stage given at closing (R-1.24, R-2.5, slice 16) and the window in
which the panel may change (R-5.16, slice 10). Those needed no change here.

The contract names the addresses (`/api/proposal/<program>/<proposal>/<questions>/evaluations[/<evaluator>]`,
`/api/opportunity/<program>/<opportunity>/<questions>/evaluations`) and the tag
`submitIndividualQuestionEvaluations`, but not their bodies or answers. The criteria R-5.11 and
R-5.28 disagree about who reads an individual evaluation (design gap 3). These are the choices made.

## Decisions

**Who reads an individual evaluation.** Its evaluator, at any stage. Once the consensus stage has
begun, every member of the panel. Once the question stages are over (code challenge, team scenario,
challenge, processing, awarded), the opportunity's owner and administrators who are not on the panel
as well. Nobody else, ever. This takes R-5.28's body as written: before consensus, "no one but the
evaluator who wrote them". It also takes R-5.11's limit: never a public sector employee with no tie
to the opportunity. It does not follow R-5.28's note that "an administrator can read an individual
evaluation at any stage", because that note contradicts the sentence it hangs on. An owner off the
panel is treated like an administrator off the panel, which matches R-5.12: the consensus is held
back from them until the next stage too. The rule is `mayReadIndividualEvaluation` in
`backend/src/rules/individual-evaluation.ts`. Someone who may not read an evaluation is answered 404,
the same as if there were none.

**The answers.** An evaluation is answered as `{ proposal: { id, anonymousProponentName },
evaluationPanelMember: { id, name }, status: "DRAFT" | "SUBMITTED", scores: [{ order, score, notes }],
createdAt, updatedAt }`. Starting one (`POST`) takes `{ proposal, status: "DRAFT", scores }`. The
evaluator comes from the session. A status other than `DRAFT` is refused. A second start is answered
409 `{ "conflict": ["You already have a team question evaluation for this proposal."] }` (or
"resource question"), as the contract says. Changing one (`PUT`, tag `edit`) takes `{ scores }` as
its value. Any other tag, `submit` among them, is refused 400 as an unrecognised request, so an
evaluation is never submitted alone (R-5.26): `{ "errors": ["Unrecognised request: \"submit\" is
not recognised for an evaluation. …"] }`. The boundary leaves the tag on these two routes to the
service (`withAnyEvaluationTag` in `common/contract.ts`). Otherwise the validator would answer first,
in words that only list the allowed values and never say the request was not recognised. Scores are kept as sent, out of range or not (R-5.23). Only orders that name one of the
opportunity's questions are kept.

**Who may record.** Only an evaluator on the panel of the opportunity's current version may record,
only while the opportunity is in `EVAL_QUESTIONS_INDIVIDUAL`, and only for a proposal in
`UNDER_REVIEW_QUESTIONS`. Not being an evaluator is refused 401. The wrong stage or proposal state is
refused 400. A draft can be changed only by its own evaluator, only while it is a draft, and only at
that stage. Once submitted it is fixed (R-5.24).

**A question with a comment and no score.** The kept schema's score column cannot be empty. A draft
question that has a comment and no score yet is stored as `NaN`, and read back as no score. It counts
as incomplete.

**Submitting.** `submitIndividualQuestionEvaluations` on the opportunity submits the evaluator's
whole set. The set is every proponent still in `UNDER_REVIEW_QUESTIONS`; any `value` is ignored.
Every one of them must have a complete evaluation, or nothing is submitted and the answer is R-5.25's
sentence. Complete means one score per question, between 0 and its maximum with at most two decimal
places, and a comment that is not blank. A set that is already submitted is refused. In the same
transaction, with the opportunity row locked, the service counts the submitted scores. If there is
one per question per proponent per evaluator, counted against the current version's panel and
questions (R-5.27), the opportunity moves to `EVAL_QUESTIONS_CONSENSUS`. That status row has no
author and carries the note "Every evaluator submitted their individual scores, so the consensus
stage began." The lock means two last submissions cannot both miss the moment. The chair and the
owner are then each sent a message of their own ("A … Opportunity is Ready for Consensus: <title>"),
addressed visibly to them alone, and each to an active account only. An earlier revision sent one
message with both as blind copies, as R-6.15's wording has it. In the sandbox nobody was then a
visible recipient, so a reader of the mail found nothing for the chair or the owner. This is the
same correction slice 16 made to the closing notice (decision record 0060). Neither reader sees who
else was told, which is what R-6.15 protects. Whether R-6.15's literal shape (the service's own address
visible, the batch blind-copied) should hold for these small staff notices is for slice 18, which
answers for R-6.15.

**What the panel is told on the opportunity.** Once the opportunity has closed, a member of its panel
reads it with `proponents`. These are the proposals that went forward, by anonymous name in that
order ("Proponent 2" before "Proponent 10"), each with its state and its answers to the questions,
and with no organization (R-5.35). The list of opportunities now carries each one's current panel to
whoever may see the panel (R-5.18). That is how the dashboard finds the opportunities a person
evaluates (R-5.19), drafts included, without asking every opportunity separately. The list admits
whoever may open the opportunity, so a public sector employee on a draft's panel finds that draft
in the list. An earlier revision filtered the list by the general reading rule alone, and that rule
hides a draft from everyone but its author and administrators. The draft then never reached the
member's dashboard, although they could open it by address.

**The manage page for the panel.** The tabs follow R-5.34 and the design's table. An evaluator gets
Instructions and Evaluation, and an evaluator who does not manage the opportunity opens on
Instructions. The chair, the owner and administrators get Consensus once the opportunity has closed.
The owner and administrators keep the manage page's own tabs and the Evaluation panel tab. Someone
offered no tab sees the missing page, and so does anyone who asks by address for an evaluation tab
they are not offered (design gap 5). An author or administrator who asks for an unknown tab still
lands on Summary, as before. The chair is offered Consensus from closing, not only from the consensus
stage as the design's table has it. R-5.34's seeded case (`swuLapsedChairNotEvaluator`) asks what
the chair is offered while questions are still evaluated individually, and the owner already gets
the tab from closing. Until the consensus screens exist, the Consensus tab only says what stage the
opportunity is at.

**Moving between proponents.** "Save and go to next" and "Save and go to previous" save what is on
the screen and open the neighbouring proponent in anonymous order. That is the person's own
evaluation if they hold one, or a new one if not. At either end they return to the Evaluation tab
(design gap 10). "Save draft" on a new evaluation goes on to the evaluation's own address with
`?saved=draft`. There the form lists anything that would stop the scores being submitted. Scores are
read from the field as typed, so nothing is rounded on the way.

## Consequences

The consensus stage (slice 18) builds on `IndividualEvaluationsService`. Its proposal-level list
already answers every evaluation the reader may see, which is what the consensus screens show beside
the chair's form. The consensus addresses, the consensus list and finalising are not built here.
