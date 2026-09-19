# 0001 · Build on the openshift-ts stack profile, with two recorded departures

- Status: proposed (G2), revised after the first G2 return
- Date: 2026-09-19
- Supersedes: the first version of this record, which chose Fastify, Knex for all data access, an
  `app/server`/`app/web`/`app/shared` layout and a server-side sign-in flow without acknowledging
  the stack profile. That version was wrong to do so and is withdrawn in full.

## Decision

The project's `.sdlc/config.yaml` sets `stack: openshift-ts`. Its profile
(`.claude/skills/stack-openshift-ts/SKILL.md`, built on `bcgov/quickstart-openshift`) is the
basis of this plan, and it is adopted as written except for the two departures recorded below.

What the profile fixes, and how the plan takes each:

| Profile requirement | Taken as |
| --- | --- |
| Backend: NestJS, Prisma, PostgreSQL | NestJS on Node.js. Prisma is the data-access layer; its schema is introspected from the kept PostgreSQL schema (`prisma db pull`), never authored ahead of it (0002). |
| Frontend: React, Vite, TanStack Router | React 18 with Vite and TanStack Router. Routes follow `spec/contract/surface.yaml`, including `/users/me` and the `?tab=` sections as typed search parameters. |
| Layout: `app/frontend`, `app/backend`, `app/migrations`; local services in `app/compose/` | Exactly that. `app/compose/` holds PostgreSQL, a sandbox Keycloak realm seeded with the persona usernames, and Mailpit, and no deploy workflow refers to it. |
| OpenAPI first; generated clients; validation at the boundary | `spec/contract/openapi.yaml` is the API source (0003). The frontend's client is generated from it; the backend validates every request and response against it in one boundary layer. |
| Keycloak OIDC; PKCE from the single-page app; no client secret in frontend code | Adopted (0004). The sign-in and callback addresses become screens of the single-page app; the backend accepts bearer tokens and validates them against the realm's keys. |
| Authorize by roles in token claims, no second role store | **Departure 2**, below. |
| Vitest at module boundaries; Playwright by role and label; test IDs from `surface.yaml` | Adopted. |
| WCAG 2.1 AA; Grade 8 copy | Adopted (constitution P1). |
| Deploy through pinned `bcgov/quickstart-openshift-helpers` reusable workflows; no production route | Adopted (0006). |

**Shared rules without a third package.** The first version put the validation and permission rules
in an `app/shared` workspace. That is a layout the profile does not have, so the rules instead live
in `app/backend/src/rules/` as plain TypeScript with no NestJS, Prisma or Node dependency, and the
frontend imports that one directory by a path alias. The reason for having one copy is unchanged:
several accepted criteria exist only because the old browser and the old service disagreed about a
rule (R-3.18, R-4.18, R-4.19, R-5.9, R-5.14, R-1.56), and one function both sides call stops that
from happening again. This is not a departure — the code sits inside `app/backend` — but it is
recorded here so that nobody reads the frontend's import of a backend directory as an accident.

**One origin.** The frontend and backend are two containers, as the quickstart scaffolds them. The
frontend container's web server serves the single-page app and forwards `/api/*`, `/status` and
`/admin/*` to the backend Service, so a browser and the acceptance suite see one origin. This keeps
the recovered contract's addresses intact (0003) without a gateway.

### Departure 1 — schema migrations are run by Knex, not Prisma Migrate

Prisma reads and writes the data. The schema's history is continued with Knex: the old
application's migration files are carried into `app/migrations/` unchanged, the rebuild's three
migrations (0002) are appended after them, and `knex migrate:latest` is the only command that
changes the schema, run by the deploy before the backend starts. Prisma Migrate is never run.

Why:

- Constitution J5 keeps the existing PostgreSQL schema. The old application's database records its
  history in Knex's own `knex_migrations` table. Continuing that history is how a database the old
  application left behind upgrades in place, with no step beyond "run the migrations".
- Prisma Migrate would need a baseline migration marked as applied by hand on every existing
  database, and it would add its own `_prisma_migrations` table to the kept schema. Both are
  avoidable, and the second is arguably the kind of schema change J5 rules out.
- The departure is narrow: one command-line tool, used by one deploy step and by developers. No
  request-handling code imports it.

What would reverse it: a ruling that adding the `_prisma_migrations` bookkeeping table is
acceptable under J5, and that a one-time manual baseline is acceptable for any database the old
application left behind. Then the history would be squashed into a baseline and Prisma Migrate
would take over. Knex is **not** in the pipeline's dependency register. Its use is listed for the
tech lead's ruling in plan.md.

### Departure 2 — account kind and administrator rights are read from the service's own data, not from token claims

The backend authenticates every request by the Keycloak token. It authorizes by the account's
kind — vendor, public sector employee or administrator — and status as the `users` table records
them. It does not use realm roles in the token.

Why:

- Accepted criteria make administrator rights something an administrator grants and removes
  **inside the service** (R-4.19, R-4.20), and require the first administrator to be made outside
  it (R-4.13). The kept schema (J5) stores that decision in the `users` table, and the old
  application's data already holds it there.
- To carry it in token claims, the service would have to write realm roles through Keycloak's admin
  API every time an administrator changes someone's rights. The realm is platform infrastructure
  this project does not operate (J2). Then there would be two stores to keep in step — the exact
  thing the profile rule exists to prevent — with the realm as a copy of the table.
- The account kind is also fixed at first sign-in by which identity provider the person came
  through (R-4.1). That is read from the token's identity-provider claim once and stored.
  Deactivation, which also lives in the table, must stop an account whose token is still valid
  (R-4.4). Only a per-request look-up does that.

What would reverse it: the platform offering a way for the service to manage realm roles for its
own client, and a ruling that the realm, not the table, is where administrator rights live. The
`users.type` column would then become a cache of the claim.

## Why this stack at all

The pipeline chose it (constitution J2: "rebuilding the application on the pipeline's stack"). It
also suits the work. The design catalogue is React on the BC design system (P2), so the screens
carry over story by story. TypeScript on both sides matches the old application, which is the
behavioural oracle (J7).

## What would reverse the whole record

- The project's `.sdlc/config.yaml` naming a different stack profile.
- A change to the openshift-ts profile that removes a requirement this record relies on or departs
  from.
