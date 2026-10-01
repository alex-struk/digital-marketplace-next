# 0035 · Drafts in the other two programs, before slice 10

- Status: accepted for the build (slice 8, revision after the G3 return that named R-1.39);
  replaces the "not yet offered" answer to a permitted draft in 0030, and the line in 0034 that
  the Sprint With Us and Team With Us manage pages land on the not-found screen
- Date: 2026-10-01

## What happened

R-1.39 came back unbound at `opportunity-swu-create.open`. The criterion is about narrowing a list
"across all three programs", and its check builds that list through each program's create screen.
`/opportunities/sprint-with-us/create` answered with the not-found screen, because the Sprint With
Us and Team With Us screens are slice 10's, and the service answered every permitted creation in
those programs 501 (0030).

The surface's input for these screens is the same as Code With Us's: a title and the key dates, all
optional. A Code With Us opportunity cannot be published from those alone, so such a check
saves drafts. That is what this slice now makes possible in the other two programs, and no more.

## Decision

**The service accepts a draft in both programs** (`app/backend/src/rules/other-program-drafts.ts`,
`OtherProgramsService.create`). `POST /api/opportunities/sprint-with-us` and `.../team-with-us`:

- refuse anyone who is not public sector staff (401), an unknown state (400), and a published
  creation by anyone but an administrator (401), as before (R-1.7, R-1.48);
- save a draft (`status` `DRAFT`, or no status) from the fields every program shares: title,
  teaser, location, `remoteOk`, `remoteDesc`, description, `proposalDeadline`,
  `assignmentDate`, the budget (`totalMaxBudget` or `maxBudget`), and for Team With Us
  `startDate` and `completionDate`. As R-1.9 has it for Code With Us, nothing is refused; a date
  that is missing or earlier than the one before it becomes fourteen days from today, a
  completion date that is missing or out of order is left empty, a budget that is not a whole
  number is none. The scoring weights are stored as 0, with no phases, resources, questions or
  panel: those are slice 10's;
- still answer a permitted `UNDER_REVIEW` or `PUBLISHED` creation 501, now saying that only a
  draft can be saved in this version. Without phases or resources, questions, weights and a panel
  such an opportunity could only be incomplete, and inventing defaults for them would let one be
  published that the programs' own rules (slice 10) would refuse.

The answer is the list's shape (0034) plus `description`, `assignmentDate` and, for Team With Us,
`startDate` and `completionDate`. `GET /api/opportunities/<program>/<id>` answers one in the same
shape, to whoever may read it (R-1.2, R-1.3), and 404 to anyone else.

**The create screens** (`opportunity-other-create.tsx`) draw the stories' Overview, Budget,
Description and Key dates sections with the stories' test ids, and the stories' Save draft and
Submit for review (Publish for an administrator, after the publish confirmation). The Phases,
Resources, Team or Resource questions, Scoring weights, Evaluation panel and Attachments sections
are not drawn: their controls would accept nothing. A sentence says the opportunity can only be
saved as a draft for now. A refusal is shown in an alert that takes focus, and what was typed is
kept.

**A saved draft lands on its manage page**, `/opportunities/<program>/<id>/edit`
(`opportunity-other-manage.tsx`): its title, state, `opportunity-identifier`, key facts, and who
created and last changed it as R-1.29 allows. Only its author and administrators reach it (R-1.30);
anyone else is shown the not-found screen. The dashboard's links to these opportunities now land
there too. The tabs and actions of the manage page, and the programs' public pages, stay slice 10's.

## What would reverse it

Slice 10, which replaces the interim controller, store methods and both screens with the programs'
own, keeping R-1.48's check and R-1.9's defaults for drafts.
