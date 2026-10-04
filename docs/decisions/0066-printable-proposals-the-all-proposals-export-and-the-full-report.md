# 0066 · Printable proposals, the all-proposals export and the full report (slice 20)

- Status: accepted for the build (slice 20)
- Date: 2026-10-04

## Context

Slice 20 adds three kinds of pages, each in all three programs: the printable copy of one proposal
at `/opportunities/<program>/:opportunityId/proposals/:proposalId/export` (R-2.37), every proposal
of an opportunity in one document at `/opportunities/<program>/:opportunityId/proposals/export`
(R-2.38), and the full report of an opportunity at `/opportunities/<program>/:opportunityId/complete`
(R-1.40). The contract (`spec/contract/openapi.yaml`) has no export or report operation. The old
application built all three in the browser from the ordinary reads. The rules are in
`backend/src/rules/exports.ts`, and the pages are `frontend/src/screens/proposal-export.tsx` and
`frontend/src/screens/opportunity-report.tsx`.

## Decisions

**No new service operation.** Each page uses reads the service already answers, so the service's
existing access rules decide who sees what. The copy of one proposal is
`GET /api/proposals/<program>/:id`. For Sprint With Us and Team With Us the page also reads the
opportunity, to show each question beside its answer. The all-proposals document is
`GET /api/proposals/<program>?opportunity=:id` plus the opportunity. The service answers that list
to the opportunity's author and to administrators only, and only once the opportunity has closed.
The report reads the opportunity, which comes with its addenda and its history for an
administrator, and the same proposal list. When the service refuses or has nothing, the page shows
the shared not-found page, which never says "not allowed".

**Who is refused before anything is asked.** A visitor who has not signed in is shown the not-found
page on all three kinds of page and is not sent to sign in, as the not-found stories say. A vendor
is shown the not-found page on the all-proposals document (`mayExportAllProposals`: GOV or ADMIN). A
non-administrator, the author included, is shown it on the report (`mayReadOpportunityReport`:
ADMIN). In none of these cases does the page ask the service for anything.

**When a staff copy is anonymous.** For Sprint With Us and Team With Us, a staff reader's copy
names the proponent by its anonymous name ("Proponent 1", given at closing) while the proposal is
`SUBMITTED`, `UNDER_REVIEW_QUESTIONS` or `EVALUATED_QUESTIONS`. From the code challenge (or the
challenge) onward it names the organization. Award, non-award and disqualification are treated as
past the questions. A vendor always reads their own organization's name. Code With Us is never
anonymised (R-1.24). Team members' names, references and attachments' names stay in an anonymous
copy, as the anonymous stories keep those sections.

**The all-proposals document's choice.** Proponents are named by default. Ticking "Name
proponents anonymously" (`proposal-export-anonymous-toggle`) puts `?anonymous=true` in the address,
so that document can be reopened or shared as it is. Opening the address with that query opens the
document anonymous. When anonymous, a Sprint With Us or Team With Us proposal goes by its anonymous
name. A Code With Us proposal, which has none, goes by its place counted from one, and its Proponent
section (name, email, address) is replaced by a sentence saying those details are withheld. Drafts
and withdrawn proposals are never included. The order is the same whichever way it is named: by
anonymous name, numerically, then as the service listed them.

**The report.** Its sections follow the stories: the opportunity (status, value, deadline,
published, created by, identifier, phases or resources and weights for the other two programs, and
the description), the addenda, the history as one line per entry, and every proposal with its
status and score (for Sprint With Us and Team With Us, each stage's score and the total). Every
proposal is named by organization or individual, since only an administrator reads the report.
Each proposal's full content follows, using the same content components as the printable copy.
Before the opportunity has closed the service does not list proposals, and the report says they are
listed once it has.

**Printing.** "Print" calls the browser's print. No file is generated.

**The vendor's manage page.** The Sprint With Us and Team With Us manage pages (`proposal-swu-edit`,
`proposal-twu-edit`) now carry the "Printable copy" link (`proposal-export-link`) their stories
draw. The Code With Us manage page and every view page already had it.
