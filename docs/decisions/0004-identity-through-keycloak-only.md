# 0004 · Every session comes from Keycloak; the first administrator comes from seed data

- Status: proposed (G2)
- Date: 2026-09-19

## Decision

Sign-in is OpenID Connect against Keycloak (constitution J5), using the authorization-code flow
from the service's `/auth/sign-in` and `/auth/callback` routes. The identity-provider hint decides
the account kind on first sign-in: a government identity (IDIR) makes a public sector employee, a
code-hosting identity (GitHub) makes a vendor (R-4.1). Sessions are server-side, held in the
existing sessions table, and carried by an HTTP-only, secure, same-site cookie. Signing out ends
the service session and then the Keycloak session through its end-session endpoint (R-4.17).

In every sandbox environment the identity provider is a Keycloak realm seeded with synthetic
accounts whose usernames are the persona usernames in `spec/contract/personas.yaml`
(`test-admin`, `test-gov`, `test-vendor-<n>`, and the further public sector identities the
evaluation personas need). No route in the application creates a session any other way (J3,
and the ruling recorded against D-users-29).

The first administrator is made the way R-4.13 says it must be: not through the service. The
sandbox seed writes the `test-admin` account with the administrator kind directly into the data.
The service gains no bootstrap route, flag or environment switch that grants administrator rights.

## Why

- J3 forbids test-only entrances, and the old application's session routes also skipped the
  account-status check, which made R-4.4 (an account an administrator deactivated cannot sign in)
  untestable. Signing in through a real identity provider is what makes that criterion observable.
- R-4.13 is accepted as written: an administrator can only be made by another administrator.
  Seeding the first one in data honours it; a bootstrap route would contradict it.

## What would reverse it

- The platform providing a different sanctioned identity broker for sandboxes (the realm seeding
  would move there; the application would not change).
- An amendment to R-4.13 asking for a first-administrator procedure inside the service.
