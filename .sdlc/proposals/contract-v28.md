---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added the page R-1.5 was missing, but I could not start the oracle from this session, so the new page hasn't been checked against the running old application."
opened: 2026-10-01T13:27:33.332Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added the page R-1.5 was missing, but I could not start the oracle from this session, so the new page hasn't been checked against the running old application.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the page R-1.5 was missing, but I could not start the oracle from this session, so the new page hasn't been checked against the running old application.

**What R-1.5 needed.** The criterion says a second request to watch the same opportunity is refused as a duplicate. The opportunity screens only offer `toggle_watch`, and pressing it again stops the watch, so the screens never send a second watch request. The old code handles a repeated watch in all three programs (`src/back-end/lib/resources/subscribers/{code,sprint,team}-with-us.ts`, lines 52–157):
- A second watch request is refused with a 400. The refusal is filed under `conflict` with the message "This user is already subscribed to this opportunity."
- Watching your own opportunity is filed under `opportunity` with "You cannot subscribe to your own opportunity."
- An unknown opportunity is filed under `notFound`; a request with no session under `permissions`.
- Stopping a watch is addressed by the opportunity's id, not a subscription id.
- Every opportunity read carries a `subscribed` flag for the signed-in person.

A previous run of this stage added the same kind of page, but that run failed its post-checks and nothing of it reached the repository, so I wrote it again.

**What I added.** One page in `spec/contract/surface.yaml`: `opportunity-watch-request` (domain `opportunities`, route `/api/subscribers/:program`). It sits in the existing section for requests the screens never make and follows the shape of the other `*-request` pages there.
- **Actions:**
  - `watch_by_request` always asks to start watching; it never toggles.
  - `stop_watching_by_request` asks to stop.
- **Observations:**
  - `request_accepted`, `refusal_status` and `refusal_messages`.
  - `refusal_reason`, which reads `conflict` for a duplicate.
  - `watching`, read from the opportunity's own `subscribed` flag. This is a separate confirmation that the first request recorded the watch.
- **Starting point:** `opportunities.publishedCodeWithUs`, created by `users.staffOne`, watched as `users.vendorOne`. No seed file inserts any watch, so it starts unwatched. The page tells a test to stop watching when it ends, because I found nothing in the contract saying data goes back to the seed between tests.

**API description fix.** In `spec/contract/openapi.yaml`, I added a description to each of the three stop-watching operations. The old application's own API files call the path parameter a "Subscription id", but the code looks the watch up by opportunity id.

**Unchanged.** Every other page, `personas.yaml`, `observables.yaml`, the seed files and `.sdlc/oracle/compose.yml` are as they were. Nothing was deleted.

**What I could not do.**
- **Oracle:** the permission layer refused every command that reads `$SDLC_BIN`, including `node $SDLC_BIN oracle up` and `printenv SDLC_BIN`. The previous run hit the same refusal. So I never ran `oracle up`, `oracle down` was not needed, and no containers were started. The next run with that permission should confirm three things: as `users.vendorOne`, the first `watch_by_request` is accepted, `watching` then reads true, and the second request returns 400 under `conflict`.
- **YAML check:** a parser run also needed approval. I matched the new entry's indentation and syntax to its neighbours by eye.

**Unrelated failing check.** The previous run's post-check failure was the egress rule E-2 flagging the string "SHA-256" as an internal ticket number. It appears in gate rulings, recorded conditions and proposal pages under `.sdlc/` and `site/`. None of those is in a file this stage may edit, and my changes contain no such string. If the check runs over the whole repository again, it will likely fail again for that reason alone.

re-address missing-test/R-1.5 to derive-tests: added surface page opportunity-watch-request (route /api/subscribers/:program) with action watch_by_request, which always asks to watch and never toggles, plus stop_watching_by_request, and observations request_accepted, watching, refusal_reason (conflict for a duplicate), refusal_messages and refusal_status; opportunities.publishedCodeWithUs as users.vendorOne is a starting point with no watch seeded.
