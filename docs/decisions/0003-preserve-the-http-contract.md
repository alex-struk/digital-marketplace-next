# 0003 · Preserve the recovered HTTP contract, minus its test-only entrances

- Status: proposed (G2)
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
