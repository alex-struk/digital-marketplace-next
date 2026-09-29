---
gate: G3
question: "Do the revised notifications tests now follow from their criteria and from nothing else?"
recommendation: "I made no changes."
opened: 2026-09-29T00:25:47.216Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised notifications tests now follow from their criteria and from nothing else?

**Recommendation.** I made no changes.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes. `tests/acceptance/notifications/`, `tests/acceptance/not-testable.yaml` and `tests/generated` are all exactly as I found them, including the "derived" date in the R-6.1 header.

**Why nothing changed.** The ruling recorded no conditions of its own. Its rationale gave one reason for returning the proposal: the R-6.1 test contradicted the contract. At the time, the `configurations.notifications_disabled.notes` entry in `spec/contract/observables.yaml` told an R-6.1 test to read `SDLC_ORACLE_DISABLE_NOTIFICATIONS` and to skip when that setting was missing. It also didn't say how the test would be picked out to run against its own instance. The rationale said the ruling becomes an approval once the contract states both of those things and a re-derivation agrees, "possibly this same test unchanged".

**The contract now says both.** The workspace's `observables.yaml` has been rewritten:
- An R-6.1 test assumes an instance started with notifications switched off. It doesn't skip itself on any signal from the environment, and it fails on an instance where notifications are on.
- The test carries the tag `@notifications_disabled`. It runs only against a separate instance started with `SDLC_ORACLE_DISABLE_NOTIFICATIONS=1`, selected with `--grep @notifications_disabled`. The default run leaves it out with `--grep-invert @notifications_disabled`, so it never clears or fills the shared mail catcher.

**The test already matches.** I checked `R-6.1.spec.ts` against that note. It has no skip and doesn't look at the environment. It carries `{ tag: "@notifications_disabled" }`, which is exactly the tag the contract names. Its comments say what the note says. It still uses the action the contract names for this configuration: an administrator publishes a Code With Us opportunity through `opportunityCwuCreate.publish`. It checks that the publish succeeded (no field error, an identifier assigned, the opportunity showing as published). It then waits a margin and checks that `caughtMessageList.messageCount()` is zero. Since the test already agrees with the rewritten contract, rewriting it would only have churned the header date. This re-derivation is that agreement, with the file left as it was.

**The condition addressed to the contract stage.** That was the rewrite of the notes above, and I did not touch it, as instructed. The contract file in this workspace already reads the way that condition asks, though I can't tell from here whether that comes from the contract stage's own delivery.

No criterion in this domain changed status, and I found no new surface action or observation missing for R-6.1. The remaining open items in `not-testable.yaml` (R-6.11 and R-6.12, among others) are unchanged.
