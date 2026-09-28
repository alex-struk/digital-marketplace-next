---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-28T14:42:12.644Z"
cost: 0.447355
turns: 18
session: "7bbcde41-2f88-4c71-b493-e9524b76e865"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

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