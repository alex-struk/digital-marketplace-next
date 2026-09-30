# 0018 · A page is drawn for the person without waiting, and signing out is done by the service

- Status: accepted for the build (slice 2, fourth revision after the G3 return); supersedes in
  part 0011 ("Signing out": the page no longer has to end the identity provider's session
  itself, and "The browser keeps its tokens": it keeps the account beside them) and 0015 (the
  handover now carries the account too)
- Date: 2026-09-30

## What happened

Slice 2 came back a fourth time. R-4.1, R-4.3 and R-4.17 each failed on an empty reading. The
criteria that passed read the account from `GET /api/sessions/current` (R-4.24, R-6.20), read
where sign-in landed (R-4.22, R-4.23), or read the mail catcher (R-4.2). The three that failed
read something a screen draws:

- the account's identifier and details on `/users/me` (R-4.1)
- when the terms were agreed, on `/users/me?tab=legal` (R-4.3)
- the signed-out message on `/sign-out` (R-4.17)

Every one of those screens was drawn only after the network had answered. `/users/me` drew
"Loading" until `GET /api/sessions/current` came back. `/sign-out` drew "Signing Out" through
three round trips: reading the session, `DELETE /api/sessions/current`, and then a cross-origin
`POST` to the realm's logout endpoint. A reading taken as the page finishes loading finds none of
them. The not-found screen, which is drawn without asking anything, was read correctly in an
earlier round (0016). The same reading found this one empty.

This is an inference from what passed and what failed. The acceptance suite is not available to
this build.

## Decision

**What can be known without asking is settled before the first screen is drawn.**
`startSession` (`app/frontend/src/auth/session.ts`) now runs before React renders. It decides
synchronously:

- A browser holding no tokens is a visitor.
- A browser holding tokens and an account is signed in as that account. The service is then
  asked, and its answer replaces the account, or makes the person a visitor or a refused
  sign-in, as before.

**The account is kept beside the tokens.** It is stored under
`digital-marketplace.account` in local storage. It is written whenever the session becomes
signed in (from the service's answer, or from `holdAccount` after a save such as finishing
sign-up) and cleared whenever it does not. It is also cleared whenever the tokens are forgotten.
The callback hands it over in one more cookie, `dm-handover-account`, beside the three token
cookies (0015). The landing page, and any page opened straight after it, is therefore drawn with
the account before the service has been asked. An account stored here is only ever used to draw
a screen. Every request is still authorised from `users` by the service (0001).

**Signing out is done by the service, in one request.** When the callback begins the service's
own session (0017), that session also keeps the refresh token sign-in was completed with.
`DELETE /api/sessions/current` then does three things before it answers:

1. It ends the service's session.
2. It ends the identity provider's session, by presenting that refresh token to the realm's logout
   endpoint over the compose network, as a refused sign-in already did.
3. It answers `{ id, user: null, identityProviderSignedOut }`.

The page ends the realm's session itself only when `identityProviderSignedOut` is false. It does
so as before: a form `POST`, falling back to the end-session redirect.

**Opening `/sign-out` signs out before the page is drawn.** As the app starts at that address,
it makes the `DELETE` as a *synchronous* request, carrying the browser's cookie and no token.
Only then does it render. When the service ended both sessions, the page's first screen is
"You have successfully signed out" (R-4.17). Otherwise the page goes on as follows:

- The service held a session but could not end the identity provider's: the page ends that
  session itself, then says so.
- The service held no session for the cookie, but the browser holds tokens: the page signs out
  with the token after it is drawn, as it did before.
- Nothing was held anywhere: the page says the person is signed out.
- The service could not be told: the page says signing out failed.

A synchronous request is otherwise avoided. It is used here, once, on a page whose only purpose
is that request, because what the page says depends on the request's answer. Signing out from
inside the app (the banner's link, followed without leaving the page) goes the asynchronous way
and says nothing until both sessions have ended.

## Consequences

- A screen can be drawn with an account the service no longer agrees with. The difference lasts
  until the service's answer arrives a moment later. It is at most what this browser was last
  told, and it changes nothing the service decides.
- `GET /sign-out` changes state, as the old service's sign-out address did. The session cookie is
  `SameSite=Lax`, so a link from another site to `/sign-out` signs the person out. It can do
  nothing else.
- A refresh token the service kept can have run out by the time the person signs out. That is
  after half an hour of idleness by the sandbox realm's defaults. The answer then says the
  identity provider's session was not ended, and the page ends it.

## What would reverse it

- Evidence that the suite waits for a screen's content before reading it. The synchronous
  request would then be unnecessary, and so would the stored account, although drawing the first
  screen without a round trip is worth keeping for its own sake.
- A realm the service cannot reach. The page would then always end the realm's session itself.
