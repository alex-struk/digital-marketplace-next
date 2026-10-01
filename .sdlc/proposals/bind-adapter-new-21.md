---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I made two changes in `tests/adapters/new/`, one for each condition."
opened: 2026-10-01T05:58:43.270Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made two changes in `tests/adapters/new/`, one for each condition.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made two changes in `tests/adapters/new/`, one for each condition. I could not run the TypeScript check: the commands to run it needed approval, which isn't available in this unattended session. The edits are small (one pattern, two comments, one error message and one YAML block), but nothing has checked them by running.

**Condition 1, the terms-acceptance notice.** I signed in through the identity provider's own form as the seeded vendor who never accepted the terms. Their Legal section says "You have not agreed to the terms and conditions." The old pattern, `/\bagreed to (the )?terms/i`, matched that line, so a vendor with no acceptance was read as holding one. `userProfileSelfLegal.acceptedOnNotice` now matches only a line that begins "You agreed to the terms…" (it also accepts "You agreed to terms…"). The page check tests each line on its own, so these all now read as empty:
- the "You have not agreed…" line;
- the reset vendor's "You last agreed to terms and conditions on …";
- the new "Review and agree to the terms" text.

I also checked `termsUpdatedWarning` for this vendor. Their section shows "Agree to the terms and conditions", "Review and agree to the terms and conditions to continue using the Digital Marketplace." and "Review and agree to the terms". None of these match the warning's pattern, so it returns empty, which is consistent for someone who never agreed. I did not re-walk a vendor with a standing acceptance. The affirmative wording comes from the earlier accepted walk.

**Condition 2, the mail-delivery delay.** This sandbox has no delay proxy that I could find. On the mail catcher, every `/hold` address I tried answers the catcher's plain "404 page not found": `/hold/proxies/smtp/toxics`, `/hold/proxies` and `/hold/version`. Nothing answers on the proxy's usual control port, 8474, or on 8026–8027, 8475–8477, 18474 or 28474. Port 1025 is the catcher's own SMTP and 8080 is the identity provider.

The contract gives no other address for the proxy, so the code still points at the catcher's `/hold` address, as `observables.yaml` (`delivery_delay`) says. The comment and the unbound message now say this is a sandbox gap, not the target's. In `bindings.yaml`, `slow_delivery`, `restore_delivery_speed` and `delivery_slowed` on `mail-delivery-delay` changed from `bound` to unbound, with what I tried. The same binding should work unchanged once the sandbox serves the proxy.

One quirk is left as it was: restoring the delay still treats a 404 as done, so a test's cleanup won't fail. On this sandbox that means `restore_delivery_speed` quietly does nothing rather than throwing, even though the bindings file lists it as unbound.

**Not in scope, noticed in passing.** The never-agreed vendor's Legal section now offers a "Review and agree to the terms" item. The accepted bindings say no such control exists, based on walks as the reset vendor and the organization owner, so `accept_updated_terms` may be reachable for this vendor. I didn't rebind it because neither condition asked for it.

Nothing else was changed, and no file outside `tests/adapters/new/` was touched.

deferred-request 2: there is no delay proxy on this sandbox to bind to, so R-6.24 can only be reported as a sandbox gap until one is provided.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new target's adapter bind every surface action and observation, and nothing else, now that the two revision requests from build-slice-6-3 have been answered? Ruling: approve. userProfileSelfLegal.acceptedOnNotice now matches only an affirmative line beginning 'You agreed to (the) terms', the same as the old target's /you agreed to/i. The never-agreed vendor's 'You have not agreed…' line and the reset vendor's 'You last agreed…' line now read as empty, and the author checked that termsUpdatedWarning returns empty for a vendor who never agreed. The mail-delivery-delay members are marked unbound with a real reason. Every /hold address on the mail catcher answers its plain 404 and no proxy answers on 8474 or the nearby ports, so this is a missing surface on the sandbox and not a convenience. The binding still points at the only address the contract gives (observables.yaml delivery_delay), so it should work unchanged once the sandbox serves the proxy. The diff touches only tests/adapters/new/, adds no assertions or business logic, and leaves nothing under tests/acceptance changed. The runner's typecheck on this revision passed with no diagnostics under adapters/new/. The egress failures are all in files this proposal does not change. Two smaller points do not block approval. First, restore_delivery_speed still treats a 404 as done, which keeps test cleanup from failing. Second, the never-agreed vendor's 'Review and agree to the terms' item may make accept_updated_terms reachable for that vendor, which neither request asked about. What would change the ruling: evidence that a vendor with a standing acceptance renders a line the new pattern misses, or that the delay proxy is reachable at some address on this sandbox.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `fec530e6a51a82f842ce4dbbbc9c428f24af00be`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
