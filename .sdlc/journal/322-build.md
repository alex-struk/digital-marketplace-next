---
stage: "build"
title: "build slice 2"
at: "2026-09-30T20:10:45.192Z"
cost: 1.8681670000000004
turns: 62
session: "a4164cac-834c-4c8e-be3d-44a83ffa72fc"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Journal: slice 2, fifth revision after the G3 return

## What the ruling asked for and what I changed

The ruling said the three failures came from the test adapter, not from the application, and that the timing measures in decision record 0018 had no evidence behind them. I withdrew every part of 0018 that existed only to deal with read timing:

- **The early sign-out request is gone.** Opening `/sign-out` used to make a blocking `DELETE` before the page drew. Now the page draws "Signing Out" first, waits until it knows who is using the app, and then makes one ordinary request. The blocking request helper and the page's special start-up path are removed (`app/frontend/src/api/accounts.ts`, `app/frontend/src/auth/session.ts`, `app/frontend/src/screens/sign-out.tsx`).
- **The account is no longer stored in the browser.** Local storage now holds only the tokens. Every visit reads the account from `GET /api/sessions/current`, as decision record 0011 describes. A browser holding no tokens is still treated as a visitor straight away, because there is nothing to ask the service.
- **Sign-in hands over tokens only.** The service's callback no longer sets the extra cookie that carried the account (`app/backend/src/users/sign-in.controller.ts`, `app/backend/src/auth/sign-in-flow.ts`). The frontend no longer reads it.

## Condition build-slice-2-5#1 (R-4.17)

Signing out is still a single request. `DELETE /api/sessions/current` ends the service's own session, whether the request identifies it by token or by cookie. It also ends the identity provider's session, using the refresh token saved at sign-in, and reports whether that worked.

The sign-out page:
- makes this request for a visitor as well, because a browser with no token may still carry the service's cookie;
- says "You have successfully signed out" only after both sessions have ended;
- says signing out failed if the service could not be reached;
- ends the identity provider's session itself when the service could not. It tries a logout call from the page first, and if that fails it sends the browser to the provider's sign-out address, which returns to `/sign-out`.

Whether this condition is met can only be shown by a verify run against a rebound adapter that opens `/sign-out`. That rebinding belongs to another stage, so I have not verified the condition here.

## Decision records

I rewrote 0018 so that it keeps only the reason that still holds: signing out happens at the service in one request. It records what was withdrawn and why. I adjusted the cross-references in 0011, 0015 and `app/README.md` to match.

## Unit tests

`npm --prefix app run check` passes: 15 migrations tests, 197 backend tests and 101 frontend tests. I installed dependencies to run it and removed them afterwards.

- **Removed:** the tests for the stored account, for the account cookie, and for signing out before the first draw.
- **Added in the frontend:**
  - one request to the service ends both sessions;
  - the page shows nothing until the service answers;
  - the page does not sign anyone out before it knows who is using the app;
  - a visitor's request still goes to the service and ends in the signed-out message;
  - a service failure shows the failure notice even when there is no token;
  - local storage holds nothing but the tokens, and signing out clears it.
- **Changed in the backend:** the end-to-end test now checks that the callback hands over no account cookie.

## What I could not do here

The criteria built in earlier revisions of this slice are unchanged and still reached the same way: R-4.1, R-4.2, R-4.3, R-4.17, R-4.23, R-4.24, R-6.1, R-6.20 and R-6.28. Whether they pass depends on the three adapter changes addressed to the adapter-binding stage, which I left alone:

- **Signing out:** the adapter's sign-out must open `/sign-out` and clear local and session storage as well as cookies. This affects R-4.17, and also R-6.20 and R-4.23, because every sign-in starts with that sign-out.
- **R-4.1:** the own-profile reads must follow what the screen draws. The status is on one line, "Status: Active", in the element with test id `profile-status-badge`.
- **R-4.3:** the ruling said it is not established which read came back empty. Nothing in the application was changed for it.

The ruling also notes that approval is still blocked by the open missing-test items for R-4.1 and R-4.2. Those tests belong to another stage, not this one.

If a rebound adapter still reads empty values from screens it could not open while signed in, the ruling says the sandbox password gap goes to the pipeline owner.

The next slice will find sign-in, sign-out, sign-up completion and the mail path as before. The only difference is that no screen knows the account until the service has answered.