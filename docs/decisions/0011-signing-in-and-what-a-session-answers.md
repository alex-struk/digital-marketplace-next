# 0011 · How signing in works in the build, and what a session and an account answer with

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

Slice 2 builds decision record 0004 as follows. Everything here is either left open by 0003,
0004 and 0010 or is a detail a later reader would otherwise have to reverse-engineer.

**PKCE from the browser, without a sign-in library.** The single-page app runs the
authorization-code flow with PKCE itself (`app/frontend/src/auth/pkce.ts`): a random verifier,
its SHA-256 challenge, a random state, the `kc_idp_hint` for the kind of identity chosen
(`github` for a vendor, `idir` for a public sector employee), and the code exchanged at the
realm's token endpoint by the browser. The plan proposed `keycloak-js`. It is not used, because
it keeps tokens in memory only, so every full page load — which is how the acceptance suite
moves between screens — would need another round trip to the identity provider. The flow is
about a hundred lines and uses only the browser's Web Crypto. No package was substituted, so
no dependency ruling is changed; `jose` (token checks) and `nodemailer` (SMTP) are used as the
plan proposed.

**Where the tokens live.** In the browser's local storage, so a person stays signed in across
reloads and tabs until they sign out. The access token is renewed with the refresh token when
it has less than thirty seconds left. The access token is also written to a cookie,
`dm_access_token`, with `Path=/api` and `SameSite=Strict`. The backend reads the
`Authorization` header first and that cookie second. The cookie is a second carrier of the same
bearer token, checked the same way: it lets a request the app cannot add a header to — a
plain link to a file, a request the acceptance suite makes with the browser's own cookies
after signing in through the screens — carry the person's identity. `SameSite=Strict` means no
other site can make the browser send it.

**Which account a token signs in as.** The token's `preferred_username` is the sign-in
username. Both `idpId` and `idpUsername` hold it, which is how the seed stores every account.
The token's `identity_provider` claim, put there by a mapper from the user attribute of the
same name, decides the kind: `idir` makes a public sector employee, `github` a vendor, and
anything else is refused (R-4.1). A government identity finds a `GOV` or an `ADMIN` account; a
code-hosting identity finds a `VENDOR` account. Authorization then reads the account's kind
and status from `users` on every request (0001, departure 2).

**The sandbox realm** (`app/compose/idp/realm-template.json`) was changed to match: vendors'
identity is `github` rather than `bceid`, which the spec does not name; it carries every
account the seed manifest names and every persona's username, including the three first-time
identities; the account with no email address has none; a declarative user profile requires no
attribute, so Keycloak never stops a person at sign-in to fill in a missing name or address;
and the client carries the identity-kind mapper and an audience mapper. Direct access grants
are enabled on the sandbox client so that an acceptance step calling `/api` directly can get a
token for a persona from the realm, as 0003 says it must. That is the identity provider
checking a password, not an entrance into the service, and it is in the sandbox realm only.

**What `GET /api/sessions/current` answers.** With no accepted token:
`{ "id": "current" }` — no account at all. With one: `{ "id": "<the identity provider's
session id>", "user": <User> }`, making the account on a first sign-in. It refuses with 403
and the one refusal shape (0010) an identity of no recognised kind, an account that is not
active, and a new account whose email address another account of its kind holds (R-4.1,
R-4.4, R-4.6). The single-page app turns any of those into the sign-in failure notice, having
ended the identity provider's session too, so the next attempt starts afresh.

**A `User`** is the kept `users` row less `idpId` and `createdAt`/`updatedAt`: `id`, `type`,
`status`, `name`, `email`, `jobTitle`, `avatarImageFile`, `notificationsOn`, `acceptedTermsAt`,
`lastAcceptedTermsAt`, `idpUsername`, `deactivatedOn`, `deactivatedBy`, `capabilities`, with
dates as ISO 8601 strings or null. `notificationsOn` is the moment notices were asked for,
which is what `user-account-self-request` reads.

**`current` as a session identifier.** The contract types every `{id}` as a UUID. The service
loads the contract once and, for `/api/sessions/{id}` only, accepts any string, because the
surface names `/api/sessions/current` (`app/backend/src/common/contract.ts`). The handler still
refuses any session but the requester's own.

**Mending the contract as it is loaded.** Some responses in `openapi.yaml` are one-line YAML
mappings whose description holds an unquoted comma, which YAML reads as a second, empty member.
The validator then rejects the whole document and every request fails. The loader puts the
sentence back together; nothing else about any response changes. The document itself is
another stage's and is not edited.

**Signing out** (R-4.17) asks the service to end the session first. The service remembers the
identity provider's session id until the last token from it expires and accepts no token from
it meanwhile — in memory, so a restart forgets, and those tokens expire within the realm's
token lifetime anyway. Then the browser drops its tokens and goes to the realm's end-session
endpoint, which sends it back to `/sign-out` to be told it has signed out.

## What slice 3 changes here

An account its owner deactivated is refused at sign-in for now, like any inactive account.
R-4.5 — letting it back in, reactivating it and telling the person so — is slice 3's, and
belongs at the marked place in `AccountsService.signIn`.

## What would reverse it

- A ruling that tokens must not be reachable from page script. Then the code exchange moves
  to the backend with an HTTP-only session cookie, which is a departure from the profile's
  PKCE rule that would need its own record.
- A realm that names identity kinds differently. `accountKindForIdentity` in
  `app/backend/src/rules/users.ts` is the one place that reads them.
