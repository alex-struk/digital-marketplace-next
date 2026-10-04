# 0064 · An individual submission covers the proposals it names

## Context

The contract says that for `submitIndividualQuestionEvaluations` the value is
`{ note, proposals: [proposal id, ...] }`, and that the service validates and submits the signed-in
panel member's evaluation of each proposal named, and of no other. It does not require every proposal
of the opportunity to be named. R-5.25 v3 says the service refuses only a submitted set that contains
an incomplete evaluation. R-5.27 v2 counts the submitted scores toward the move to consensus only over
the proponents named in the submission that triggers the check.

Until now the service ignored the value. It checked completeness, and counted toward consensus, over
every proponent under review of the questions. As a result, a submission naming two complete
proponents was refused when a third proponent had no scores.

## Decision

`IndividualEvaluationsService.submitAll` reads `value.proposals` through `readNamedProposals`
(`rules/individual-evaluation.ts`):

- **Named proposals.** Each named proposal must be a proponent of this opportunity under review of its
  questions. Otherwise the request is refused with "A proposal named for submission is not a proponent
  of this opportunity being evaluated on its questions." Completeness is checked over the signed-in
  evaluator's evaluations of those proposals only. A named proposal with no evaluation is incomplete.
  Only those evaluations are submitted, or none of them. If all of them are already submitted, the
  existing "already submitted" refusal applies.
- **Counting toward consensus.** The count is evaluators × named proposals × questions, against the
  panel and questions as they now stand. When a submission names two of three proponents and every
  evaluator has submitted those two, the opportunity moves to consensus. This follows R-5.27 v2 as
  written.
- **A value that names nothing.** If the value is missing, or has no `proposals` (or `proposals` is
  null), the request means every proponent under review, as before. The application's own screen still
  sends the tag alone. It offers submission only once every proponent is complete (R-5.25, first
  sentence), so for that screen "all under review" and "every proponent" are the same set.
- **Empty or unreadable lists.** An empty list names nothing to submit and is refused as "no proponents
  to evaluate". A `proposals` that is not a list of identifiers is refused as unreadable.

The chair-and-owner notice is unchanged. It is still one message visibly addressed to the service,
with both of them as blind copies (R-6.15).
