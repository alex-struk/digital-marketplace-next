# 0015 · Sign-in begins and ends at the service, which hands the tokens to the app

- Status: accepted for the build (slice 2, revision after the G3 return); supersedes in part
  0001 (the sign-in row of its table), 0003 (the first bullet under "How sign-in changes the
  contract"), 0004 (the second and third sentences of its first paragraph) and 0011 ("Completing
  sign-in is reading the current session", the keycloak-js clause of "The browser keeps its
  tokens", and where the identity-provider hints are set)
- Superseded in part by: 0017, for the first consequence below: the callback now also begins a
  session of the service's own; and by 0018, for the handover, which now carries the account
  as well as the tokens
- Date: 2026-09-30

## What happened

Slice 2 was returned with R-4.1, R-4.2, R-4.3, R-4.17, R-4.22 and R-4.24 not met. Earlier
slice 2 code passed its own tests, and the criteria that passed (R-4.6, R-4.23, R-4.27, R-4.28)
are all ones a visitor-only browser also satisfies. The six that failed share one cause.

The single-page app completed sign-in *after* `/auth/callback` had loaded. keycloak-js swapped the
code for tokens, then `GET /api/sessions/current` made the account and the app moved to the
landing page. All of that happened after the page's load event. A browser that treats "back on the
application" as "signed in" and moves on straight away cuts that short. The results match the
returned criteria. The account is never made and no welcome is sent (R-4.1, R-4.2). The page read
is `/auth/callback`, not the landing page (R-4.22). The next page opens as a visitor, so
`/sign-up/complete` sends the person to sign in and its boxes never appear (R-4.3, R-4.24), and
`/sign-out` says "signed out" while the identity provider's session lives on (R-4.17,
`build-slice-2-5#1`). The service this one replaces completed sign-in in a server-side redirect,
so by the time any page loaded, the account, the session and the landing address were all
settled.

## Decision

**`/auth/sign-in` and `/auth/callback` are the service's own addresses** (the contract's
`startSignIn` and `completeSignIn`, answered as the redirects the contract says they are).
`app/backend/src/auth/sign-in-flow.ts` holds the logic and `app/backend/src/users/sign-in.controller.ts`
the thin controller.

- `GET /auth/sign-in?provider=&redirectOnSuccess=` makes a fresh `state` and PKCE verifier. It
  keeps both, with the return address, in an `HttpOnly` cookie named by the state
  (`dm-sign-in-<state>`, path `/auth`, ten minutes). It then redirects to the realm's
  authorization endpoint with the S256 challenge, `client_id`, the fixed `redirect_uri`
  `<SERVICE_ORIGIN>/auth/callback`, and `kc_idp_hint` when one applies. The hints are the
  service's settings `OIDC_IDP_HINT_VENDOR` and `OIDC_IDP_HINT_PUBLIC_SECTOR`, which were the
  build-time `VITE_` ones.
- `GET /auth/callback` checks that the state matches a sign-in this browser began, and clears
  that cookie. It exchanges the code at the realm's token endpoint as the **public client with
  the verifier** (no secret exists anywhere), then checks the access token exactly as every
  `/api` request's is checked. The account is found or made next, and a new account is welcomed
  (R-4.1, R-4.2). The browser is then redirected to the page sign-in began from, or to
  `/sign-up/complete` or `/dashboard` (R-4.22, R-4.23). Any failure (no matching state, an
  `error` from the realm, a code that will not exchange, a token that fails its checks, or an
  account the service refuses) redirects to `/notice/authFailure`. If a session was made at the
  realm, it is ended there first with the refresh token, so another identity can be tried
  (R-4.4, R-4.6).
- **The tokens reach the app in cookies set on that same redirect**: `dm-handover-access`,
  `dm-handover-refresh` and `dm-handover-id`, path `/`, `SameSite=Lax`, five minutes, readable by
  script. They exist before the landing page's first byte. The app moves them into local storage
  as it starts, synchronously and before it asks anything of the network, and clears them. A
  browser that leaves the landing page at once therefore still holds a sign-in. Each token is its
  own cookie because the three together would pass the 4 KB a cookie may hold.

**The app holds and renews its tokens itself** (`RealmIdentityClient` in
`app/frontend/src/auth/identity-client.ts`), and keycloak-js is gone. The plan proposed
keycloak-js for PKCE sign-in in the app, and that job has moved to the service. What remained was
keycloak-js resuming held tokens, and it forces a renewal on every page load when started that
way: a network round trip before the first request, and one more way to fall back to being a
visitor. The client renews from the refresh token only when the access token is within thirty
seconds of running out. It ends the realm's session on signing out with the same form `POST`
0011 describes, falling back to the end-session endpoint with the ID token.

**The boundary accepts what an OpenID provider sends back.** The recovered contract names only
`code` and `redirectOnSuccess` on `/auth/callback`. `withIdentityProviderCallback`
(`app/backend/src/common/contract.ts`) adds `state`, `session_state`, `iss`, `error`,
`error_description` and `error_uri` as optional, and makes `code` optional because an error
answer has none. Unknown parameters are still refused.

**The identity provider names itself one way.** The service exchanges the code over the compose
network (`OIDC_BACKCHANNEL_URL=http://idp:8080/...`), but the browser renews tokens at
`localhost:8080`. `KC_HOSTNAME=http://localhost:8080` on the `idp` service makes every token name
`http://localhost:8080/realms/digital-marketplace` as its issuer, whichever address it was asked
at. The web server in front of the app forwards `/auth/*` to the service.

## How this stands against the stack profile

The profile says: "The single-page app uses the PKCE flow; no client secret is embedded in
frontend code." Sign-in is still OpenID Connect's authorization-code flow with PKCE, begun and
finished in the browser, with a public client and no secret anywhere. Only the verifier and the
exchange of the code have moved from the page to the service's two sign-in addresses. 0004
foresaw this as "a recorded departure from the profile's PKCE rule, with a backend-held code
exchange". This record is that departure. The reason for it is the one above: completing sign-in
before the landing page loads is what the returned criteria turned on, and a page cannot do that
for itself. Nothing else in 0004 changes. Bearer tokens on `/api`, authorization from `users`, the
sandbox realm and the seeded first administrator all stand.

## Consequences

- Nothing about a session is held by the service beyond the ten-minute pending sign-in cookie.
  The service still keeps no session of its own. The app presents a bearer token as before.
- The handover cookies travel on requests made in their five minutes, `/api` included. The
  service reads no token from a cookie, so they authorise nothing there. The app clears them on
  its first start after the redirect.
- The app's `/auth/sign-in` and `/auth/callback` screens are removed. The sign-in and sign-up
  buttons navigate the whole page to `/auth/sign-in`.

## What would reverse it

- A ruling that the profile's PKCE rule means the page itself must hold the verifier and exchange
  the code. The service's routes would go back to being screens. Some other way would then be
  needed to have the account, the session and the landing address settled before the landing page
  loads, or the returned criteria would have to be measured differently.
- A realm reachable by the service at the same address the browser uses, which would remove the
  need for `KC_HOSTNAME` and `OIDC_BACKCHANNEL_URL` but change nothing else.
