# 0005 · Deadline-driven transitions run in front of requests, not on a scheduler

- Status: proposed (G2)
- Date: 2026-09-19

## Decision

The rebuilt service has no scheduler, cron job or background worker. The transitions that look
time-driven — a published opportunity closing when its proposal deadline passes, in each of the
three programs — run in a hook placed in front of every route under `/api` and in front of
`/status`, and nowhere else. The hook is throttled by a configured interval (zero in test
environments, so one request is enough) and runs inside the request that triggers it, before the
request's own work, so a caller that triggers and then reads sees the result.

The notifications a closure sends are composed after the closing transaction commits, not from
inside it, and are handed to the same mail path every other notice uses.

## Why

- R-1.1 states the behaviour this way: the opportunity "closes on its own at the next request the
  service handles under /api or /status". A scheduler would be a different behaviour, and the
  acceptance suite has no clock to wait on — `/status` is its only lever (surface.yaml,
  `scheduled-transition-trigger`).
- No worker means no third workload: the footprint stays at the frontend and backend Deployments
  the quickstart scaffolds (0001, 0006). The hook is NestJS middleware bound to `/api/*` and
  `/status` in the backend.
- Sending closure notices after commit rather than inside the transaction is deliberate: the
  observables record that on the oracle these notices silently never arrive, and R-1.1 and R-5.20
  say they must.

## What would reverse it

- An amendment to R-1.1 allowing closure at the deadline itself; a CronJob calling `/status` would
  then be the least-change implementation.
- Multiple replicas contending for the hook. The hook takes a row lock per opportunity so two
  replicas cannot close the same opportunity twice; if that proves insufficient, the transitions
  move to a single-replica CronJob.
