---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I made the one correction the ruling asked for, in `tests/adapters/old/index.ts`."
opened: 2026-09-28T14:42:12.749Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I made the one correction the ruling asked for, in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I made the one correction the ruling asked for, in `tests/adapters/old/index.ts`. Nothing else in the adapter or in `bindings.yaml` changed, and I did not re-walk the target.

**What changed.** The previous revision sent the deactivated-vendor persona through its session route every time. That route creates a session without checking whether the account is active, so the R-4.4 test on old would have shown a deactivated account being let in. signIn now does this for that persona:

- It opens the session route as before.
- It then asks the target for the signed-in account's current status. Checking the target in the browser, `/api/sessions/current` returns the signed-in user with a `status` field; for this seeded account it currently reads `INACTIVE_ADMIN`.
- If the status is `ACTIVE`, the session is kept. That is the R-4.14 case, where an administrator reactivates the account before the vendor signs in to set their own name.
- In every other case, including an unknown status, it signs straight back out and throws `unbound: signIn.deactivated-vendor — …`. The reason says the session route mints a session without checking account status, so it cannot show the identity provider's refusal. R-4.4 will therefore be reported unbound on old, not as a false finding.

I rewrote the comment above signIn to describe this, and added a small helper, `accountStatus()`, that reads the status. The status is read from the target at the moment of sign-in, not remembered inside the adapter. That way it holds however the reactivation happened, even through a different page object. During the check I signed the browser session back out; I changed no data on the target.

**Bindings file.** It needed no change: signIn is not a surface action or observation, so it is not listed there.

**What I could not do.** The typecheck needed approval I did not have, so it did not run. I reviewed the new code by reading it: it uses only the `page.request` interface the adapter already uses elsewhere.

**Still open.** As the ruling notes, the R-2.14 hardening from the previous revision has no confirmed cause and should be checked first at the next calibration.

No route in `surface.yaml` was found not to resolve during this revision.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does the old-target adapter bind every surface action and observation, and nothing else? The reviewer was bypassed only because R-8.31 went to bind-adapter three times, past policy.loops.rebind's limit of 2. Ruling: approve. The return on bind-adapter-old-22 already accepted eight of this branch's nine changes, including the save-after-remove and the Code With Us terms-dialog save that answered the three R-8.31 sends. It returned only the deactivated-vendor sign-in, and that is now fixed in tests/adapters/old/index.ts: signIn opens the session route, reads the account's current status from /api/sessions/current through accountStatus(), keeps the session only when the status is ACTIVE (the R-4.14 case after reactivation), and otherwise signs out and throws the unbound error. The comment above signIn matches. R-4.4 on old is therefore reported as unbound, not as a false finding. The code for each R-8.31 send is on the branch: removeAttachment calls attachmentsOpenToChange first; startEditingProposal tries the top-bar Edit, then the Proposal Details tab, and does nothing on an editable form; removeExistingAttachment saves through saveAttachmentForm. The runner's typecheck reports no errors under adapters/old/. The escalation came from the loop count, not from a pipeline defect, so no further escalation is warranted. What would change the ruling: a calibration run showing R-4.4 or R-4.14 misbinding on old, or the R-8.31 removal still not reaching the service. The R-2.14 hardening has no confirmed cause and should be checked first at the next calibration.

**Conditions:**
- condition-met bind-adapter-old-22#1: signIn in tests/adapters/old/index.ts now keeps the deactivated-vendor session only when accountStatus() reads ACTIVE from /api/sessions/current; otherwise it signs out and throws 'unbound: signIn.deactivated-vendor — the session route mints a session without checking account status…', and the comment above signIn describes this

### Runner-owned typecheck evidence

Proposal revision: `931ff1e1b712241551ed7f4060a6dabf0134f88f`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
