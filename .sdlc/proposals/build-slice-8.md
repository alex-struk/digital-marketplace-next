---
gate: G3
question: "Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?"
recommendation: "I built Slice 8 and all ten of its criteria."
opened: 2026-10-01T12:28:59.442Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 8 (Anyone can find opportunities and follow the ones they care about) do what its criteria say?

**Recommendation.** I built Slice 8 and all ten of its criteria.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built Slice 8 and all ten of its criteria. `npm --prefix app run check` passes: both workspaces typecheck and all 671 unit tests pass, 27 of them new. The frontend and backend production builds also succeed. Docker commands needed approval this session didn't have, so I did not bring up the compose stack. The schema is covered instead by in-process PostgreSQL tests that apply the real migrations and the acceptance seed.

**Criteria and where they live**

- **R-1.2 and R-1.3 (who sees what).** The new list at `/opportunities` reads all three programs. Code With Us already had the right read rules from Slice 7. I added read-only lists for Sprint With Us and Team With Us that apply the same rules: published ones to anyone, unpublished ones only to their author and administrators. The end-to-end test checks this against the seeded draft of a second staff member.
- **R-1.38 (grouping and order).** The list groups opportunities into unpublished, open and closed. Open means published with 4:00 p.m. Pacific on the deadline day still to come. Open is ordered by nearest deadline, closed by most recently closed, unpublished by most recently changed. The unpublished group only appears when the person has something in it.
- **R-1.39 (filters and search).** Program, status, remote-only and search all apply at once. The status filter offers draft, under review, published, evaluation and awarded, with the first two shown only to staff. These rules are in `app/backend/src/rules/opportunity-list.ts`, which the screen and the service share.
- **R-1.5 (watching).** `/api/subscribers/<program>` works for all three programs. A visitor gets a 401. An opportunity the person can't read, their own opportunity ("You cannot subscribe to your own opportunity."), a second watch, and unwatching something not watched each get a 400. The delete takes the opportunity's identifier. Answers now carry `subscribed`. Watch appears on list cards and on the Code With Us page for anyone signed in who didn't create the opportunity.
- **R-1.6 (view counting).** The Code With Us page sends one `PUT /api/counters/opportunity.code-with-us.<id>.views` each time it is opened. `GET /api/counters?counters=<name>` returns `{ name: count }` and also supports `.watchers`.
- **R-6.20, R-6.21, R-6.27 (new-opportunity emails).** A signed-in person sees the email control once, between the filters and the first group, with nothing hiding it at any width. It saves immediately in either direction with no confirmation, then offers the opposite choice. New accounts already started with emails off from Slice 2, and Slice 7's announcement only goes to accounts that asked, so a new account gets nothing until it presses this.
- **R-4.22 (where sign-in lands).** Slice 2 had already built this. The landing page it points to, the dashboard, now lists all three programs' opportunities with links to their manage pages.
- **Home page.** "Browse opportunities" leads to the list. I also wired the two awarded figures the story carries to a new `/api/metrics` endpoint.

**Schema.** A new migration adds the three programs' watcher tables (one row per person per opportunity, so nobody can watch twice) and `viewCounters`, matching the old application's table names. I re-pulled the Prisma schema from a migrated database rather than editing it by hand.

**Tests.** On the backend, unit tests cover the grouping, filtering, watch and counter-name rules, and an end-to-end test runs the HTTP routes over the migrated, seeded schema. On the frontend, tests cover the list, filters, both kinds of Watch, the email control, view counting on the page, the home figures, and an accessibility check. I updated one Slice 7 dashboard test because it served the Code With Us list at every address.

**Choices made without a rule in the spec** (recorded in `docs/decisions/0034`):
- **Who can read counters.** Anyone can, because the criteria never require a refusal. If the old service limited them to staff, this should become a 401.
- **Watch refusals.** Duplicate watches get 400 rather than 409, because the contract lists no 409.
- **Several counters at once.** Ask for them by repeating the parameter or with an encoded comma. The contract's validator refuses a bare comma.

**What the next slice will find missing**
- Sprint With Us and Team With Us view and manage pages are Slice 10's, so links to them from the list and dashboard show the not-found screen for now.
- Emailing watchers when an addendum is added or an opportunity is cancelled, and the views/watchers/proposals figures on the manage page, are Slice 9's. They can read the watcher tables and counters added here.
- Nothing in this slice needed changing outside `app/` and `docs/decisions/`.
