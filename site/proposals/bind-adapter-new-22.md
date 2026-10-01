| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T06:01:07.765Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The ruling asked me to bind R-6.24's delay page to wherever the delay proxy actually runs on the new target.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The ruling asked me to bind R-6.24's delay page to wherever the delay proxy actually runs on the new target. It can't be bound: this sandbox has no delay proxy anywhere. That is a gap in the sandbox, not in the target, and it should be raised that way instead of being carried as an unbound criterion.

**What I checked.** The new target was restarted shortly before this run. Its compose project now has five running containers: frontend, backend, identity provider (Keycloak), Postgres, and a plain Mailpit catcher on ports 1025 and 8025. Two one-off setup jobs (database migration and identity-provider realm setup) ran and exited. There is no mail-hold or toxiproxy container in it. The contract places the proxy's control API beside the catcher under `${SDLC_MAIL_API}/hold`. I opened `http://localhost:8025/hold/proxies/smtp/toxics` in the browser and it still answers 404, the same not-found the catcher gives any address it doesn't serve. I also listed every listening port on the host. Each one belongs to the target, its catcher or identity provider, or to unrelated projects; none is the proxy's control port 8474 or anything like it. The contract gives no other address for this proxy, so there was nowhere else to bind it.

**What I changed.** Only the explanatory comment above `mail-delivery-delay` in `tests/adapters/new/bindings.yaml`. It now records the recheck: the compose project's full list of services and the absence of any proxy port on the host. The three members keep their entries as before:
- `slow_delivery`: unbound, sandbox gap
- `restore_delivery_speed`: unbound, sandbox gap
- `delivery_slowed`: unbound, sandbox gap

I left the adapter code in `tests/adapters/new/index.ts` exactly as it was. It already calls the address the contract names, and on a 404 it throws an `unbound:` error that calls this a sandbox gap. Once a mail-hold proxy is served under `/hold` next to the catcher, the binding should work without changes. Nothing else in the adapter or bindings file was touched.

**For whoever acts on this.** The fix is in the sandbox, not the adapter. The new target's environment needs the pass-through proxy that `observables.yaml` describes under `delivery_delay`: sitting between the service and the catcher's SMTP port, with its control API served at `${SDLC_MAIL_API}/hold`. Until that exists, R-6.24 can't be measured on this target. I am not deferring the request: the answer is this sandbox gap.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the adapter for target new bind every surface action and observation, and nothing else? Approve. The only change is the comment above mail-delivery-delay in tests/adapters/new/bindings.yaml. No binding changed, no assertion or business logic was added, and nothing under tests/acceptance was touched. R-6.24's three members (slow_delivery, restore_delivery_speed, delivery_slowed) stay unbound, and each reason names a real missing surface: the delay proxy's control API is not served on this sandbox. The evidence supports that: the compose services list no proxy, ${SDLC_MAIL_API}/hold answers the catcher's 404, and no host port belongs to a proxy. The contract gives no other address to bind, so this is a sandbox gap and not an adapter defect, which answers the tech-lead's revision request. The typecheck on adapters/new passed with no diagnostics. The egress failures are all in other proposals' files, not in this diff. The ruling would change to a return if the delay proxy turned out to be reachable at an address the adapter does not call, or if the contract named one the adapter did not try.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `0368273e0991b8f50da4143673db0795771bfb9a`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
