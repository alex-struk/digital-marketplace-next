---
name: stack-openshift-ts
description: Coding, testing, auth and deploy standards for the openshift-ts stack profile, built on bcgov/quickstart-openshift (React/Vite/TanStack Router frontend, NestJS/Prisma/Postgres backend, Keycloak OIDC, OpenAPI-first APIs).
---

## Use when

- The project's `.sdlc/config.yaml` sets `stack: openshift-ts`.
  Source: convention

## Don't use when

- The project targets a different scaffold, a different deploy target than
  OpenShift, or a non-TypeScript stack.
  Source: convention

## Layout

- Frontend code lives under `app/frontend`, backend code under
  `app/backend`, and schema and migration artifacts under `app/migrations`.
  Source: convention
- Local-only services — Postgres, a sandbox Keycloak realm, and Mailpit (a
  mail catcher) — are declared in `app/compose/` and are never referenced
  from a deploy or production workflow.
  Source: convention

## Naming

- Follow the file and module naming conventions in
  `rloisell/rl-project-template` as the default; do not introduce a second
  convention alongside it.
  Source: rloisell/rl-project-template

## Errors and logging

- Log structured entries (one JSON object per line), and put no personal
  data in any log field, per constitution P3.
  Source: bcgov/agent-instructions

## API

- OpenAPI first: `spec/contract/openapi.yaml` is the source of the API
  surface, not the handler code.
  Source: convention
- Generate API clients from the contract; do not hand-write request or
  response types that duplicate it.
  Source: bcgov/agent-instructions
- Validate every request and response at the boundary against the contract;
  do not rely on hand-checked shapes deeper in the code.
  Source: bcgov/agent-instructions

## Auth

- Authenticate through Keycloak using OpenID Connect.
  Source: convention
- The single-page app uses the PKCE flow; no client secret is embedded in
  frontend code.
  Source: bcgov/agent-instructions
- Authorize by roles carried in token claims, not by a second, separately
  maintained role store.
  Source: bcgov/agent-instructions
- Tests run against a sandbox Keycloak realm, never the production realm.
  Source: convention

## Testing

- Unit test at module boundaries with Vitest.
  Source: bcgov/agent-instructions
- Write acceptance tests only from the spec, never from the implementation.
  Source: convention
- Choose Playwright locators by role and accessible label, not by CSS class
  or DOM structure.
  Source: bcgov/design-system
- Test IDs come from `spec/contract/surface.yaml`; do not invent ad hoc ids
  in component code.
  Source: convention

## Accessibility and plain language

- Meet WCAG 2.1 Level AA on every user-facing screen.
  Source: bcgov/design-system
- Write user-facing copy at a Grade 8 reading level.
  Source: bcgov/agent-instructions

## Deploy

- Deploy through the `bcgov/quickstart-openshift-helpers` reusable
  workflows, referenced by a pinned, versioned commit.
  Source: convention
- No project workflow defines a route to a production namespace.
  Source: convention
