# 0036 · The Sprint With Us and Team With Us create forms are drawn whole, and create in any permitted state

- Status: accepted for the build (slice 8, second revision after the G3 return that named R-1.3,
  R-1.38 and R-1.39); amends 0035 (which offered a draft only, from the shared fields only) and
  the line in 0034 that draws the Unpublished group only when it has something in it
- Date: 2026-10-01

## What happened

The return named three criteria. R-1.39 was unbound at `opportunity-swu-create.save_draft`: the
create screen opened, but the suite could not use Save draft on it. R-1.3 and R-1.38 each read an
opportunity group as empty where they expected an opportunity in it.

The sandbox could not be started from this session, and no browser was available, so none of
this was watched happening. What follows is what the code shows, not what a run confirmed.

- The interim create screens (0035) drew only the fields every program shares. Their stories also
  draw Sprint With Us's skills and phases, Team With Us's resources, the team or resource
  questions, the scoring weights and the evaluation panel. That is fourteen test ids the screens
  did not carry: `opportunity-skills-field`, `phase-start-date-field`, `question-text-field`,
  `score-weight-field`, `evaluation-panel-editor`, `attachment-add-button` and the rest. Their
  date fields also had ids of their own (`opp-proposalDeadline`), not the stories'
  (`opp-deadline`, `opp-assignment`, `opp-start`, `opp-completion`), which the Code With Us form
  already used. Record 0031 shows that the suite fills a form by what its story draws, and cannot
  save when something the story draws is missing.
- The service answered a Sprint With Us or Team With Us opportunity created under review or
  published with 501. The staff story's Unpublished group holds a Sprint With Us opportunity
  under review and a Team With Us draft. An opportunity a check creates that way was never kept,
  so the group it should have appeared in had nothing to show. For a member of staff with nothing
  else unpublished, the group was not drawn at all.

## Decision

**The two create screens draw everything their stories draw** (`opportunity-other-create.tsx`),
with the stories' labels, ids and test ids:

- the shared fields; for Sprint With Us, Skills;
- the key dates;
- the Phases section: an implementation phase always, and inception and prototype phases added
  with `add-phase-button` and removable;
- for Team With Us, the Resources section, one resource to start;
- the team or resource questions, one to start;
- the scoring weights, with a running total in a status region and `score-weight-error` while
  entered weights do not make 100%;
- the evaluation panel editor, with the author as chair and evaluator to start. An administrator
  chooses members from every active public sector account. Anyone else can choose only
  themselves, since only an administrator may list accounts (R-4.21).

Each reason the service gives for a refusal is listed under the test id `field-error`.

Attachments are drawn, but `attachment-add-button` is disabled, with a sentence saying why. The
kept schema has no attachment table for either program, so a file could not be kept with one.

**The service keeps all of it, in any state the person may create it in.**
`POST /api/opportunities/sprint-with-us` and `.../team-with-us` accept the old service's names:

- `mandatorySkills`;
- `inceptionPhase`, `prototypePhase` and `implementationPhase`;
- `teamQuestions` and `resourceQuestions`;
- `resources`, each with a `serviceArea` key and a `targetAllocation`;
- the program's weights;
- `evaluationPanel`.

It writes them to the kept tables: phases, questions, resources and panel members.

- A panel member who is not an active public sector account is left off. A panel naming nobody
  is the author alone, as chair and evaluator.
- A phase's missing dates default from the assignment date. The implementation phase holds
  whatever part of the total budget the other phases do not.
- `UNDER_REVIEW` is accepted from any member of staff. `PUBLISHED` is accepted from an
  administrator only (R-1.48), with the same refusals as before.
- Reading one opportunity answers with this content under the same names.

**What is not decided here.** Whether an opportunity is complete enough to submit or publish is
each program's own rule, and slice 10's (R-1.13, R-1.15 to R-1.18, R-5.x). Until then, what is
sent is kept as it is, and the screen says so. Publishing one of these opportunities sends no
announcement yet: the messages that exist are Code With Us's, and the other programs' messages
come with their slice.

**The Unpublished group is drawn for public sector staff and administrators even when it is
empty**, with its sentence ("There are no unpublished opportunities."), as the staff story draws
the group. Vendors and visitors are still never shown it.

## What would reverse it

Slice 10. It replaces the interim controller, store and screens with the programs' own create
and manage paths and checks, keeping R-1.48's rule, R-1.9's defaults and these test ids.
