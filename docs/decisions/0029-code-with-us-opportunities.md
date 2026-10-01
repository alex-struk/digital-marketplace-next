# 0029 · How a Code With Us opportunity is kept, answered with and changed

- Status: accepted for the build (slice 7)
- Date: 2026-09-30

## Decision

**The states, for all three programs.** `app/backend/src/rules/opportunities.ts` holds the states
each program's opportunities may be in and the one table of permitted changes between them
(R-1.19, R-1.20, R-1.49), shared by the service and the screens. Migration
`20260930000006_opportunity_states_and_attachments` adds a check to each program's history table
(`cwuOpportunityStatuses`, `swuOpportunityStatuses`, `twuOpportunityStatuses`) so the store accepts
only those states, or none on a row that records an event. "Suspended" is not among them (R-1.51):
the same migration rewrites any stored `SUSPENDED` row to `CANCELED` before adding the check.
Cancelled is the one final state an opportunity that stopped taking proposals and was never
awarded can be in; nothing in the old application moved a suspended opportunity anywhere else
that the rebuild could reconstruct.

**Versions and attachments.** Every save writes a new `cwuOpportunityVersions` row and an `EDITED`
row in the history (R-1.4). The migration also creates `cwuOpportunityAttachments`
(version, file), the old application's table, so each version carries the files it was saved with
and the current version's are the opportunity's. A file attached to a Code With Us opportunity is
readable through it — by anyone once the opportunity is published, and before then by its creator
and administrators (R-8.25) — through a read path the file store asks on every read
(`CwuAttachmentReadPath`). The attachment control uploads with an empty read-access list (R-8.19).

**What the service answers with.** `GET`, `POST`, `PUT` and `DELETE` on
`/api/opportunities/code-with-us[/{id}]` answer with the opportunity flattened over its current
version: `id`, `program`, `createdAt`, `updatedAt`, `status`, `publishedAt` (the first publication,
R-1.23), every content field, `attachments` (file records) and `addenda` (empty until slice 9).
Dates are calendar days, `YYYY-MM-DD`; the store keeps each as 4:00 p.m. Pacific time on that day
(R-1.14). `createdBy` and `updatedBy` (`{ id, name }`, the creator and the author of the current
version) are present only for an administrator and those two people (R-1.29); `history` only for
the author and administrators.

**What it takes.** `POST` takes the content and a `status` of `DRAFT` (the default),
`UNDER_REVIEW` or `PUBLISHED`. `PUT` takes one tagged change: `edit` with the content as its value,
`submitForReview` or `publish`. An `edit` keeps whatever its value leaves out, so a request naming
only `attachments` saves the rest as it stands (surface `file-attach-by-identifier`); an attachment
may be named by its identifier or by a file record carrying one. `cancel`, `addAddendum` and
`addNote` are the contract's and are answered "not available" until slice 9 builds them.

**Refusals**, in decision record 0010's shape: 401 when the person may not do it (creating as a
vendor or visitor, publishing as anyone but an administrator, changing a published opportunity as
its author, deleting outside R-1.53's rule); 404 for an opportunity the person may not read, the
same answer as for one that does not exist (R-1.2); 400 for content, each problem a line beginning
with the field's name in the request (`title: Enter a title.`, R-1.10), for a change of state the
path does not permit, for an attachment the person may not read (R-8.22), and for an incomplete
draft put forward, which says only that it is incomplete (R-1.21). Submitting for review and
publishing both check the whole of R-1.10 to R-1.14 against the stored draft.

**Notices.** Submitting for review tells every active administrator and confirms to the author
(R-1.37); publishing tells every active account whose new-opportunity notices are on and confirms
to the author (R-1.34). A message to many goes in batches of at most `MAILER_BATCH_SIZE` (50 when
unset) blind copies, visibly addressed to the service (R-6.8, R-6.15). Recipients are looked up and
messages handed to the mailer after the answer, so nothing about delivery reaches the person
(R-6.2).

**Two departures from the stories.**

- The four date fields are the design system's `TextField` with `type="date"` — the browser's own
  date input, with the field's label, description and error — rather than `DatePicker`. A day is
  then one value, typed or chosen, written and read back as `YYYY-MM-DD`, which is how the surface
  states the input and how the Opportunity tab's dates are read (gap 25 notes the stories could not
  show a `DatePicker` value at all).
- The Opportunity tab of the manage page is the form itself: editable for whoever may change the
  opportunity, with Save changes and Cancel, and read-only for its author once it is published.
  "Edit" opens that tab. The surface reads the opportunity's dates "in its form" there, and reaches
  the attachment control at that address without naming a step that opens it.

## What this does not decide

- Watching, the proposal link, cancelling, addenda, private notes, the reporting counts and the
  Proposals tab are other slices' (8, 9, 14). The stories' `opportunity-watch-toggle`,
  `opportunity-start-proposal`, `opportunity-cancel-button`, `reporting-*` and
  `opportunity-tab-proposals` are left for them, and the Addenda tab and section show that none has
  been added.
- Sprint With Us and Team With Us opportunities (slice 10) reuse the state table, the checks on
  their history tables and the attachment control, and add their own attachment tables and read
  paths.

## What would reverse it

A recovered rule for where a suspended opportunity should land, or a ruling that the date fields
must be `DatePicker`; neither changes the service's answers.
