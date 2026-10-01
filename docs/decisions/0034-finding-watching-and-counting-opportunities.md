# 0034 · Finding, watching and counting opportunities

- Status: accepted for the build (slice 8)
- Date: 2026-10-01

## Decision

**What is kept.** Migration `20261001000001_watchers_and_view_counts` creates, where absent, the old
application's `cwuOpportunitySubscribers`, `swuOpportunitySubscribers` and
`twuOpportunitySubscribers` (opportunity, user, createdAt; the pair is the key, so nobody watches
one opportunity twice, R-1.5; each row goes with its opportunity or its account) and
`viewCounters` (name, count). Prisma was pulled again from the migrated schema.

**Watching** (R-1.5), the contract's `/api/subscribers/<program>`, in all three programs:

- `POST` takes `{ "opportunity": "<id>" }` and answers 201 with
  `{ "opportunity": { "id" }, "user": { "id" }, "createdAt" }`.
- `DELETE /api/subscribers/<program>/<id>` takes the **opportunity's** identifier — a watch has no
  identifier of its own; the pair is it — and answers 200 in the same shape.
- Refusals, in decision record 0010's shape: 401 for a visitor; 400 for an opportunity the person
  may not read, answered as one that is not there (R-1.2); 400
  `You cannot subscribe to your own opportunity.` for its creator (the wording R-1.5's note
  records); 400 for a second watch and for ending a watch that does not exist. The contract lists
  400, 401 and 503 for these routes and no 409, so the duplicate is a 400.
- Every Code With Us answer, and every Sprint With Us and Team With Us list entry, carries
  `subscribed`: whether the person asking watches it (false for a visitor).

**Counting** (R-1.6), the contract's `/api/counters`:

- A counter is named `opportunity.<program>.<opportunity id>.<kind>` (observables: counters), and
  the kinds are `views` and `watchers` (`subscribers` is read as `watchers`). Any other name is
  refused 400.
- `GET /api/counters?counters=<name>` answers `{ "<name>": <count> }`, one member per name asked
  for. Several names are asked for by repeating the parameter, or as one value separated by commas
  and URL-encoded — the contract's validator refuses a bare comma in a query value. A view count
  never started is 0; the watcher count is the number of watchers held.
- The counts are figures, not records of who did what, so anyone may read them by name. This is
  the one choice here that could have gone the other way: the old application may have kept them
  to staff. Nothing the criteria say turns on the refusal, and a test reading a count after
  opening a page as a visitor would otherwise have nothing to read.
- `PUT /api/counters/<name>` adds one view, for anyone, signed in or not, of an opportunity they
  may read, and answers `{ "<name>": <new count> }`. Only `views` is counted this way. The Code
  With Us public page asks once each time it is opened, however often it reads the opportunity
  again while open.

**Sprint With Us and Team With Us, listed.** `GET /api/opportunities/sprint-with-us` and
`.../team-with-us` answer with every opportunity of the program the person may read (R-1.2,
R-1.3): `id`, `program`, `createdAt`, `updatedAt`, `status`, `publishedAt`, `title`, `teaser`,
`location`, `remoteOk`, `remoteDesc`, `proposalDeadline` (a calendar day, as decision record 0029
dates are), `totalMaxBudget` (Sprint With Us) or `maxBudget` (Team With Us), `subscribed`, and
`createdBy`/`updatedBy` only as R-1.29 allows. That is all slice 10 needs to keep; it adds the rest
of each program's answer.

**What has been awarded.** `GET /api/metrics` answers `[{ "totalCount", "totalAwarded" }]`, as
the old service did: how many opportunities stand awarded in all three programs, and the sum of
each awarded Code With Us reward and each awarded Sprint With Us or Team With Us budget. The home
page shows them (`home-awarded-count`, `home-awarded-value`).

**The list** at `/opportunities` reads all three programs and groups, orders and narrows them in
the browser by `app/backend/src/rules/opportunity-list.ts` (R-1.38, R-1.39):

- An opportunity is open while it is published and 4:00 p.m. Pacific time on its proposal
  deadline is still to come; drafts and those under review are unpublished; everything else is
  closed. Open and Closed are always drawn, with a sentence when empty; Unpublished only when the
  person has something in it, so a vendor or visitor is never shown an empty group of things they
  cannot see.
- The status filter offers draft, under review, published, evaluation and awarded; the first two
  only to public sector staff and administrators, who alone can have one listed. Evaluation covers
  every program's evaluation stages. Search matches the words typed, ignoring case, anywhere in the
  title or the location.
- The new-opportunity email control sits once between the filters and the first group, for every
  signed-in person, with nothing hiding it at any width (R-6.21, R-6.27). Pressing it saves at
  once through the profile's own `updateNotifications` change; the button then offers the opposite
  choice, keeps focus, and the change is announced. A visitor is shown no control.
- Watch is offered on a card, and on the Code With Us page, to anybody signed in who did not create
  the opportunity; the service names the creator only to that person and administrators, which is
  exactly when it can be hidden.

**The dashboard** lists all three programs' opportunities in the same way it listed Code With Us
ones (own for staff, every one for an administrator), each linking to its manage page.

## What this does not decide

- The Sprint With Us and Team With Us public and manage pages are slice 10's. Until then, the
  list's and the dashboard's links to them land on the not-found screen.
- Telling watchers about addenda and cancellation, and the reporting figures (views, watchers,
  proposals) on the manage page, are slice 9's; the counts they read are the ones here.

## What would reverse it

A recovered rule that only staff may read the counters (a 401 for anyone else, as the contract
allows), or a recovered body for any of these answers.
