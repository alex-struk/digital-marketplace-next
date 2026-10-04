---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I closed the ruling on R-2.5 by changing who the panel-evaluator persona signs in as on the new target."
opened: 2026-10-04T12:31:31.512Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I closed the ruling on R-2.5 by changing who the panel-evaluator persona signs in as on the new target.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I closed the ruling on R-2.5 by changing who the panel-evaluator persona signs in as on the new target. It now signs in as the staff account that is already an evaluator on the closed Sprint With Us panel. I added no one to the panel. I could not bring the oracle up to confirm anything, because every attempt to run the pipeline CLI was refused.

**What the ruling found.** On the new target, the R-2.5 test signs in as the panel-evaluator persona. That persona used the dedicated account `users.staffPanelEvaluator` (`…0104`). No seeded panel includes that account, so the evaluation list for `opportunities.closedSprintWithUs` correctly answered "Page not found".

**Why I remapped the persona instead of seating the account.** The ruling offered both, but seating the account cannot be done without breaking R-5.27:
- The panel in `tests/seed/006-swu-evaluation.sql` has two evaluators: the government staff account (`users.staffOne`, also the opportunity's owner) and the administrator (also the chair).
- R-5.27's test scores and submits as exactly those two. Consensus starts only once every evaluator has submitted, which is how the test reaches twenty-four scores.
- Adding the dedicated account as a third evaluator would raise the count, and consensus would never start in that test.
- Swapping it in for the staff account would remove the evaluator R-5.27 signs in as.

The staff account is the evaluator who is not the chair on every seeded panel. It is also who the persona already signs in as on the oracle, so both targets now act through the same account and no other test's panel changes.

**What I changed.**
- **`spec/contract/personas.yaml`:** the `evaluation-panel-evaluator` persona's `sandbox-idp` username is now `test-gov` (it was `gov-panel-evaluator`). The comment above the evaluation personas now says why. The persona's `session-route` sign-in on the oracle is unchanged.
- **`tests/seed/manifest.yaml`:** the notes on `users.staffOne` and `users.staffPanelEvaluator` now say the persona signs in as the staff account on both targets, and that the dedicated account sits on no panel and why.
- Nothing else changed: no SQL seed file, no other persona, no page in `surface.yaml`, nothing in `openapi.yaml` or `observables.yaml`, and not the oracle's Compose override.

**What I could not do.**
- **Oracle start-up.** I could not run `node $SDLC_BIN oracle up`. Neither that command nor `printenv SDLC_BIN` was allowed to run, so I did not prove the oracle starts this run. Since nothing came up, there was nothing to take down. The seed and override are unchanged, and the oracle's sign-in for this persona is the same route as before, so this run did not change what the oracle runs on.
- **YAML parse check.** I could not run a parser over the two edited files either; I checked the edited lines by reading them.

**One loose end for whoever runs tests on the new target.** `users.staffPanelEvaluator` still has `persona: evaluation-panel-evaluator` in the manifest. I left that alone because the ruling asked for no more. The new target's adapter (`personOf` in `tests/adapters/new/index.ts`) can match a person argument by that field. A test that passes the persona's name as a person — for example to add someone to a panel — would get the unseated account, not the one that signs in. No current test does this, as far as I found.

Two consequences of sharing the account:
- On both targets, the persona is the same person as the staff persona and the opportunity's owner. A criterion that needs an evaluator who is neither the owner nor ordinary staff cannot be told apart from them.
- The dedicated account stays seeded and can be observed, but no persona signs in as it.
