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

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does the rewritten R-6.1 test follow from the criterion and nothing else? On its own terms, yes. It takes a service with notifications off as its given. For the when, it publishes a Code With Us opportunity, which is the criterion's own example ('such as publishing an opportunity') and the action the contract names, so it stands in for 'every action'. For the then, it checks that the action completed and reported success (no field error, an identifier assigned, the opportunity showing as published) and that no message reached the catcher after a margin. No detail of the implementation leaks in, and the typecheck on the branch found nothing in acceptance/notifications/. I am returning it because the test now contradicts the approved contract, and an approval cannot carry the request that fixes that. spec/contract/observables.yaml configurations.notifications_disabled.notes still tells an R-6.1 test to read SDLC_ORACLE_DISABLE_NOTIFICATIONS and to treat an instance without it as not offering the given, not as a failure. That is the behaviour the calibrate-old-11 ruling rejected. The note also says nothing of how a test that fails rather than skips gets picked out for the separate instance the contract says R-6.1 needs. Approved as it stands, the test would run on the default, shared instance at every calibration. There it clears the catcher and sends a batch of announcements the note says must never share an instance with the rest of the suite, and it fails each time for a known reason. The ruling changes to an approval once the contract states how the notifications-off configuration reaches this test and how the test is selected for it, and a re-derivation (possibly this same test unchanged) agrees with that statement.

**Conditions:**
- addressed-to contract: spec/contract/observables.yaml configurations.notifications_disabled.notes tells a test for R-6.1 to read SDLC_ORACLE_DISABLE_NOTIFICATIONS and to skip on an instance without it. The calibrate-old-11 ruling overturned that behaviour (the skipping test never produced a result), and the R-6.1 test on this branch no longer skips. Rewrite the note so it says a test for R-6.1 assumes an instance started with notifications switched off and does not skip itself. Also state how that test is selected to run against the separate instance the note requires (for example by a tag named after the configuration, such as @notifications_disabled) and kept out of the default run, whose shared mail catcher it would clear and fill.

### Runner-owned typecheck evidence

Proposal revision: `eaacbc5cea3a961c8dc7771ebd5bbbaa4ed03cdd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
