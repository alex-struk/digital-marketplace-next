---
stage: "contract"
title: "contract"
at: "2026-09-07T11:47:33.463Z"
cost: 0.469701
turns: 7
session: ""
---

(resumed; agent output unavailable)

## Fix turn

**Journal addition.** The persona `public-sector-staff-other` had `session-route: null` on its `sign_in` map, which the post-check read as a missing sign-in method for an identity the project configures. `null` on a whole `sign_in` is the deliberate "there is nothing to sign in with" marker for a role like the anonymous visitor; it is the wrong shape for a role the oracle genuinely cannot host a session for. That persona's entry now carries `session-route: { unavailable: … }`, with the reason stated in full: the old application exposes exactly three non-production sign-in routes, the two public-sector ones each mint a session for one fixed account, and neither takes a parameter that would reach a second non-administrator public-sector account — so the account can be seeded and observed on the oracle, but never acted as. `bind-adapter` will therefore throw from `signIn` for that identity and any criterion needing this persona reports as `unbound` on the oracle rather than as a failure. Its `sandbox-idp` entry (`username: gov-second`) is unchanged, so the persona still signs in normally on the rebuilt target. Nothing else in the contract was touched.