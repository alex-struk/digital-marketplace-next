# The application

The rebuilt Digital Marketplace. Three workspaces and the things that run them on one
machine.

| Where | What |
| --- | --- |
| `frontend/` | the React single-page app (Vite, TanStack Router), every screen built from its story in `design/catalogue/`, and the web server in front of it that makes one origin |
| `backend/` | the NestJS service: the recovered contract at `spec/contract/openapi.yaml`, validated at one boundary, over the kept schema through Prisma |
| `backend/src/rules/` | the validation and permission rules, as plain TypeScript with no framework in them. Both sides call these; the frontend imports the directory as `@rules` |
| `migrations/` | the kept schema's Knex history, and the seed |
| `compose/` | PostgreSQL, a sandbox identity provider, a mail catcher behind a delay proxy, for a builder's machine only |

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
the environment and is written into no file here. So do the first-time identities
`spec/contract/personas.yaml` names, which have no account until they sign in.

Signing in begins and ends at the service: `/auth/sign-in` sends the browser to the identity
provider, and `/auth/callback` makes the account on a first sign-in, then redirects to the landing
page with the tokens (decision record 0015). The web server in front of the app forwards `/auth`
there, as it does `/api`. The callback also sets an `HttpOnly` session cookie, so a request to
`/api` from the same browser that carries no bearer token is still answered for the person who
signed in, until they sign out (decision record 0017).

The browser keeps only the tokens, in local storage, and they count only while its `dm-signed-in`
cookie is there too, so a browser whose cookies are cleared is signed out (decision record
0020). The account is read from `GET /api/sessions/current` on every
visit. Signing out is one request, `DELETE /api/sessions/current`, which ends both the service's
session and the identity provider's. The `/sign-out` page makes that request once it is drawn,
and it says how signing out went once the service has answered (decision record 0018).

Every message the service sends is marked as a test and comes from
`Digital Marketplace <donotreply@example.test>` (decision record 0013). Start with
`SDLC_ORACLE_DISABLE_NOTIFICATIONS=1` in the environment to switch all mail off (R-6.1).

The service sends its mail through a delay proxy (Toxiproxy, `mail-hold`) to the catcher, and
:8025 is a small reverse proxy (Caddy, `mail-front`) in front of both: the catcher's own
interface and API at the root, including its fault injection, and the proxy's control API under
`/hold` — `GET /hold/proxies/smtp/toxics` reads it, `POST` there adds a toxic, `DELETE
/hold/proxies/smtp/toxics/hold` removes it, `POST /hold/reset` clears them all. With no toxic in
force mail passes unchanged (decision record 0028, for R-6.24).

Uploads (`POST /api/files`, `POST /api/avatars`) are read by their handler rather than by the
boundary validator, written to the working directory `FILE_UPLOADS_DIR` (a tmpfs in compose, the
backend's `emptyDir` volume in a sandbox) and removed once answered; the bytes are kept in the
database, once per distinct content (decision record 0021). A service that cannot make that
directory does not start.

## The service's own pages

Anybody reads a page at `/content/<address>`. An administrator manages them from "Content" in
the navigation menu: the list at `/content`, a new page at `/content/create`, and each page's
managing screen at `/content/<address>/edit`. Everybody else is shown the not-found screen
there, and every page request they make is refused 401 in one shape (decision record 0025).
A page the service needs can be re-worded but neither moved nor removed. An image inserted
into a body is stored readable by anyone and referred to as `@file/<identifier>`, which the
renderer turns into the file's address only when the text is shown.

## Changed terms

The managing screen of `/content/terms-and-conditions` is the only one that offers "Notify vendors
of updated terms". When an administrator confirms it, the screen calls `POST /api/emailNotifications`
(`updateTerms`). That withdraws every vendor's standing acceptance, answers, and then emails each
active vendor, one message each. A vendor sees the warning on their own legal section
(`/users/me?tab=legal`) and agrees again from there (decision record 0027).

## Code With Us opportunities

Public sector staff and administrators start at `/opportunities/create`, choose a program, and
write a Code With Us opportunity at `/opportunities/code-with-us/create`. A draft saves whatever it
holds; a staff member submits it for review, and only an administrator publishes, from a draft or
from review. The dashboard at `/dashboard` lists a staff member's own opportunities, and every
opportunity to an administrator, each linking to where it is managed. Each one is
managed at `/opportunities/code-with-us/<id>/edit` (summary, the opportunity in its form, history)
and read by anyone at `/opportunities/code-with-us/<id>` once published. Every save is a new
version. The states and permitted changes of all three programs, and who may do what, are in
`backend/src/rules/opportunities.ts`; the service's answers and refusals are decision record 0029.
Submitting for review emails every administrator, publishing emails everyone with new-opportunity
notices on, each in batches of `MAILER_BATCH_SIZE` (50) blind copies, and both confirm to the
author.

## Finding and following opportunities

Anybody browses at `/opportunities` ("Browse opportunities" on the home page). The list reads all
three programs and shows what the service lets the person read — published opportunities, and to
staff their own unpublished ones and to administrators every one — grouped into unpublished, open
and closed, narrowed by program, state, remote work and words in the title or location. The rules
for that are `backend/src/rules/opportunity-list.ts`, shared by the screen and the service.

A signed-in person watches an opportunity they did not create from its card or its page
(`/api/subscribers/<program>`), and turns the new-opportunity emails on or off from the control at
the top of the list, which saves at once. Opening a Code With Us opportunity's page counts a view
(`PUT /api/counters/opportunity.code-with-us.<id>.views`); counts are read at
`GET /api/counters?counters=<name>`. The home page's awarded figures come from `/api/metrics`.
Decision record 0034 has the answers and refusals.

## The first administrator

The service offers no way to make the first administrator (R-4.13). An administrator is made
only by another administrator, who ticks Administrator on a public sector employee's profile;
a vendor can never be one (R-4.12). Where no administrator exists, the one route is to change
the stored account kind directly, outside the service:

1. Have the person sign in once with their government identity, so that the service makes a
   public sector employee account for them.
2. With a connection to the database, change that account's kind:

   ```sql
   UPDATE "users" SET "type" = 'ADMIN', "updatedAt" = now()
   WHERE "type" = 'GOV' AND "idpUsername" = '<their sign-in username>';
   ```

3. They are an administrator from their next request; they need not sign in again.

The sandbox needs none of this: the seed writes the first administrator straight into the data
(`users.administratorOne` in `tests/seed/manifest.yaml`, signing in as `test-admin`).

## Resetting the data

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
