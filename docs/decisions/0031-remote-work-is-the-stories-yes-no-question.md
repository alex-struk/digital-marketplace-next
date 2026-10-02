# 0031 · Remote work is the stories' Yes / No question, starting on No

- Status: superseded by 0042 for where the question starts (it now starts unanswered); the rest
  stands. Replaces the first part of 0030
- Date: 2026-10-01

## Decision

The Code With Us form (create page and the manage page's Opportunity tab) asks
"Is remote work acceptable?" as the stories draw it: a `RadioGroup` of Yes and No, with the
`opportunity-remote-field` test id and the id `opp-remote` on the group. Decision record 0030 had
replaced it with one "Remote OK" checkbox; the acceptance suite fills the form by the stories'
question, found no such choice, and so could not save a draft, submit, publish or attach a file
at all (R-1.9, R-1.48, R-1.53, R-8.17, R-8.19, R-8.25 were returned for that reason).

The question starts on **No**, as the Team With Us invalid story draws it (`defaultValue="no"`),
so an opportunity put forward from the form is never refused for leaving it unanswered (R-1.11).
The service still refuses a request that does not say. A problem with it is summarised as
"Remote work: …" (`CWU_FIELD_LABELS.remoteOk`).

The second part of 0030 — Sprint With Us and Team With Us creation applying R-1.48 before
slice 10 — stands.

## What would reverse it

A ruling that the question must start with neither answer chosen, as the Code With Us default
story draws it.
