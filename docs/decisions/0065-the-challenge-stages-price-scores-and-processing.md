# 0065 · The challenge stages, price scores and the move to processing (slice 19)

- Status: accepted for the build (slice 19)
- Date: 2026-10-04

## Context

Slice 19 builds the stages after the questions of Sprint With Us and Team With Us opportunities —
the code challenge and team scenario, and the challenge — with stage-by-stage scoring and its
wrong-stage refusals (R-2.28), screening in to the team scenario and the guard on starting it
(R-1.42), price scores (R-2.30), weighted totals and ranking (R-2.31), the move to processing in
every program (R-1.25) and the award out of processing in all three alike (R-1.49). It answers for
the proposal history of state changes and scores (R-2.35) built in slice 16. The contract names the
tags (`scoreCodeChallenge`, `screenInToTeamScenario`, `screenOutFromTeamScenario`,
`scoreTeamScenario`, `scoreChallenge`, `screenInToChallenge`, `screenOutFromChallenge`,
`startTeamScenario`) and nothing about their values or answers. These are the choices made. The
rules are in `backend/src/rules/team-evaluation.ts`, shared by the service and the proposal page.

## Decisions

**Stage scores.** `PUT /api/proposals/<program>/<id>` with `{ tag, value }`, the value a score out
of 100 with at most two decimal places, as for Code With Us (`readScore`). Only an administrator or
the opportunity's author (401 otherwise, as slice 16). The proposal is checked before the
opportunity, as the surface describes: a proposal not carried into the stage — not under review
there and not already scored there — is refused 401 with the general message "You do not have
permission to perform this action."; one that is, on an opportunity standing at another stage, is
refused 400 with "The opportunity is not in the correct stage of evaluation to perform that
action."; a bad score is then 400 `score: …`. A score may be changed while the stage lasts. Entering
one writes the score, moves the proposal to evaluated at that stage when it is not there already,
and a millisecond later records an event — `CHALLENGE_SCORE_ENTERED` or `SCENARIO_SCORE_ENTERED`,
noted `A code challenge score of "90%" was entered.` — by the person, shown in the history as "Code
challenge score entered: 90%".

**Screening.** A Sprint With Us proponent scored on the code challenge is screened in to the team
scenario (`EVALUATED_CODE_CHALLENGE` → `UNDER_REVIEW_TEAM_SCENARIO`, note "Screened in.") or out
again (note "Screened out."), only while the opportunity is at the code challenge, with the same
order of refusals. The two Team With Us screening tags are refused 400 with "Proponents are screened
in to the challenge when the consensus scores are finalized.": finalising already carries the top
three in (decision record 0063), and no criterion asks for a second way.

**Starting the team scenario (R-1.42).** `startTeamScenario` on the opportunity, from its author or
an administrator, only from the code challenge (anywhere else the program's path refuses it, and from
consensus the slice 18 message). Refused 400 while any proponent is still under review in the code
challenge — "All proponents must be scored first. Score or disqualify every proponent in the code
challenge, and at least one must remain screened in.", the design's wording — or while nobody is
screened in. The manage page offers "Start team scenario" at the code challenge and shows a refusal
in `advance-refused-message`. `startCodeChallenge` and `startChallenge` outside consensus are now
refused by the program's path (`transitionRefusal`) rather than as "not yet available".

**The end of the final stage (R-1.25, R-2.30).** After every stage score and every disqualification,
if the opportunity stands at its final stage (`EVAL_SCENARIO`, `EVAL_C`), nobody there is still under
review and somebody is scored, then, as one change with the opportunity row held and its stage
checked again: each proposal evaluated at the final stage gets its price score — the lowest of their
bids divided by its own, as a percentage to two places — with a `PRICE_SCORE_ENTERED` event by
nobody (`A price score of "50%" was calculated.`, "Price score calculated: 50%"), and the opportunity
moves to `PROCESSING` by nobody with "Automatically moved to Processing as all proposals have been
evaluated.". A proponent left behind at an earlier stage is not waited for and has no price score.
A Sprint With Us bid is its total proposed cost; a Team With Us bid is each person's hourly rate
weighted by their resource's target allocation (R-2.30 note).

**Scores with decimals.** The kept schema held the stage and price score columns as integers, which
would round a two-decimal score and every price score. Migration `20261006000001` makes them double
precision; whole numbers already stored are unchanged.

**Total and rank (R-2.31).** Unchanged from slice 16's `teamScoresheet`: the total is taken only once
every stage has a score, so only fully evaluated proposals hold a rank. The list of an opportunity's
proposals now carries each one's scoresheet to staff, for the stage tabs.

**Award (R-1.49).** Slice 16's award already accepted Team With Us out of processing, and the
permitted-transition table already lists awarded and cancelled from processing in every program. The
Team With Us manage page in processing now offers "Award a proposal" (to the Proposals tab, where
each proposal's page awards it) beside cancellation.

**The screens.** The read-only proposal page has the catalogue's tabs: Proposal, Team questions,
Code challenge, Team scenario and History (Sprint With Us); Proposal, Resource questions, Challenge
and History (Team With Us). A stage tab says which stage the opportunity is at, shows the stage's
score, and offers its score button (`proposal-score-code-challenge`, `proposal-score-team-scenario`,
`proposal-score-challenge`) and, on the code challenge tab, screening (`proposal-screen-in`,
`proposal-screen-out`). The manage page has Code challenge and Team scenario tabs, or a Challenge
tab, listing the proponents in the stage with their scores.

## Departures from the stories

- The design keeps each stage's score button from closing onward and lets the service refuse a
  press at the wrong stage (DESIGN.md, "The stage tabs' buttons are always present"). R-2.28 v2 and
  the surface's `offered_score_actions` say the page does not offer a score for a stage the
  opportunity has not reached and says instead that the proposal "can be scored once" it does. The
  page follows the criterion: the button is absent and the tab says so. `proposal-wrong-stage-error`
  is still drawn if the service refuses a score at the wrong stage (a page left open while the stage
  moves on).
- The rank on the read-only proposal page reads as a place, "1st", "2nd", as the surface describes,
  with how many are ranked said beneath; the stories show "1 of 3". The vendor's Scoresheet tab on the
  manage page keeps "1 of 2".
- The Team questions and Resource questions tabs list each response beside its question but not each
  question's agreed score, which the proposal's answer does not carry; the questions' total is in
  the Scores section.

## What would reverse it

- If the oracle's general permission message differs, it is `NOT_PERMITTED` in
  `rules/team-evaluation.ts`.
- If price scores should count every proposal still in contention rather than those scored at the
  final stage, that is the filter in `TeamProposalsService.settleFinalStage`.
