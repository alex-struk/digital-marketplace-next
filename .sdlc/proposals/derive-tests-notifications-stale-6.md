---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I wrote tests for both criteria this run was handed back, R-6.1 and R-6.24, and removed both of their entries from `tests/acceptance/not-testable.yaml`."
opened: 2026-09-28T05:57:54.318Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I wrote tests for both criteria this run was handed back, R-6.1 and R-6.24, and removed both of their entries from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I wrote tests for both criteria this run was handed back, R-6.1 and R-6.24, and removed both of their entries from `tests/acceptance/not-testable.yaml`. Neither was left untestable. I did not run the tests or type-check them: this workspace has no installed packages and no target to run against.

**R-6.1** (`tests/acceptance/notifications/R-6.1.spec.ts`). The contract now names a way to start the service with notifications switched off, selected by `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1`. Its notes say the harness passes that same variable to the test process, and that a test should skip, not fail, when it is missing. The test does exactly that: without the variable it is skipped, so on the ordinary shared oracle it reports as skipped, not passed. It needs a separate instance started with notifications off.

With the variable set, the test signs in as the administrator and does two things that send mail under the normal setup:
- It publishes a Code With Us opportunity, then checks there is no field error, the new opportunity's identifier shows up, and its view reads as published.
- It announces changed terms and checks that success is reported and no failure is.

It then waits ten seconds and requires the mail catcher's message count to be zero. The criterion's own "when" names publishing as its example; the terms announcement is a second action that sends mail, so "nothing sends" is tested on more than one route. Both actions sit in one test because the criterion has a single given/when/then. Covering those two actions is how I read "nothing the service does", so I did not add an entry for the actions the test does not take.

**R-6.24** (`tests/acceptance/notifications/R-6.24.spec.ts`). This uses the new `mailDeliveryDelay` page:
1. **Before:** it confirms that the vendor persona (the seed's `vendorOne`) has a standing acceptance and no warning, and that the catcher is empty.
2. **Slow delivery:** as the administrator, it slows delivery and checks `deliverySlowed`. Then it confirms the announcement, reads `notifyVendorsSuccess` within five seconds, and requires the catcher's message count to still be zero at that moment. The contract says nothing can reach the catcher sooner than nine seconds under the delay.
3. **Restore:** delivery speed is restored in a `finally` block, whether the test passes or fails.
4. **After:** it checks that the vendor's message does arrive (it was sent in the background, not dropped). It reopens the broadcast page and checks it shows no failure. Signed in as the vendor, it checks their own legal settings now show the changed-terms warning.

The "nothing later tells them whether every message was sent" part is checked only through the page's failure observation, which is the only report the surface offers there. The time limits (five seconds for success, thirty for arrival) are my own choices and have not been checked against a live target.

No surface action or observation was missing for either criterion. What R-6.1 depends on outside the contract is the harness: whatever starts the notifications-off instance must also pass `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1` to the test run. Otherwise R-6.1 will always skip. Nothing asked me to change a read-only path, and I did not touch one.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: do the R-6.1 and R-6.24 tests follow from their criteria and nothing else? Approve. R-6.1 uses the contract's notifications_disabled configuration and skips without it, as observables.yaml tells it to. It takes two actions that ordinarily send mail (publishing an opportunity, the criterion's own example, and announcing changed terms), asserts each reports success, then asserts the catcher holds nothing, so both halves of the then are covered. R-6.24 uses the contract's mail-delivery-delay, under which nothing can arrive for nine seconds, so success read within five seconds with an empty catcher asserts the ordering without a race. The confirmation dialog survives the delay calls because surface.yaml marks those pages origin: mail-catcher. Withdrawn acceptance (from the criterion's summary), eventual arrival (background sending) and no later failure report (the only reading the surface offers) each follow from the criterion. The delay is lifted in a finally, as the contract requires. No selectors, routes or status codes leak. The runner's type check shows no diagnostics under acceptance/notifications; the failure is two diagnostics in adapters/new. Both owed missing tests stay open until a result row shows the tests ran, and R-6.1 will skip until a harness starts a notifications-off instance and exports the variable. A run showing R-6.24's success appearing only after messages reached the catcher, or evidence that the catcher-served controls navigate the browser, would change this ruling.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8d4a053a9dc9865dafd211f53c1543f46e8422cb`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
