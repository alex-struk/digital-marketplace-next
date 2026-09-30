# 0011 · How signing in completes, and what the service answers about a session and an account

- Status: accepted for the build (slice 2)
- Superseded in part by: 0015. Sign-in is completed by the service's `/auth/callback`, which
  makes the account and hands the tokens over; keycloak-js is gone; the identity-provider hints
  are service settings. What this record says about the session and account shapes, `current`,
  signing out, the sandbox realm and finishing sign-up still stands
- Date: 2026-09-30

## Decision

Decision record 0004 fixed the flow: PKCE from the single-page app to the sandbox Keycloak
realm, a public client, bearer tokens on `/api`, the account made on first sign-in. This record
fixes the details a later slice, the acceptance harness or a reviewer would otherwise have to
reverse-engineer.

**Completing sign-in is reading the current session.** `/auth/sign-in` and `/auth/callback` are
screens of the single-page app. The callback screen exchanges the code (keycloak-js, as the
plan proposed) and then asks `GET /api/sessions/current` with the new access token. That request
is the one that makes the account on a first sign-in (R-4.1), welcomes the person (R-4.2) and
refuses an account that may not sign in (R-4.4). The person lands on the page sign-in began from
when one was carried as `redirectOnSuccess`, and otherwise on `/sign-up/complete` for a vendor who
has never agreed to the terms or on `/dashboard` for everybody else (R-4.22, R-4.23). A
return address that does not start with a single `/` is ignored, so sign-in cannot send anyone
off the service.

**A session** is answered as:

```json
{ "id": "<the identity provider's session id, or null>", "user": { "...account..." } }
```

A visitor gets `{ "id": null, "user": null }` with status 200. A token that is not good, or
comes from a session signed out of, is refused with 401. An account the service will not sign in
is refused with 403 and `{ "errors": ["We could not sign you in."] }`, whatever the cause — an
unrecognised identity, an administrator's deactivation, an email address another account of
the same kind holds (R-4.6) — because the notice a person sees names no cause either.

**An account** is the `users` row with its dates as ISO 8601 instants: `id`, `createdAt`,
`updatedAt`, `type`, `status`, `name`, `email`, `jobTitle`, `avatarImageFile`,
`notificationsOn`, `acceptedTermsAt`, `lastAcceptedTermsAt`, `idpUsername`, `deactivatedOn`,
`deactivatedBy`, `capabilities`. `notificationsOn` is what surface.yaml calls
`new_opportunity_notices_since`; `user.id` is its `user_identifier`.

**`current` passes the boundary.** The contract types every `{id}` as a UUID, but the service it
was recovered from answered `/api/sessions/current`, and surface.yaml names that address. The
boundary validator is told, for that one path and that one word, that `current` is also an
identifier (`withCurrentSession` in `app/backend/src/common/contract.ts`). Nothing else about
the contract is relaxed.

**Two response descriptions in the contract are read as written.** Two entries in
`openapi.yaml` (the 400 answers of the Sprint With Us and Team With Us individual evaluation
routes) are written `{ description: Refused, answered with the reasons keyed by what was wrong. }`.
YAML ends the value at the comma, the rest becomes a second, empty member, and the validator
rejects the whole document — which made every request answer 500, the slice 1 routes included.
`withResponsesAsWritten` joins the sentence back together when the contract is loaded. The
contract file itself is the spec stage's to correct; quoting the two descriptions fixes it.

**Who someone is comes from the token; what they may do comes from `users`** (0001, departure 2).
The account is found by the token's `preferred_username`, which the kept schema stores as both
`idpUsername` and `idpId`, among the account kinds the identity allows: a government identity
finds a `GOV` or `ADMIN` account, a vendor identity a `VENDOR` one. The kind of identity is the
token's `identity_provider` claim — `idir` for a government identity; `github` or any `bceid`
variant for a vendor. In the sandbox realm it is a user attribute put into the access token by a
mapper on the client, together with an audience mapper naming the client. The token must be an
access token (`typ` Bearer), signed by the realm's published keys, issued by the configured realm,
and issued to (`azp`) or meant for (`aud`) the client.

**Signing out** tells the service first (`DELETE /api/sessions/current`), which refuses every
token from that identity-provider session until the last of them would have expired (a token
naming no session, `sid`, stands for a session of its own by its `jti`). Then the page ends the
Keycloak session itself: a form `POST` to the realm's logout endpoint with `client_id` and the
refresh token, which a public client may make without a secret and which answers 204. Only when
both have answered is the person told they are signed out, so the success message is never on
screen while the identity provider still holds the session (R-4.17). If that `POST` is refused or
cannot be read, the browser drops its tokens and goes to Keycloak's end-session endpoint with the
ID token instead, and the screen stays at "Signing Out" until Keycloak returns it to `/sign-out`,
now as a visitor, to be told it is done. If the service cannot be told, nothing is signed out
and the screen says so. The list of sessions signed out of is held in memory: a
sandbox runs one backend. A person may end only their own session; any other identifier is
refused.

**The browser keeps its tokens in local storage** under one key, cleared on signing out and on a
refused sign-in. A reload or a new tab is then still signed in, which the acceptance suite's
page-by-page navigation needs; keycloak-js renews them from the refresh token on every start.
The trade-off is that script running in the page could read them. The app renders no markup it
did not write (0009), which is what keeps that from happening.

**The sandbox realm** carries every persona `spec/contract/personas.yaml` names, including the
three first-time identities (`first-time-gov`, `first-time-vendor`,
`first-time-vendor-no-email`), for which the seed holds no account. Its user profile makes the
email address optional and keeps unmanaged attributes, because Keycloak 26's default profile
requires an address and would stop a persona without one at an "update your account" page.
No identity-provider hint is sent in the sandbox, where the realm has no brokered providers; an
environment that has them sets `VITE_OIDC_IDP_HINT_VENDOR` and
`VITE_OIDC_IDP_HINT_PUBLIC_SECTOR` at build time, and `/auth/sign-in?provider=<name>` passes any
other name through as the hint.

**Finishing sign-up** is three tagged updates of one's own account, in this order:
`updateProfile` (name and email, R-4.27), `updateNotifications` only when the box is ticked
(R-4.24, R-6.20), then `acceptTerms` (R-4.3). Details first, so a refusal leaves the person on
the page with what they typed; terms last, because agreeing is what completes the profile. Until
it is complete, every screen except the completion page, signing out, the notices and the
service's own pages sends a vendor back to it.

## What is not built here

- The profile picture control is on the completion page, as the story draws it, but a picture
  cannot be stored until the file store exists (slice 3). Choosing one says it can be added from
  the profile afterwards.
- A person who deactivated their own account is refused at sign-in like any inactive account,
  until slice 3 builds deactivation and with it the reactivation R-4.5 describes.
- `PUT /api/users/{id}` accepts only the three tags above. The others (`updateCapabilities`,
  `reactivateUser`, `updateAdminPermissions`) are refused as "cannot be made here" until the
  slices that own them.
- `GET /api/users/{id}` and the profile screens are slice 3's.

## What would reverse it

- A ruling that the contract's `{id}` really is only ever a UUID. The single-page app would read
  its own session some other way, and the acceptance suite's `user-account-self-request` would
  need another address.
- A realm, in some environment, that names the kind of identity differently. The mapping in
  `app/backend/src/rules/users.ts` is the one place to change.
- A backend run as more than one instance: the signed-out sessions would have to be shared.
