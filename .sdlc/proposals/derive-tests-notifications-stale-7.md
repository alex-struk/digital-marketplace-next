---
gate: G3
question: "Do these tests follow from the notifications criteria and from nothing else?"
recommendation: "I rewrote the test for R-6.1 at `tests/acceptance/notifications/R-6.1.spec.ts`."
opened: 2026-09-28T22:47:55.651Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the notifications criteria and from nothing else?

**Recommendation.** I rewrote the test for R-6.1 at `tests/acceptance/notifications/R-6.1.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for R-6.1 at `tests/acceptance/notifications/R-6.1.spec.ts`. That was the one criterion in scope, so one criterion has a test and none needed a `not-testable.yaml` entry. I could not typecheck or run the test: this session was not allowed to run `tsc`.

**What the ruling found.** The v1 test skipped itself unless the test run set `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1`. The calibration run never set it, so the test never produced a result. That skip was not a guess by the earlier writer. The contract's own `configurations.notifications_disabled` note in `spec/contract/observables.yaml` tells a test for R-6.1 to read that variable and to treat an instance without it as "not offering the criterion's given, rather than as a failure". The ruling contradicts that note. I followed the ruling.

**What the new test does.** It no longer reads any environment signal or skips itself. It assumes it is running against an instance started with notifications off, and says so in its header comment:
- Against a default instance it will fail, because messages arrive in the catcher. That failure is truthful: the given is not met.
- It carries a Playwright tag, `@notifications_disabled`, named after the contract's configuration. A runner can use it to pick this test out for the separate instance the contract says is started for R-6.1 alone, or leave it out of a default run.

The test is one `test()`, because the criterion states one given/when/then. It is titled with the criterion's own words:
1. It clears the mail catcher and signs in as `persona.administrator`.
2. It publishes a Code With Us opportunity through `surface.opportunityCwuCreate.publish()`. The contract names this as the action that shows the configuration is in force.
3. It checks the action completed normally: `fieldError()` is empty, `opportunityCwuEdit.opportunityIdentifier()` returns an identifier, and `opportunityCwuView.status()` shows the opportunity as published.
4. It waits ten seconds, which is longer than a message takes to arrive with notifications on, then asserts `caughtMessageList.messageCount()` is 0.

I also removed the second action the v1 test took, the terms-and-conditions broadcast, to keep the test to what the criterion and the contract's example ask for. The criterion's "every action" is covered by that one representative action, as its own given/when/then does ("such as publishing an opportunity"). I did not add a clause entry for the other actions, because the surface does reach them; they just aren't exercised.

**What the contract should change.** No surface actions or observations were missing. But the harness has no way to start an instance with notifications off and point this test at it. That needs the runner, or whoever next writes the contract, to do two things:
- Start that instance and select this test for it, for example by the `@notifications_disabled` tag.
- Rewrite the note under `configurations.notifications_disabled` in `observables.yaml`, which still tells tests to skip, so it matches the ruling.

Neither is a path this stage owns, so I left both alone.
