# 0018 · Signing out is done by the service, in one request

- Status: accepted for the build (slice 2); amended in the fifth revision after the G3 return.
  Supersedes in part 0011 ("Signing out": the page no longer has to end the identity
  provider's session itself). The file keeps its first name so earlier references still find it.
- Date: 2026-09-30

## What happened

An earlier revision of this record rested on an inference: that three criteria (R-4.1, R-4.3,
R-4.17) read empty values because their screens were read before they were drawn. It answered
that with three measures: a synchronous sign-out request made as the app started at `/sign-out`,
before anything was drawn; the account kept in local storage beside the tokens, so a page could
be drawn for the person before the service answered; and the account handed over in an extra
cookie on the sign-in callback.

The ruling that returned that revision found that the inference did not hold. The acceptance
harness had signed people out by clearing cookies and opening the home page. It never opened
`/sign-out`, and it left the app's local storage in place. No timing measure in the application
could change what that read. All three measures therefore existed only to answer read timing.
They are withdrawn:

- Opening `/sign-out` no longer makes any request before the page is drawn. The page draws
  "Signing Out" and then signs out asynchronously, as any other request does.
- The account is not kept in the browser. Local storage holds the tokens and nothing else. Every
  visit asks `GET /api/sessions/current` for the account, as 0011 had it.
- The sign-in callback hands over the tokens only (0015), not the account.

## Decision

**Signing out is done by the service, in one request (R-4.17).** When the callback begins the
service's own session (0017), that session also keeps the refresh token sign-in was completed
with. `DELETE /api/sessions/current` then does three things before it answers:

1. It ends the service's session, whether the request names it by bearer token or by cookie.
2. It ends the identity provider's session, by presenting that refresh token to the realm's logout
   endpoint over the compose network, as a refused sign-in already did.
3. It answers `{ id, user: null, identityProviderSignedOut }`.

The sign-out page makes that request once it knows who is using the app. It makes it for a
visitor too, since a browser holding no token may still hold the service's cookie. The page
says "You have successfully signed out" only once both sessions have ended. It says signing out
failed when the service could not be told. When the service ended its own session but not the
identity provider's, the page ends the identity provider's session itself, as 0011 had it: a
`POST` to the logout endpoint, falling back to the end-session redirect, which returns to
`/sign-out`.

This keeps what the person is told tied to what actually happened at both ends, from one place.
It also means that ending the identity provider's session does not depend on a cross-origin call
from the browser.

## Consequences

- A refresh token the service kept can run out before the person signs out. By the sandbox
  realm's defaults, that happens after half an hour of idleness. The answer then says the
  identity provider's session was not ended, and the page ends it.
- Every page opened while signed in waits for one round trip before it knows the account. That
  is the behaviour 0011 described.

## What would reverse it

- A realm the service cannot reach. The page would then always end the realm's session itself.
