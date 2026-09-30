---
stage: "build"
title: "build slice 2"
at: "2026-09-30T23:30:23.419Z"
cost: 3.3582208000000002
turns: 77
session: "f14c70f4-4255-4b48-a7c6-dbc368bddcc8"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed R-4.1 and R-4.2. I couldn't find the cause of R-4.23, so the change I made for it is a guess. `npm run check` passes: 15, 199 and 102 tests across migrations, frontend and backend. I couldn't run the stack itself because Docker wasn't permitted in this session, so none of this has been tried against the real identity provider or the browser flow.

**R-4.1 and R-4.2 (fixed).** A vendor who hasn't agreed to the terms yet was sent from every screen to `/sign-up/complete`, and `/users/me` wasn't one of the exceptions. A code-hosting identity's first sign-in always makes such a vendor, so the account that sign-in had just made, with its identifier and email, could never be shown. No criterion asks for the profile to be blocked, and R-4.26 says any signed-in person can open their own profile at `/users/me`. So `openBeforeProfileCompletion` in `app/backend/src/rules/sign-in.ts` now also lets through `/users/me` and `/users/<own id>`, and `app/frontend/src/app/root-layout.tsx` passes it the person's own identifier. Every other screen still sends that vendor to finish signing up, as the seed manifest describes for the vendor still completing their profile. The profile screen itself was already built and its markup is unchanged.

**R-4.23 (cause not found).** The ruling says only that a value read back empty. Nothing I read showed which value that was. The most likely one is the account record the suite reads at `/api/sessions/current`, which is documented as empty when nobody is signed in. But I traced both the cookie path and the bearer-token path for a first-time public sector employee and they return the account. That is now covered by a new check in `signing-in-end-to-end.test.ts`. The two other readings I considered were both too speculative to act on:
- **Missing dashboard empty-state messages:** these belong to later slices, and would be untrue for seeded accounts that do have records.
- **Signing out and back in hitting a session marked as signed out:** this only happens if the identity provider's logout fails.

The one change I made follows the note on R-4.23 and R-4.22 literally: every account just made now lands on `/sign-up/complete`, whatever its kind. That page moves a non-vendor on to the dashboard, so where the person ends up doesn't change. Before this, the service sent a new public sector employee straight to the dashboard. If R-4.23 still fails, the next revision needs to know which value read empty.

**Owed condition `build-slice-2-12#3`.** R-4.3 isn't in this ruling's failures, so it no longer reads empty. R-4.1 now fails in a different way: the adapter reaches the profile screen and is redirected, which the gate fix addresses. The departure from the criterion was the gate described above. I consider the condition met for R-4.3 and accounted for on R-4.1, with the caveat that none of this has run against the live stack.

**Unit tests added:**
- The rule's handling of the own profile.
- A non-profile page still being blocked.
- The new landing for a just-made account.
- An unfinished vendor on `/users/me` seeing their identifier and email field.
- The first-time public sector sign-in, read back by cookie and landing on the dashboard on a second sign-in.

I recorded the decision in `docs/decisions/0019-the-own-profile-stays-open-before-sign-up-is-finished.md` and marked 0011 as superseded in part by it. I changed nothing outside `app/` and `docs/decisions/`. I installed dependencies to run the check and then removed `node_modules`.

**What the next slice will find missing:** the dashboard is still only a heading and who is signed in, with no tables or empty-state messages. Editing the profile, the avatar, capabilities and organizations are still slice 3's and 4's.