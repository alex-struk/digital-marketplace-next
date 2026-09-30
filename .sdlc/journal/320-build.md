---
stage: "build"
title: "build slice 2"
at: "2026-09-30T18:54:11.844Z"
cost: 2.4446320000000004
turns: 60
session: "a4b9d34a-c62e-4c22-adcf-7bfa0d2978fc"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've made the change for this revision, and all the unit tests pass: 304 tests across the three workspaces, and `npm --prefix app run check` typechecks cleanly. I did not bring up the compose stack or run a browser against it. This host runs other people's containers and the sandbox password isn't in this session. So the fix is checked by tests that run the real service over HTTP, not by the acceptance suite.

**What was wrong.** R-4.1, R-4.2, R-4.3 and R-4.17 failed on an empty value, and R-4.24 on an empty date. All five read the person's account from `GET /api/sessions/current` (the contract's `user-account-self-request`). The suite signs in through the browser and then calls `/api` from that same browser. The call carries the browser's cookies but no bearer token: the sandbox realm's client doesn't allow a direct token grant, so a test can't get a token of its own. The service treated every request without a token as a visitor's and answered `{ "id": null, "user": null }`. That is the empty identifier and the empty notice date. Sign-in itself was working (decision record 0015). The service simply couldn't tell who was asking.

**What I changed.**
- **A session cookie beside the bearer token.** When sign-in completes, `/auth/callback` now also starts a session held by the service. The browser gets it as an `HttpOnly` cookie, `dm-session`, which holds only a random identifier and lasts ten hours. The session is held in memory, like the existing list of sessions signed out of (a sandbox runs one backend). The code is in `app/backend/src/auth/service-sessions.ts`.
- **Requests without a token.** The check in front of every `/api` route now answers a request with no token for whoever its cookie names. A missing, unknown, expired or signed-out cookie still makes it a visitor's request. A bearer token, when present, always decides, so the single-page app behaves as before. What a person may do is still read from the `users` table on each request, so an account an administrator deactivates is refused either way.
- **Sign-out.** `DELETE /api/sessions/current` now ends the cookie's session, along with any other session started from the same identity-provider session, and clears the cookie. After signing out, the same browser reads nobody from `/api/sessions/current`. The identity provider's session is still ended from the page, and the person is told they're signed out only after both have ended.

**Criteria.** The fix above is what R-4.1, R-4.2, R-4.3, R-4.17 and R-4.24 were failing on. What they check is unchanged:
- **R-4.1:** the account is made by identity kind.
- **R-4.2:** the welcome message is sent, and skipped when there's no email address.
- **R-4.3:** the vendor's terms agreement is recorded with its time.
- **R-4.17:** signing out ends both sessions and says so.
- **R-4.24:** the notice choice is saved with its time.

R-4.23, R-6.1, R-6.20 and R-6.28 weren't named in this ruling and I left them alone.

**The two conditions still owed.**
- **`build-slice-2-5#1` (R-4.17):** met by the sign-out change above. There are two parts:
  - the identity provider is signed out from the page, and the person is told only once both have finished
  - a failure is shown as `sign-out-failed`

  The cookie was the part still leaving the person signed in to the service.
- **`build-slice-2-8#2`:** `app/backend/tests/sign-in-flow.test.ts` no longer contains an internal ticket number. It was already gone when I started. I searched the whole of `app/` for ticket-style references and found none, and the new test files add none.

**Unit tests added.**
- `tests/service-sessions.test.ts`: sessions run out, sign-out ends every session from the same identity-provider session, and sign-out works when the request carried only a token.
- `tests/sign-in.test.ts`: a cookie with no token is answered for the person; a signed-out or unknown cookie is a visitor's; a token overrides the cookie.
- `tests/signing-in-end-to-end.test.ts`: signs in through `/auth/sign-in` and `/auth/callback`. It then reads the account and saves the notice choice with only the cookie, signs out with the token, and reads nobody afterwards. A refused sign-in sets no cookie.

**Records.** I added decision record 0017, which says why the cookie exists and what would remove it. Records 0003, 0004 and 0015 now point to it, and `app/README.md` mentions it.

**What the next slice will find.**
- Because `/api` now accepts the cookie, slice 3's file downloads can be plain links. Fetching them with the token still works.
- Sessions are held in memory. If the backend ever runs as more than one instance, they'll need to move to shared storage.
- Nothing I needed was outside `app/` and `docs/decisions/`.