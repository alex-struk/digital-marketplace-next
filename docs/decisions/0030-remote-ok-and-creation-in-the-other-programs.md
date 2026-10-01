# 0030 · Remote work is one "Remote OK" box, and the other programs refuse publication on creation

- Status: accepted for the build (slice 7, revision)
- Date: 2026-10-01

## Decision

**Remote work is one checkbox, "Remote OK: remote work is acceptable".** The Code With Us form
(create page and the manage page's Opportunity tab) asked "Is remote work acceptable?" with a
Yes/No radio group that started with neither chosen. That departs from the stories, which draw a
`RadioGroup`, in two ways:

- The field is named for what it holds, `remoteOk`, so whoever fills the form by its fields'
  names finds it. Its error summary line reads "Remote OK: …" (`CWU_FIELD_LABELS`).
- It starts as *not acceptable*. R-1.11 asks that an opportunity that is not a draft *state*
  whether remote work is acceptable; a box always states it, so an opportunity submitted for
  review or published from the form is never refused for leaving the question blank. This is
  also how the old application's form began (remote work "no" until changed). The service still
  refuses a request that does not say, as R-1.11 asks.

The `opportunity-remote-field` test id is on the checkbox; the summary links to its wrapper,
`#opp-remote`. The remote-work description stays required whenever the box is ticked.

**Sprint With Us and Team With Us creation applies R-1.48 before slice 10.** R-1.48 is assigned
to slice 7 and holds "in all three programs". `POST /api/opportunities/sprint-with-us` and
`/team-with-us` now refuse anyone who is not public sector staff (401), an unknown state (400),
and a published creation by anyone but an administrator (401, "Only an administrator may publish
an opportunity."), in the same words as Code With Us. A permitted creation is answered 501, "not
yet offered", because those opportunities are slice 10's
(`app/backend/src/opportunities/unbuilt-program-creation.controller.ts`).

## What would reverse it

A ruling that the stories' Yes/No radio group must be kept, with the acceptance surface naming
how it is chosen; and slice 10, which replaces the interim controller with the programs' own
create paths and keeps their R-1.48 check.
