---
name: stack-openshift-ts
description: Coding, testing, auth and deploy standards for the openshift-ts stack profile, built on bcgov/quickstart-openshift (React/Vite/TanStack Router frontend, NestJS/Prisma/Postgres backend, Keycloak OIDC, OpenAPI-first APIs).
# What this stack's toolchain generates. `init` adds these to the project's `.gitignore`,
# so compiled output never reaches a proposal — where it is not evidence, and where it is
# large enough to crowd the code out of the diff a gate is ruled on.
ignore:
  - "app/*/dist/"
  - "app/frontend/.vite/"
# What this stack's toolchain writes and the project commits: a resolved dependency tree
# and the API client generated from the contract. They belong in the repository and they
# are never evidence about a change, so they are left out of the diff a gate is ruled on,
# where one of them can be larger than the whole prompt budget.
bulk:
  - "app/package-lock.json"
  - "app/*/package-lock.json"
  - "app/frontend/src/api/contract.d.ts"
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
- Every host port `app/compose/compose.yaml` publishes is read from a variable
  that defaults to the port it publishes today, and so is every address that
  names one of those ports: `"${SDLC_APP_PORT:-4300}:3000"`, an issuer of
  `http://localhost:${SDLC_IDP_PORT:-8080}/realms/...`, an application origin of
  `http://localhost:${SDLC_APP_PORT:-4300}`, and the identity provider's allowed
  redirect addresses rendered from the same variable. An address the frontend
  bakes in at build time reaches it as a build argument that reads the same
  variable. The pipeline starts several copies of the application side by side,
  each with its own variables, to run the acceptance suite in parallel; with
  none set, the sandbox is exactly what it was (`docs/decisions/0090`).
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
