# 0004 · Every sign-in comes from Keycloak by PKCE; the first administrator comes from seed data

- Status: proposed (G2), revised after the first G2 return to follow the stack profile's sign-in flow
- Date: 2026-09-19

## Decision

Sign-in is OpenID Connect against Keycloak (constitution J5), using the authorization-code flow
with PKCE from the single-page app, as the openshift-ts profile requires. The Keycloak client is
public: no client secret appears in frontend code or configuration. The `/auth/sign-in` and
`/auth/callback` addresses are screens of the single-page app (0003). The first sends the browser
to Keycloak with the identity-provider hint and the return address (R-4.3). The second exchanges
the code, then calls `GET /api/sessions/current`.

The backend accepts the access token as a bearer token on every `/api` route and checks it against
the realm's published keys, issuer and audience. On the first call for a person, it creates the
account and sets its kind from the token's identity-provider claim: a government identity (IDIR)
makes a public sector employee, and a code-hosting identity (GitHub) makes a vendor (R-4.1). On
every call it loads the account and refuses one an administrator has deactivated, even while the
token is still valid (R-4.4). A person who deactivated their own account is reactivated on their
next sign-in (R-4.5). Signing out discards the tokens in the browser and ends the Keycloak session
through its end-session endpoint (R-4.17).

Authorization uses the account's kind and status as the `users` table records them, not realm
roles in the token. That is a departure from the profile, recorded with its reasons in 0001
(departure 2).

In every sandbox environment the identity provider is a Keycloak realm seeded with synthetic
accounts. Their usernames are the persona usernames in `spec/contract/personas.yaml` (`test-admin`,
`test-gov`, `test-vendor-<n>`, and the further public sector identities the evaluation personas
need). Locally, the same realm export is loaded by `app/compose/`. No route in the application
creates a session or accepts an identity any other way (J3, and the ruling recorded against
D-users-29).

The first administrator is made the way R-4.13 says it must be: not through the service. The
sandbox seed writes the `test-admin` account with the administrator kind directly into the data.
The service gains no bootstrap route, flag or environment switch that grants administrator rights.

## Why

- The profile requires PKCE from the single-page app, and nothing in the accepted criteria needs a
  server-held session. What the criteria need is a refusal for a deactivated account, a return to
  the page where sign-in began, and sign-out from both the service and the identity provider. The
  flow above gives all three.
- J3 forbids test-only entrances. The old application's session routes also skipped the
  account-status check, so R-4.4 could not be tested. Signing in through a real identity provider
  makes that criterion observable.
- R-4.13 is accepted as written: only another administrator can make an administrator. Seeding the
  first one in the data honours that. A bootstrap route would contradict it.

## Consequences

- Links that the old application followed with a cookie — file downloads and the printable and
  exported proposals — carry no token when followed as plain links. The single-page app fetches
  them with the token and hands the result to the browser (0003).
- Acceptance steps that call `/api` directly must present a token from the sandbox realm (0003).

## What would reverse it

- The platform providing a different sanctioned identity broker for sandboxes. The realm seeding
  would move there, and the application would not change.
- An amendment to R-4.13 asking for a first-administrator procedure inside the service.
- A ruling that the contract's cookie session must be kept word for word. That would need a
  recorded departure from the profile's PKCE rule, with a backend-held code exchange.
