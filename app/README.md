# The application

The rebuilt Digital Marketplace. Three workspaces and the things that run them on one
machine.

| Where | What |
| --- | --- |
| `frontend/` | the React single-page app (Vite, TanStack Router), every screen built from its story in `design/catalogue/`, and the web server in front of it that makes one origin |
| `backend/` | the NestJS service: the recovered contract at `spec/contract/openapi.yaml`, validated at one boundary, over the kept schema through Prisma |
| `backend/src/rules/` | the validation and permission rules, as plain TypeScript with no framework in them. Both sides call these; the frontend imports the directory as `@rules` |
| `migrations/` | the kept schema's Knex history, and the seed |
| `compose/` | PostgreSQL, a sandbox identity provider and a mail catcher, for a builder's machine only |

## Checking it

```sh
npm --prefix app run check      # typechecks and runs the unit tests of every workspace
```

Nothing in `check` needs a database, a container or a network. The tests that exercise the
schema run PostgreSQL in process (PGlite), so the migration history and the acceptance
suite's own seed files are really applied.

## Running it

```sh
SDLC_SANDBOX_PASSWORD=... docker compose -f app/compose/compose.yaml up --build
```

The application answers on <http://localhost:4300>. The identity provider is on :8080 and
the mail catcher on :8025. Every account `tests/seed/manifest.yaml` names signs in at the
identity provider with its `idp_id` as username and that password; the password is read from
the environment and is written into no file here.

The schema is brought up to date by the `migrate` service before the service starts. To put
the data back to the state `tests/seed/manifest.yaml` describes — wiping whatever is there
first, so running it twice leaves the same data:

```sh
SDLC_SANDBOX_PASSWORD=... docker compose -f app/compose/compose.yaml up seed
```

`seed` is asked for by name and so does not run with the rest of the application; it drops
the schema, which is only ever a thing to do to a sandbox.

On a builder's machine without containers:

```sh
npm --prefix app/backend run build && npm --prefix app/backend start   # :3001
npm --prefix app/frontend run dev                                      # :4300, forwards /api
```

## Two things to know before changing it

- **The contract comes first.** `spec/contract/openapi.yaml` is the API surface. The
  frontend's client is generated from it (`npm run generate:api --workspace frontend`, which
  writes `frontend/src/api/contract.d.ts`); the backend validates every request against it in
  one place. Neither side writes an address the contract does not carry.
- **Knex owns the schema; Prisma only reads it.** `prisma/schema.prisma` is introspected
  (`npm run db:pull --workspace backend`) from a migrated database, never authored ahead of
  one. Decision records 0001, 0002 and 0007 are why.
