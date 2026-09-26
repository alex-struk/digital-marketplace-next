---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I found why calibration against the old application hung, fixed it in the oracle's compose override, and confirmed the oracle now starts and handles load."
opened: 2026-09-26T01:47:53.189Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I found why calibration against the old application hung, fixed it in the oracle's compose override, and confirmed the oracle now starts and handles load.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I found why calibration against the old application hung, fixed it in the oracle's compose override, and confirmed the oracle now starts and handles load. Nothing else in the contract changed: the pages, personas, API description and seed data are as the previous contract round left them.

**Why requests stalled.** The old application closes opportunities whose proposal deadline has passed by running a "hook" before every request to `/api` and `/status`. It normally runs at most once a minute (`UPDATE_HOOK_THROTTLE`, default 60000 ms). The override had set it to zero, so every request started three closing jobs at once, one per program (Code With Us, Sprint With Us, Team With Us). The application doesn't wait for these jobs, and each one has a flaw in the old code. It opens a database transaction that holds one connection, then asks the ten-connection pool for a second one before it finishes. This is `rawTWUOpportunityToTWUOpportunity(connection, …)` and its equivalents in the other two programs, called on the pool rather than on the transaction.

After a reseed, a burst of requests finds the seeded past-deadline opportunities still published. Enough of these jobs then start together to fill the pool, each holding a connection while waiting for another. Every request then waits out the pool's 60-second timeout. That matches everything the operator saw: six idle transactions, four blocked queries, all ten connections taken, and a 503 after 63 seconds.

I reproduced it before changing anything. Forty-two concurrent requests after a reseed gave 503s at 66 seconds and timeouts at 90. The log showed knex's own message: "Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?"

The oracle's first start this run was left over from the calibration, so it didn't pick up my change. `oracle up` does nothing when a previous run's containers are still there. The first burst above therefore ran against the old zero-throttle setting. The first real start of the new override came only after `oracle down`.

**The fix.** The throttle is now two seconds. At zero, the override was allowing a pile-up that production's once-a-minute setting never allows. Two seconds keeps the closing jobs one at a time, as the default does, while a test still sees a closure within seconds. The seeded past-deadline opportunities stay: they are starting conditions the application acts on, not outcomes. No criterion, authentication rule or migration changed.

- `spec/contract/observables.yaml`, under `scheduled_transitions`, previously said closure happens inside the triggering request. That was wrong: it happens after the response. It now tells tests to trigger `/status`, then re-read the opportunity for a few seconds until it shows the new status, and trigger again if it's still open.
- The page note on `scheduled-transition-trigger` in `surface.yaml` and the header comments in seed files 006 and 009 now say two seconds rather than zero.

**Proof it works.** One fresh start ran the migration and loaded all 14 seed files into all four copies. Reading the `opportunities.closedTeamWithUs` record from `tests/seed/manifest.yaml` through the application's own API returned it. After a reseed, the same 42-request burst all answered within 0.18 seconds. The log showed each program's closing job ran exactly once per window: 1 Team With Us, 6 Code With Us and 3 Sprint With Us opportunities moved to evaluation. The Team With Us opportunity carried a single "This opportunity has closed" entry, with no duplicates from overlapping runs. An authenticated proposal list for that opportunity returned 200 in 26 ms. The oracle is down again.

Two things for whoever reads the calibration results:
- **Administrator proposal lists return 401.** `/api/proposals/team-with-us` with no `opportunity` parameter returns 401 to an administrator with a valid session. That is the application's own permission answer; the operator's probe got a 503 at that address only because the pool was already jammed.
- **Run records were appended.** `oracle up`, `down` and `reseed` append lines to `.sdlc/runs/`, which this stage doesn't own. The harness writes them itself.

**What each page and persona uses (unchanged this run).**
- **Pages:** every page carries a `domain:` field, and the status page `/status` is named as the trigger for closures.
- **Anonymous visitor:** `sign_in: null`.
- **Vendors 1 to 11, government staff, administrator and the two evaluation-panel roles:** `session-route` against the old application's test sign-in routes (`/auth/createsessionvendor/N`, `/auth/createsessiongov`, `/auth/createsessionadmin`), and `sandbox-idp` usernames for the new target.
- **Six personas are marked unavailable on the old application:** a second administrator, a second government user, the two first-time users, the vendor with no email and the thirteenth vendor. Its fixed test sign-in routes can't produce these people; each is reachable on the new target through `sandbox-idp`.
- **Seed:** files 000 to 013 hold the installation rows the migrations create, synthetic users and organizations, service pages, and opportunities at each stage of each program. The lapsed ones are seeded as published with a deadline 30 days past and left for the application to close. All of it is named in the manifest.

**Owed items I couldn't supply.** No lines are written for them, so both stay owed by contract.
- **missing-test/R-6.1** needs a copy of the application started with notifications switched off (`DISABLE_NOTIFICATIONS=1`, read once at start-up). A second app service in the override would need a published port. The harness only provides three port variables (app, database, mail), and I can't invent a fourth. It needs a pipeline or config change: a second oracle target, or a harness-provided port for one.
- **missing-test/R-6.24** needs the mail catcher to hold messages so a test can see success reported before any message arrives. Mailpit's fault injection (already enabled) can refuse messages but can't delay them. Refusing them shows success doesn't depend on delivery, but not that it comes first. A delaying relay a test could switch on and off would need its own harness-allocated control port. A fixed delay on all mail would slow every mail test and change timing for all of them.
