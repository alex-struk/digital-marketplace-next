# 0037 · Dates in Pacific time, watch refusals by reason, and one page layout

- Status: accepted for the build (slice 8, revision after the ruling that returned it)
- Date: 2026-10-01
- Amends: 0034 (the refusals of `/api/subscribers/<program>`), 0026 (where the service level
  agreement link is offered)

## Decision

**A date is the day it was in Pacific time.** `readDate` in `app/frontend/src/lib/dates.ts`, which
every screen uses to show the day a moment fell on (an opportunity's published date, a page's
published and updated dates, the dashboard's last-changed date, the day an account was
deactivated), reads the moment in `America/Vancouver`, through the same rule
(`pacificClockOf` in `app/backend/src/rules/opportunities.ts`) that already decides deadlines and
"today". Something published at 7:26 p.m. Pacific on October 1 shows as published on October 1,
not on October 2, the UTC day (R-1.23).

`readMoment`, the date and time to the minute that the page-managing screen and the profile's
terms record show, is left as it was, in UTC. The ruling named the day, and a time of day shown in
another zone would move every reading of it, at every hour, not only after 5 p.m. Pacific. A later
ruling that names a moment should move it the same way.

**A watch is refused under the reason the contract names.** `spec/contract/surface.yaml`
(opportunity-watch-request) says the service files a second watch under `conflict`, a watch of
one's own opportunity under `opportunity`, an opportunity the person cannot see under `notFound`,
and a request with no session under `permissions`. `/api/subscribers/<program>` now answers so:
`{ "conflict": ["This user is already subscribed to this opportunity."] }`, and likewise for the
others, 400 except `permissions`, which is 401 — the statuses 0034 chose, because the contract
lists no 409 for these routes. Ending a watch that is not there is `notFound`. Every other route
keeps decision record 0010's single shape, `{ "errors": [...] }`; `NamedRefusal` in
`app/backend/src/common/refusals.ts` is how a route opts out of it, and only watching does.

**The service level agreement link is on every screen R-7.18 names.** Besides the learn-more
screens, the three program cards at `/opportunities/create` and the Code With Us, Sprint With Us
and Team With Us forms carry the same link, `/content/service-level-agreement`, under the same test
ID, `service-level-agreement-link`, as design/DESIGN.md asks.

**One page container, one stack.** The catalogue's `PageContainer` and `Stack`
(`design/catalogue/layout.tsx`) are defined once, in `app/frontend/src/app/page-layout.tsx`. The
root layout puts every screen inside the container, so no screen sets its own width or outer
padding; every screen spaces its parts with `Stack` gaps as its story does. What remains in
`app/frontend/src/app/layout.ts` is drawing, not spacing: a card's border and inner padding, the
status badge, a term's weight.

## What would reverse it

- A ruling that a moment shown to the minute must also be in Pacific time: then `readMoment`
  reads through `pacificClockOf` as `readDate` does.
- A recovered body for the old service's watch refusals that differs from the surface's
  description.
