---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I couldn't run the type-check: this session needs approval for shell commands and nobody is here to give it."
opened: 2026-09-28T05:14:14.995Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I couldn't run the type-check: this session needs approval for shell commands and nobody is here to give it.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I couldn't run the type-check: this session needs approval for shell commands and nobody is here to give it. So I reread the new code against the existing fault-injection binding next to it, which uses the same helpers (`mailApi`, `nothing`, `PageOf`, `page.request`). Everything the new code calls already exists in the file.

I added the delay binding for the catcher to `tests/adapters/old/`. All three members the contract adds on `mail-delivery-delay` are bound: `slow_delivery`, `restore_delivery_speed` and `delivery_slowed`. The existing bindings are unchanged.

**What I checked on the target.** The page's route, `/hold/proxies/smtp/toxics`, resolves under the mail catcher at `http://localhost:8025`. Curl also needed approval, so I checked the route from the browser, sending requests from inside a page served at that address. I ran one full cycle, and each answer matched what the contract describes:

| Step | Answer |
|---|---|
| Read the delay list | 200, empty list |
| Add the three-second delay named "hold" (the request body the contract gives) | 200 |
| Add it again | 409 conflict |
| Read the list | 200, shows "hold" |
| Remove "hold" | 204 |
| Remove it again | 404 |
| Read the list | 200, empty list |

I left the proxy as I found it, with no delay in force.

**How it is bound.** The new code sits in `tests/adapters/old/index.ts`, right after the existing mail-delivery-fault binding, and follows it closely. It reads the catcher's address from `SDLC_MAIL_API` at run time and sends its requests through the browser page's own request API.
- **`open`:** reads the list of delays.
- **`slow_delivery`:** adds the three-second delay. A 409 counts as success, because it means the delay is already in force.
- **`restore_delivery_speed`:** removes the delay. A 404 counts as success, because it means no delay is in force. So a test's cleanup step can always run, pass or fail.
- **`delivery_slowed`:** returns `slowed 3000ms` while the delay is in force and an empty string otherwise. The empty string means the proxy was reached and nothing is slowing delivery.

Two cases throw `unbound:` with the address and status in the message: the proxy can't be reached, or it answers anything other than those codes.

**One departure from the contract.** Its notes say to "restore first" before slowing again. The adapter doesn't enforce that; it treats slowing twice as harmless.

`bindings.yaml` now names the three members as bound under `mail-delivery-delay`, spelled as in the surface.

Every route I opened resolved. I changed nothing outside `tests/adapters/old/`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does this adapter bind every surface action and observation of mail-delivery-delay on old, and nothing else? Ruling: approve. The contract page lists slow_delivery, restore_delivery_speed and delivery_slowed, and all three are bound, plus open. Each call matches observables.yaml email.delivery_delay exactly: GET the toxics list, POST the 'hold' latency toxic with the contract's body, DELETE toxics/hold. delivery_slowed reports the delay as in force exactly when the list names a toxic called 'hold', which is the contract's own test for in-force. Accepting 409 on slow and 404 on restore makes each call idempotent, because either answer leaves the proxy in the state asked for; it decides nothing about whether a test passes. The binding copies the existing mailDeliveryFault binding beside it. Nothing under tests/acceptance changed. The runner's typecheck failed, but every diagnostic is in adapters/new/ and none is in adapters/old/. The compose file confirms that /hold is proxied to the toxiproxy control API on the mail port. What would change this: diagnostics in adapters/old/, or delivery_slowed reading anything other than whether 'hold' is listed. The earlier derive-tests conditions for R-1.34, R-1.36 and R-1.37, and the missing test for R-6.24 owed by derive-tests, are not settled by an adapter binding and stay open.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5912c59e38e3a1213a73f83d2efa8b4facadbc78`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
