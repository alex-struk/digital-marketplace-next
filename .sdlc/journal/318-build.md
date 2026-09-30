---
stage: "build"
title: "build slice 2"
at: "2026-09-30T16:17:01.137Z"
cost: 1.8065568000000003
turns: 54
session: "f829260c-3efa-4418-9b70-68b1c572e0e6"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've changed sign-out so that it no longer shows "signed out" before the identity provider's session has actually ended. I could not run it against the real sandbox, and I did not re-check the rest of slice 2 end to end. Docker Compose needed an approval this session could not get, and there is no browser here, so both the fix and the rest of the slice are checked only by unit tests. `npm --prefix app run check` passes: 15 migrations tests, 154 backend and 78 frontend.

**What I think was wrong with R-4.17.** Opening `/sign-out` did three things in order:
1. Told the service (`DELETE /api/sessions/current`).
2. Marked the browser as signed out, which put the `sign-out-success` message on screen.
3. Only then sent the browser to Keycloak's logout page, which comes back to `/sign-out`.

So for a moment the page said the person was signed out while Keycloak still held their session. Anything that saw the message and moved on cut off the trip to Keycloak, and that session stayed alive. The app also never learned whether the Keycloak step worked, so it couldn't honestly report success or failure. I couldn't check this against a running app, so it's my best reading of the code, not something I watched happen.

**What it does now** (`app/frontend/src/auth/session.ts`, `app/frontend/src/screens/sign-out.tsx`, `app/frontend/src/auth/identity-client.ts`):
- It tells the service first, as before. If that fails, nothing is signed out and `sign-out-failed` is shown.
- It then ends the Keycloak session directly from the page, with a form POST to the realm's logout endpoint carrying the client id and the refresh token. A public client can do this without a secret, and Keycloak answers 204.
- The success message appears only once both the service and Keycloak have confirmed.
- If that POST is refused or its answer can't be read, the browser falls back to the old redirect through Keycloak's logout page. The screen stays at "Signing Out" until the browser comes back to `/sign-out` as a signed-out visitor, and only then shows success.
- A sign-in the service refused is signed out of Keycloak the same way, without asking the service.
- Someone who opens `/sign-out` already signed out just sees the success message.

**Two assumptions I couldn't check live:**
- **Browser access to Keycloak's logout endpoint.** I expect Keycloak to allow the browser to read the logout POST's answer, because the realm lists `http://localhost:4300` as an allowed web origin. If it doesn't, the redirect fallback still ends the session, just more slowly.
- **The session id in Keycloak's tokens.** The service refuses old tokens by the session id they carry. I believe Keycloak 26 includes one in its access tokens, but if a token has none, the service now uses the token's own id instead (`app/backend/src/auth/identity.ts`). Without that, a token with no session id would have kept working after sign-out.

**Tests added:**
- The success message stays hidden while the service call is still pending, and Keycloak is contacted only after the service answers.
- When Keycloak can't be reached from the page, the fallback redirect happens and no success is shown.
- A refused sign-in is signed out of Keycloak without calling the service.
- The logout request has the right address and form fields, and the stored tokens are cleared.
- A refusal or network error is reported as failure.
- The session-id fallback in the backend.

I updated the signing-out paragraph of `docs/decisions/0011-signing-in-and-the-session.md` to match.

I changed nothing outside `app/` and `docs/decisions/`, and left the rest of slice 2 as it was. I removed the `node_modules` I installed to run the checks, since nothing ignores them. The next stage should bring the sandbox up and run a real sign-out, checking two things:
- Keycloak's logout POST returns 204 and the browser can read that answer.
- After signing out, signing in again asks for a password.