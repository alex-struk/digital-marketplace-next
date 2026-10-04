# 0060 · Opportunities closing at their deadline, and a Code With Us proposal scored and awarded (slice 16)

- Status: accepted for the build (slice 16)
- Date: 2026-10-04

## Context

Slice 16 builds the deadline hook that decision record 0005 describes, in all three programs (R-1.1,
R-1.24, R-2.5, R-5.20), and the evaluation of a Code With Us proposal once its opportunity has
closed: one score, disqualification with a reason, the automatic move to processing, the award, the
winner on the public view, and the vendor's own score and rank after the decision (R-1.25, R-1.26,
R-1.27, R-2.26, R-2.27, R-2.32 to R-2.35). It also sends the proposal notices (R-2.36, R-6.25). The
contract names the tags `score`, `disqualify` and `award` on `PUT /api/proposals/code-with-us/{id}`
and says nothing about their values or answers. These are the choices made.

## Decisions

**The hook.** `DeadlineClosing` (`backend/src/closing/`) runs in front of every request under `/api`
and `/status`, before the boundary validator. Each program has its own throttle: a run starts at
most once per `DEADLINE_HOOK_INTERVAL_MS` (once a minute when unset, as R-1.1's note describes; `0`
in the compose sandbox, so the first request after a deadline closes the opportunity). A request
that arrives while a run is under way waits for that run instead of starting another, and every
request waits for the run it started or joined, so a caller who triggers and then reads sees the
closure. A failure is logged and the request goes on. Each opportunity closes in its own
transaction, holding its row with `FOR UPDATE` and checking again that it is still published and
lapsed, so two runs or two replicas close it once. "Lapsed" is the rule the rest of the service
uses: 4:00 p.m. Pacific time on the deadline's day (`deadlineHasPassed`).

**What closing records.** The opportunity moves to its program's first evaluation stage
(`EVALUATION`, or `EVAL_QUESTIONS_INDIVIDUAL`) with the note "This opportunity has closed.", and
each proposal whose state is `SUBMITTED` moves to `UNDER_REVIEW` (Code With Us) or
`UNDER_REVIEW_QUESTIONS` with the note "The opportunity closed.". Both rows have no author, which the
history tables show as "System". In Sprint With Us and Team With Us the proposals are named
"Proponent 1", "Proponent 2" and so on in the order they were made (R-2.5 says the order is not
meaningful); Code With Us proposals are not renamed. Drafts and withdrawn proposals are left alone.

**Who is told about a closure.** Once the closing change is saved: the author of a Code With Us
opportunity ("Your Code With Us Opportunity is Ready to Be Evaluated"), and the evaluators on the
newest version's panel of a Sprint With Us or Team With Us opportunity, each in a message of their
own addressed to them alone and naming the opportunity's title in its subject, with a chair who does
not evaluate left out (R-5.20). Deactivated accounts are told nothing. (An earlier revision sent the
panel one blind-copied message; nobody was then a visible recipient, and a reader of the mail could
not tell that a given evaluator had been told. A panel is small, so one message each costs nothing
and still shows nobody who else was told — `addressedToEach` in `mail/message.ts`.) Superseded by
decision record 0063: the panel is again told as blind copies of one message visibly addressed to the
service alone, as R-6.15 requires (`blindCopiedToStaff`).

**Scoring, disqualifying and awarding.** An administrator, or the public sector employee who wrote
the opportunity, may do all three (`mayEvaluateProposal`). Anybody else who can read the proposal
is refused with 401; anybody who cannot is answered 404, as before.

- `score` takes a number (or its digits) from 0 to 100 with at most two decimal places; anything
  else is refused `400` with `score: Enter a score between 0 and 100, with no more than two decimal
  places`. It is accepted for a proposal under review or already evaluated while the opportunity is
  in `EVALUATION`. It writes the score, an `EVALUATED` row, and an event row `SCORE_ENTERED` one
  millisecond later whose note is `A score of "87%" was entered.`, so the history, newest first,
  reads "Score entered: 87%" above "Evaluated" as the history story shows.
- `disqualify` takes the reason as its value, 1 to 5,000 characters once trimmed; without one it is
  refused with `disqualificationReason: Enter a reason for disqualifying this proposal`. It is
  accepted from under review, evaluated, awarded or not awarded while the opportunity is in
  evaluation, processing or awarded, and the reason is the `DISQUALIFIED` row's note.
- After a score or a disqualification, an opportunity in `EVALUATION` whose proposals in contention
  (submitted, under review, evaluated) are all evaluated, and which has at least one, moves to
  `PROCESSING` with the note "Automatically moved to Processing as all proposals have been
  evaluated.", by nobody.
- `award` is accepted for an evaluated or not-awarded proposal while the opportunity is in evaluation
  or processing. As one change, the proposal becomes `AWARDED`, every other proposal in contention
  `NOT_AWARDED`, and the opportunity `AWARDED`; disqualified, withdrawn and draft proposals keep
  their state.

**Rank.** Every answer that carries a score also carries `rank: { rank, of }`: the place among the
opportunity's evaluated, awarded and not-awarded proposals that have a score, highest first, equal
scores sharing a place. Staff always see score and rank; a vendor only once the proposal is awarded
or not awarded (R-2.32), on both the manage page and the read-only page.

**The winner on the public view.** An awarded Code With Us opportunity's answer carries
`successfulProponent: { name }` to everybody, and `{ name, email, phone, score }` to an
administrator or its author (R-1.27). The name is the winning organization's legal name or the
individual's; the contact details are the organization's contact address and phone, or the
individual's. Sprint With Us and Team With Us opportunities carry the same name and contact
details, but no score: their score is the weighted total that slice 19's challenge stages produce.

**Sprint With Us and Team With Us, as far as this slice's criteria reach.** The seed puts R-1.26's
and R-2.32's starting points in Sprint With Us too (`swuProcessingB`, `swuProcessingA`), so:

- `award` on `PUT /api/proposals/{sprint,team}-with-us/{id}` is accepted, from an administrator or
  the opportunity's author, for a proposal at the last evaluated stage (`EVALUATED_TEAM_SCENARIO`,
  `EVALUATED_CHALLENGE`) or not awarded, while the opportunity is at its last stage or in
  processing. Every other proposal still in contention — anything not a draft, withdrawn,
  disqualified or already decided, including one left behind at the questions — becomes not
  awarded, and the same notices go out. The read-only page offers Award, with the same dialog.
- `disqualify` is accepted there too, with the same reason rule, from any review or evaluated
  stage or a decision (R-2.34). Whether the opportunity then moves on belongs to each stage, and is
  left to the slice that builds the stages.
- The answer carries `scoresheet: { questions, challenge, scenario, price, total, rank }`, computed
  from what is stored and never written: the questions as the chair's consensus out of the
  questions' total, each stage's stored score, the total weighed in the opportunity's proportions
  once every stage is scored (two decimals), and the rank among the totals of proposals not
  withdrawn or disqualified. Staff always get it; a vendor once decided, when the manage page shows
  a Scoresheet tab with the anonymous name evaluators saw (R-2.5), each score, the total
  (`proposal-total-score`) and the rank (`proposal-rank`). Staff read the same scoresheet on the
  read-only proposal page (proposal-swu-view, proposal-twu-view) in a Scores section: each stage's
  score, the total labelled "Total score" (`proposal-total-score`, "Not yet calculated" until every
  stage is scored) and the rank once there is one, as the catalogue's evaluated story lays it out.
  Entering the stage scores and the price score's formula are the later slice's (R-2.28 to R-2.31).

**Proposal notices (R-2.36),** composed after the change is saved, in every program: a confirmation
to the vendor who submits (on submission and on creation as a submission), a withdrawal notice to
the vendor and to every active administrator, each administrator in a message of their own addressed
to them alone (as for the panel above), and on award an award notice to the
winning proposal's author and a decision notice to the author of each proposal marked not awarded.
The decision notice (R-6.25) is titled with the opportunity's title, opens with "Awarded to:" and the
winner's legal name (an em dash when there is none), and its action signs the reader in and returns
them to their own proposal, where the score and rank are now shown.

**`/status` as a page.** The surface names `service-status-page` and `service-status-message` on
`/status`, and the catalogue draws it as a page in the page container. The web server gives a
browser's page request (one that accepts `text/html`) the single-page app, whose screen asks the
service's `/status` itself and so runs the hook; every other request to `/status` still goes to the
service, which answers `OK` as before.

## Departures from the stories

- The read-only proposal page offers Award on a proposal that has been passed over (not awarded), as
  well as on an evaluated one, because R-2.33's note allows both.
- After a change on the read-only page, a short status line says what was done ("The score has been
  entered."). The stories show only the page as it stands afterwards.

## What would reverse it

- An amendment letting closure happen at the deadline itself would replace the hook with a CronJob
  calling `/status`.
- Slice 19 builds the stage scores, price scores and ranking. If its weighted total differs from
  `teamScoresheet` in `backend/src/rules/proposal-evaluation.ts`, that function is the one place to
  change, and `successfulProponent` for those programs can then carry the winner's total as `score`.

## Test workers

The backend's Vitest run now uses half the machine's cores (`maxWorkers: "50%"`). With one worker
per core, the end-to-end files — each running PostgreSQL in process — starved one another, and an
untouched file's setup or a query would time out in about half the full runs. Capped, the suite
passed every time and took about thirteen seconds.
