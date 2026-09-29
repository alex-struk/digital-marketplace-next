| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T00:25:47.216Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question was whether the revised notifications tests now follow from their criteria and from nothing else. They do, so the proposal is approved. The earlier return turned on one conflict: the R-6.1 test skipped itself unless the SDLC_ORACLE_DISABLE_NOTIFICATIONS environment variable was set, and the contract gave no way to pick that test out for its own instance. The contract's notifications_disabled entry in spec/contract/observables.yaml now says both things. A test for R-6.1 assumes an instance started with notifications off and does not skip on any signal from the environment. It carries the tag @notifications_disabled, runs only with --grep against that separate instance, and is left out of the default run with --grep-invert. R-6.1.spec.ts on this branch matches: it has no skip, reads nothing from the environment, and carries that exact tag. Every assertion follows from the criterion. The action the criterion gives as its example (an administrator publishing a Code With Us opportunity, the action the contract names for this configuration) completes and reports success: no field error, an identifier assigned, and the opportunity shown as published. Then, after a margin, the mail catcher holds zero messages, which is the criterion's 'no message is sent to anybody'. Nothing reaches past the surface and the fixtures. The typecheck exit code is from 2 diagnostics under adapters/new/, which this proposal does not answer for; nothing under acceptance/notifications/ failed. The not-testable.yaml changes only reorder and rewrap entries: the R-6.9, R-6.11 and R-6.12 reasons are word-for-word the same and still name real gaps in the mail fixture (it searches by visible recipient, gives back an untyped To field, and exposes no message body). This would change to a return if the test read the environment again, dropped the tag, or asserted something R-6.1 does not state, such as a specific message wording or a status value beyond published.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `30257a7404404b1bac6c50429c6f6b4731cddbc1`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/notifications/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
