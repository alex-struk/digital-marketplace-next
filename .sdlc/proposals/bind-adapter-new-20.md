---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I looked for R-6.24 again, and it is still not bindable on this environment."
opened: 2026-10-01T05:11:47.966Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I looked for R-6.24 again, and it is still not bindable on this environment.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I looked for R-6.24 again, and it is still not bindable on this environment. The adapter's binding matches what the contract specifies; what's missing is the delay proxy itself, which isn't running.

**What I checked.** `spec/contract/observables.yaml` (`delivery_delay`) says the slow-mail proxy's control API sits beside the mail catcher under `${SDLC_MAIL_API}/hold`. The existing adapter already calls exactly what it specifies:
- **`open` and `delivery_slowed`:** `GET /hold/proxies/smtp/toxics`.
- **`slow_delivery`:** `POST` there with a three-second toxic named "hold".
- **`restore_delivery_speed`:** `DELETE .../toxics/hold`.

I made the requests from the catcher's own origin in the browser. Every `/hold` address answered 404 with `404 page not found`: `/hold`, `/hold/`, `/hold/proxies`, `/hold/proxies/smtp/toxics`, `/hold/version` and `/hold/reset`. Made-up paths like `/nonexistent-xyz` and `/proxies` got the same response with the same headers, so the catcher has nothing mounted under `/hold`.

The catcher itself is healthy. `/api/v1/chaos` answers 200, which means the separate mail-refusal page still works, and `/api/v1/webui` confirms the catcher's fault injection is switched on. I also tried:
- the proxy's usual port, 8474 (`/proxies` and `/version`): connection refused;
- ports 8475 and 8026: no answer, though the catcher page's security policy blocks requests to other addresses, so those two tests prove nothing;
- `/hold/proxies/smtp/toxics` on the target at http://localhost:4300: its own "Page not found" page.

There was no other place to try. This is a fixed control interface, not something hidden behind a label, a sign-in or a different persona.

**What I changed.** I edited one thing in `tests/adapters/new/index.ts`. When a `GET` or `POST` to the delay proxy gets a 404, the `unbound:` reason now says the catcher answered 404 the same way it does for any address it doesn't serve, so the proxy's control API is not mounted. Everything else is as before:
- A `DELETE` that gets a 404 still counts as "nothing left to remove", so restoring speed never fails a test.
- Other unexpected status codes keep the old message.
- The binding still works on a catcher set up the way `observables.yaml` describes.

**What I left alone.** `bindings.yaml` still lists all three `mail-delivery-delay` members as `bound`, because the binding is right and only the environment is missing a piece. The fix is to start the pass-through proxy (`mail-hold`) with its control API under `/hold` on the catcher, and to route the service's SMTP through it. That is outside this stage's paths, so I didn't touch any harness or environment file.

**Not checked.** I couldn't type-check the edit: the command needed an approval nobody was here to give. The new branch only calls the existing `unbound(where, reason)` helper the same way the surrounding code does.

I found no other unbound members to revisit, and every other route in the surface was left as the previous binding had it.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-20 adapter bind every surface action and observation on new, and nothing else? Approved. The only change (tests/adapters/new/index.ts:1879) gives a more specific unbound reason when GET/POST to the delay proxy's control API returns 404. A 404 already fell outside the accepted codes for both methods and the unbound helper throws, so behaviour is unchanged, DELETE-404 still counts as nothing left to remove, and no assertion or business logic is added. Nothing under tests/acceptance changed, and the runner's typecheck passed. The reason is real: every /hold path got the catcher's generic not-found while the catcher itself is healthy, so the delivery_delay control API named in observables.yaml is absent from the environment. The bindings themselves match the contract, so keeping the mail-delivery-delay members bound is correct. The egress failures are all in older build-slice files outside this diff. The ruling would change if the binding diverged from observables.yaml or a mounted /hold endpoint were shown to exist that the adapter fails to reach.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `81c9d3a2d9ccadfa2e8dd377c63989d1f27be5ae`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
