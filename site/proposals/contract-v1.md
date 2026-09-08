| Field | Value |
| --- | --- |
| gate |  |
| opened |  |
| holder |  |

---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "(resumed; agent output unavailable)\n\n## Fix turn\n\n**Journal addition.** The persona `public-sector-staff-other` had `session-route: null` on its `sign_in` map, which the post-check read as a missing s…"
opened: 2026-09-07T11:47:33.476Z
---

# Is this the contract the tests will act through?

**Recommendation.** (resumed; agent output unavailable)

## Fix turn

**Journal addition.** The persona `public-sector-staff-other` had `session-route: null` on its `sign_in` map, which the post-check read as a missing s…

(resumed; agent output unavailable)

## Fix turn

**Journal addition.** The persona `public-sector-staff-other` had `session-route: null` on its `sign_in` map, which the post-check read as a missing sign-in method for an identity the project configures. `null` on a whole `sign_in` is the deliberate "there is nothing to sign in with" marker for a role like the anonymous visitor; it is the wrong shape for a role the oracle genuinely cannot host a session for. That persona's entry now carries `session-route: { unavailable: … }`, with the reason stated in full: the old application exposes exactly three non-production sign-in routes, the two public-sector ones each mint a session for one fixed account, and neither takes a parameter that would reach a second non-administrator public-sector account — so the account can be seeded and observed on the oracle, but never acted as. `bind-adapter` will therefore throw from `signIn` for that identity and any criterion needing this persona reports as `unbound` on the oracle rather than as a failure. Its `sandbox-idp` entry (`username: gov-second`) is unchanged, so the persona still signs in normally on the rebuilt target. Nothing else in the contract was touched.

## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is whether this is the contract the tests will act through, and it is: the recovered surface, personas, observables and seed data are consistent with the old application at b0f0c99, every check passes, and the fix turn's replacement of `session-route: null` with an explicit `unavailable` reason for public-sector-staff-other is the right shape — an identity the oracle cannot host a session for must fail loudly at bind time rather than look like a role with nothing to sign in as. One criterion is reworded rather than left as recovered. R-1.1 says the closure runs `when the service next handles any request`; sources/old/src/back-end/index.ts:184-200 adds the three opportunity hooks to crudRoutes only, after they are namespaced under /api, and :250-260 adds them a second time to the status router, while authRouter, the /admin router and frontEndRouter are concatenated outside that addHooks call and run none of them. The behaviour recovered is right and only the scope of the trigger is wrong, so it is an edit rather than a spike, and the deliberate rewording is the second witness that carries it to confirmed. Three further things are wrong in the contract artifacts rather than in any criterion, so they carry no condition line and are recorded here instead: observables.yaml's scheduled_transitions note that `Any request would do` and openapi.yaml's `as they do in front of every route` in the /status description repeat the same over-generalisation and should be narrowed to /api and /status, with GET /status remaining the named trigger; openapi.yaml's info.description claim that `Every route the application registers appears here exactly once` is not true of the front-end router's GET *path (lib/routers/front-end.ts:38-39) and should name the route families this document covers — API, authentication, admin and status; and .sdlc/journal/034-contract.md carries only the fix turn behind `(resumed; agent output unavailable)`, which leaves P5 unsatisfied, so it should record that the stage output was lost on resume and that this ruling was made by reading spec/contract/ and tests/seed/ directly against b0f0c99. Finally, the oracle's identity limits must reach calibration rather than evaporate: no session exists for public-sector-staff-other, which R-1.3 turns on directly, and evaluation-panel-evaluator and evaluation-panel-chair are folded onto the government and administrator accounts, so a chair who is also an administrator can pass a criterion for the wrong reason. Those criteria must report unbound and be ruled at calibration, not skipped. What would change the ruling to return is evidence that the recovered routes or personas misdescribe the application in a way the seed data cannot compensate for; wording in the artifacts above does not, provided it is corrected before derive-tests runs blind against it.

**Conditions:**
- edit R-1.1: A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and its author is notified that it is ready for evaluation.
