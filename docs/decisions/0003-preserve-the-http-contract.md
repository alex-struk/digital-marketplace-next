# 0003 · Preserve the recovered HTTP contract, minus its test-only entrances

- Status: proposed (G2), revised after the first G2 return (sign-in section added)
- Date: 2026-09-19

## Decision

The service answers the paths, methods and status codes recorded in
`spec/contract/openapi.yaml`, with the same resource shapes (including the tagged-action body every
update route takes), so that the acceptance suite and the
observables in `spec/contract/observables.yaml` can act against the rebuilt target exactly as they
act against the oracle. Where a criterion changes an answer — a refusal now reported as a bad
request rather than a fault (R-8.18, R-8.23, R-8.24), a permission refusal reported in one shape
for every page request (R-7.16), the organizations-on-behalf-of list refused rather than empty for
non-vendors (R-3.20), the user list refused to non-administrators (R-4.21) — the criterion wins and
the contract document is out of date on that point; the builder records each such change in the
slice that makes it.

Three operations in the contract are **not** built: `/auth/createsessionadmin`,
`/auth/createsessiongov` and `/auth/createsessionvendor/{id}`. They mint a session without the
identity provider and exist only for tests, which constitution J3 forbids. Tests sign in through
the sandbox identity provider instead (see 0004).

**How sign-in changes the contract.** The stack profile has the single-page app sign in with PKCE
(0001, 0004), so three of the contract's authentication answers change form while keeping their
addresses:

- `/auth/sign-in` and `/auth/callback` are screens of the single-page app, not backend routes.
  `/auth/sign-in` still sends the browser to the identity provider with the provider hint and the
  return address. `/auth/callback` still finishes sign-in and ends on the dashboard, profile
  completion or the sign-in failure notice. The code is exchanged by the browser, not the backend.
- `GET /api/sessions/current` is the backend's side of the callback. On the first call for a token
  it creates the account (R-4.1), reactivates an account the person deactivated themselves, and
  refuses one an administrator deactivated (R-4.4). `DELETE /api/sessions/current` is sign-out.
  The existing `sessions` table is kept (J5) but the rebuild does not write to it.
- Every other `/api` route authenticates by a bearer token, not by a cookie. A test that signs in
  through the browser and then acts through the screens sees no difference. A test that calls
  `/api` directly must present a token for the persona it acts as, which it can get from the
  sandbox realm. File downloads and printable exports that the old application reached by a plain
  link are fetched by the single-page app with the token and handed to the browser.

The acceptance-suite author needs the last point before writing API-level steps, so plan.md lists
it for ruling.

Refusals share one error body across every route: a status code, and a map from field name (or
`permissions`, or `request`) to a list of messages. The contract document records status codes but
no error-body schema, so this shape is the rebuild's choice, taken from how the old application
answers (the oracle can confirm it). One shape everywhere is what lets R-7.16 — a permission
refusal reported as such, in the same form for every page request — be met by distinguishing the
status and the key rather than by a second format.

## Why

- The acceptance suite is written against a contract, in a workspace that cannot see the
  implementation (P7). Changing the contract would force that suite to be rewritten before it
  could say anything about the rebuild.
- Several criteria are about the form of an answer rather than any screen (observables.yaml,
  `refusals`), so the answer's shape is part of the requirement.

## What would reverse it

- A ruling that the acceptance suite acts only through screens, which would make the API an
  internal detail and free its shape.
- A decision to version the API; then this record would govern v1 only.
