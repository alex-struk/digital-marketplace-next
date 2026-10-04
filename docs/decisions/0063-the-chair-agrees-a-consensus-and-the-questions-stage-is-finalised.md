# 0063 · The chair agrees a consensus and the questions stage is finalised (slice 18)

- Status: accepted for the build (slice 18)
- Date: 2026-10-04

## Context

Slice 18 builds the consensus stage of Sprint With Us and Team With Us opportunities: the Consensus
tab, the chair's per-proponent consensus screens, submitting and resubmitting the set, the
explanation shown to an owner off the panel, the one finalise action and its refusals, screening
proponents into the next stage, and the submitted and finalised notices (R-1.41, R-1.50, R-2.29,
R-5.10, R-5.12 to R-5.14, R-5.29 to R-5.33). It also answers for who reads individual evaluations
(R-5.28, built in slice 17), the shared shape of both programs' evaluation (R-5.36), and the shape of
multi-recipient notices (R-6.15).

The contract names the addresses (`/api/proposal/<program>/<proposal>/<questions>/consensus[/<chair>]`,
`/api/opportunity/<program>/<opportunity>/<questions>/consensus`) and the tags
`submitConsensusQuestionEvaluations` and `finalizeQuestionConsensuses`, not their bodies or answers.
These are the choices made.

## Decisions

**Where a consensus is kept.** In the kept schema's chair tables (`…ResponseChairEvaluations` and
their statuses), held under the chair's account, in the shape an individual evaluation is kept: a
status history (DRAFT when started, SUBMITTED each time the set is submitted) and one row per
question. The seed writes it there too. The two stores share the code that reads and writes these
tables (`readScoreSets`, `replaceScores`, `writeScores`, `writeStatus`).

**The answers.** A consensus is answered exactly as an individual evaluation is: `{ proposal: { id,
anonymousProponentName }, evaluationPanelMember: { id, name }, status, scores: [{ order, score, notes
}], createdAt, updatedAt }`, the chair as the panel member. Starting one (`POST`) takes `{ proposal,
status: "DRAFT", scores }`; a status other than DRAFT is refused. Changing one (`PUT`, tag `edit`)
takes `{ scores }`. A proposal holds one consensus: a second is answered 409 `{ "conflict": ["You
already have a team question consensus for this proposal."] }` (or "resource question"), worded as
R-5.3 is (design gap 9). Scores are kept as sent and checked when the set is submitted, with the same
rules as an individual evaluation (R-5.29 note).

**Who may record.** Only the chair, only while the opportunity is in `EVAL_QUESTIONS_CONSENSUS`, and
only for a proponent under review of the questions. Anyone else, and the chair once the stage is
over, is refused 401 — the design's request reference calls both "Refused: not permitted". A
submitted consensus can be changed as often as the chair likes until finalising, and stays
submitted (R-5.30).

**Who may read.** `mayReadConsensus` in `backend/src/rules/consensus.ts`: an administrator at any
stage (R-5.28's last clause); every panel member once consensus has begun; the owner from then if
they sit on the panel, and otherwise only once the question stages are over. An owner off the panel
asking for the list during consensus is answered 401 with the reason, and the tab shows the
explanation instead of an empty list (R-5.12). Anybody else finds nothing (404). The opportunity's
`proponents` (anonymous names only) now also go to whoever may read the consensus, so an
administrator off the panel sees the rows.

**Who reads individual evaluations** is unchanged from decision record 0062. The consensus create
page is the way a panel member reads the others' scores: before consensus it is the missing page to
everyone, chair included; from consensus the chair gets the form, and any other panel member reads
every evaluator's scores beside their names with the chair-only notice. The page offers no form to
anyone else.

**Submitting the set.** `submitConsensusQuestionEvaluations`, from the chair at consensus. Every
proponent under review of the questions must have a complete consensus, or nothing is submitted and
the answer is "The consensus scores could not be submitted because they are incomplete. …". Each is
then recorded as submitted, afresh if it already was, and the owner and every active administrator
are told (R-5.31). The tab asks first, as the design's dialog does.

**Finalising.** `finalizeQuestionConsensuses` is the one way out of the stage (R-1.50). It is
accepted from the owner or an administrator (R-5.14), and both are offered "Finalize consensus
scores" in the manage page's action bar; the chair is not. Anybody else is refused 401. The checks
run in this order: the stage; every proponent still under review of the questions has a submitted
consensus ("Not all consensuses have been submitted.", R-5.13, R-1.41); and at least one met every
minimum ("You must have at least one proponent that can be screened into the Code Challenge." or
"… the Challenge.", R-5.10). Then, as one change with the opportunity row held and its stage
checked again:

- every proponent under review gets a history row by the finaliser with the event
  `QUESTIONS_SCORE_ENTERED` and the note "Team question scores were entered. Q1: 5; Q2: 5; Q3: 5;
  Q4: 5." ("Resource question …" for Team With Us), shown on the history tab as "Team question
  scores entered";
- those that met every minimum are ranked by their agreed total, equal totals in anonymous order,
  and the first four (Sprint With Us) or three (Team With Us) move to `UNDER_REVIEW_CODE_CHALLENGE` or
  `UNDER_REVIEW_CHALLENGE` with the note "Consensus scores finalized.", at the same moment as the
  score row; the rest stay at `UNDER_REVIEW_QUESTIONS` (the seed's own "left behind at the
  questions"), and a proponent no longer under review is passed over (R-2.29, R-5.32);
- the opportunity moves to `EVAL_CC` or `EVAL_C` with the same note.

The chair and the owner are then told (R-5.33). The responses' own integer score column is left
alone: agreed scores may carry decimals, and the scoresheet already reads the chair tables.

`startCodeChallenge` and `startChallenge` from the consensus stage are refused with "The opportunity
leaves the consensus stage only when the consensus scores are finalized." (R-1.50). Elsewhere they
are still not taken (slice 19).

**The finalise refusal on screen.** One alert, the opportunities domain's `advance-refused-message`,
above the tab whichever tab is open, with an inner `evaluation-not-all-submitted-error` or
`evaluation-no-screenable-error` naming which refusal it is (design gap 13). The Summary tab says
what finalising does when it is offered.

**The shape of a staff notice (R-6.15).** R-6.15 asks that a notice to more than one person hide
every recipient from the others, carrying the batch as blind copies with the service's own address
as the visible recipient, and that the notices to a panel and to an opportunity's owner go the same
way. The open-ended audiences (new-opportunity announcements, changes, cancellations, the panel being
named) already went that way (`blindCopiedBatches`). The small, named staff notices — the panel at
closing, ready for consensus, consensus submitted, consensus finalised, a withdrawal to the
administrators — now do too: `blindCopiedToStaff` in `mail/message.ts` leaves out a recipient with
no address, tells a person named twice once, and hands the rest to `blindCopiedBatches` at the
configured batch size. Every such message is visibly addressed to the service's own address alone,
with the readers as blind copies. A withdrawal still tells the withdrawing vendor in a message of
their own, as that is a notice to one person. There is no longer any way to make a copy visibly
addressed to a reader beside the service's address.

## What would reverse it

- If finalising should also record the agreed total on the responses' score column, that is one
  statement in `PrismaConsensusStore.finalize`.
