# 0001 · One TypeScript service serving the API and a React single-page application

- Status: proposed (G2)
- Date: 2026-09-19

## Decision

The rebuilt Digital Marketplace is a single deployable: one Node.js (22 LTS) process written in
TypeScript that answers every route family the contract names — the resource routes under `/api`,
the authentication routes under `/auth`, the administrator routes under `/admin`, and `/status` —
and serves a React 18 single-page application, built with Vite, for every other address.

- **Front end.** React 18 with `@bcgov/design-system-react-components` 0.8.1,
  `@bcgov/design-tokens` 5.0.0, `@bcgov/bc-sans` and `react-aria-components`, the exact set the
  design catalogue (`design/package.json`) was built and axe-scanned against. Each screen is built
  by copying the story for its state in `design/catalogue/`. Client-side routing follows the routes
  in `spec/contract/surface.yaml`, including the `?tab=` convention and `/users/me`.
- **Back end.** Fastify on Node.js, with request and response bodies validated against schemas
  derived from `spec/contract/openapi.yaml`. Database access through Knex, because the existing
  migration history (`src/migrations/tasks/*` in the old application) is a Knex history and
  continuing it is how an existing database upgrades in place (see 0002).
- **Shared code.** Validation rules and permission rules live in a shared package imported by both
  the service and the browser, so a rule the browser enforces is by construction the rule the
  service enforces. Several accepted criteria exist only because the old application let the two
  drift apart (R-3.18, R-4.18, R-4.19, R-5.9, R-5.14, R-1.56); a shared package is the structural
  answer to that class of defect.
- **Repository.** One repository with three workspaces: `app/server`, `app/web`, `app/shared`.

## Why

- The design stage already committed to React and the BC design system (constitution P2); a
  different front-end framework would throw the catalogue away.
- The acceptance suite and the observables act through the old application's HTTP contract
  (`/api/files`, `/api/contact-list`, `/api/counters`, `/status`, the export routes). Keeping one
  origin that answers both the API and the screens keeps that contract intact without a gateway.
- One process is the smallest thing that can be deployed to an OpenShift sandbox and demonstrated
  after the first slice; the service has no load profile that argues for splitting it.
- TypeScript on both sides matches the old application, which is the behavioural oracle
  (constitution J7), so a builder reading the old code to settle a question reads the same language.

## What would reverse it

- The pipeline declaring a different mandatory stack in `.sdlc/config.yaml` (this workspace carries
  no copy of it; the choice above is an assumption, see plan.md).
- A ruling that the HTTP contract need not be preserved, which would free the API shape (see 0003).
- The design system shipping for a framework other than React as its primary target.
