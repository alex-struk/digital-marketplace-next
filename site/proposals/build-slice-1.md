| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-20T22:28:57.949Z |
| holder | agent:reviewer |

# Does slice 1 (A visitor can read the service's own pages) do what its criteria say?

**Recommendation.** **What is there now.** `app/` holds four things that did not exist before: `app/frontend` (React 18, Vite, TanStack Router, the BC design system at the versions the catalogue pinned), `app/backend` (N…

Slice 1 is built and green: `npm --prefix app run check` passes from a clean `npm ci` — 86 unit tests across the three workspaces, all typechecks clean.

---

## Journal — Slice 1: a visitor can read the service's own pages

**What is there now.** `app/` holds four things that did not exist before: `app/frontend` (React 18, Vite, TanStack Router, the BC design system at the versions the catalogue pinned), `app/backend` (NestJS over Prisma, with the validation rules in `src/rules/` as plain TypeScript both sides can call), `app/migrations` (the kept schema's Knex history and the seed), and `app/compose` (PostgreSQL, a sandbox Keycloak realm carrying every account the seed manifest names, Mailpit, a one-shot `migrate` and a one-shot `seed`). The frontend container's Caddy serves the single-page app and forwards `/api`, `/status` and `/admin` to the service, so there is one origin on port 3000.

**How each criterion is reached.** A page is read at `/content/:slug`, which asks `GET /api/content/{id}`; the service reads the value as an identifier first and as an address second, so a page whose address happens to look like an identifier is still reachable by it (R-7.4), answers with the page flattened over its current version — title, body, first-published and last-updated dates (R-7.1) — or as not found (R-7.2), or refuses it as malformed when the value is neither a well-formed identifier nor a well-formed address (R-7.3). The screen shows the not-found page for both refusals, as a person sees them. The body is turned into elements by the application's one renderer, which has no node for raw markup at all, so embedded markup comes out as the words it is and the same body reads identically wherever another screen embeds it (R-7.17). The footer sits under every screen with its five links (R-7.19), each of which resolves because the migration creates those pages; the three learn-more screens each offer the service level agreement, and that page is created too (R-7.18). A fresh installation carries sixteen pages the service needs, each titled by its own address with the body "Initial version" and no author (R-7.12).

**What I tested.** The rules about addresses and identifiers; the lookup order, including the fallback; the shape a page and a refusal come back as; the formatted-text renderer against scripts, elements, `javascript:` links and heading outlines; the footer's five links and the agreement link on all three programs. Two tests matter more than the rest. One runs the whole migration history against a real PostgreSQL engine in process and then applies all seven of the acceptance suite's seed files in order — they all apply, which is the strongest evidence available here that the schema is the shape the seed expects. The other starts the service exactly as `main.ts` starts it, over that database, and asks it questions over HTTP. That second test caught a real defect: an options argument I added to the database service for testability broke the service's own dependency wiring, and nothing below the HTTP level would have noticed. An accessibility pass over each screen's real markup runs in the frontend tests; it found a heading-outline gap in the renderer, which is fixed — a body's shallowest heading now becomes H2 whatever the author wrote.

**What I could not build as written.** Three things, each recorded as a decision record.

The slice was to be deployed to the OpenShift sandbox by the pinned helper workflows. Workflows and charts live outside `app/` and `docs/decisions/`, which are the only paths I may write, so **nothing is deployed and no workflow exists**. The Dockerfiles those workflows consume are written and are the inputs they need; the build context is the repository root, because the contract the service validates against lives in `spec/`. Whoever owns the root should add a `.dockerignore` there, or every build will ship `node_modules` as context.

The old application's Knex migration files were to be carried over unchanged. **They are not in this workspace** — no `sources/old/` — so the schema is one reconstructed baseline instead, built from what the seed files fix and what the contract and domain files describe (0007). The consequence that matters: a database the old application left behind will not upgrade in place, which was the whole reason 0002 wanted the history continued. A fresh sandbox database is unaffected. Names the seed does not fix are the rebuild's own and are flagged there, including the five service-area names.

The formatted-text renderer was to match the old application's, so pages keep their meaning. **It cannot, for the same reason** — there is nothing to match against (0009). I chose a parser that cannot emit markup over a library plus a sanitiser, so R-7.17 holds by construction rather than by a filter list being complete; the cost is that a mark this parser does not know reads as its own source.

**Two things a reader should rule on.** R-7.12's then-clause says twenty-two pages are listed; the plan, following the ruling against D-content-27 and adding the agreement page, gives sixteen, and that is what the migration creates. A test that counts pages will find sixteen. Separately, `tests/seed/manifest.yaml` and `003-content.sql` both say nineteen — neither number. Nothing in the seed depends on it, but three documents disagree and someone should settle it (0008). Also unsettled: the addresses of the six program pages are mine, following the naming the organization terms routes use, and the slice that first embeds one should confirm them.

**What the next slice will find missing.** No sign-in, so no account, no session and no bearer-token check — the banner names the service and carries a skip link and nothing else, because the navigation menu has nobody to offer anything to. No mail is sent; Mailpit is there and unused. The home page is the shell: its awarded figures belong to the domain that counts them. The deadline hook in front of `/api` and `/status` is not built. `prisma/schema.prisma` holds only the two models this slice reads, and is regenerated by `npm run db:pull --workspace backend` against a migrated database. The baseline holds the thirty-six tables the seed needs; stored files, attachments, addenda, notes, subscriptions, counters and the evaluation tables are not in it, and each should arrive as a migration appended to this history by the slice that first reads or writes it.

## Fix turn

A clean `rm -rf node_modules && npm install && npm run check` now passes: three typechecks and 86 unit tests across the three workspaces.

**Journal addition.** The install failure was the backend's `postinstall: "prisma generate"` running through the `prisma` link npm drops in `node_modules/.bin`. npm creates that link as a symlink where the filesystem supports one and as a plain copy of `prisma/build/index.js` where it does not; the checking machine got the copy. Prisma's CLI loads its WebAssembly modules from `__dirname`, so under a copied link it looked for `prisma_schema_build_bg.wasm` in `node_modules/.bin` and died with ENOENT before `npm install` could finish. I reproduced the failure exactly — same file offsets in the stack — by copying `build/index.js` into `.bin` in this workspace, which confirmed the bin-link shape as the cause rather than a missing or corrupt dependency. The fix is `app/backend/scripts/prisma.mjs`, which resolves `prisma/build/index.js` through `createRequire` and spawns that path directly, so `__dirname` stays inside `node_modules/prisma/build` on either kind of filesystem; `postinstall` and `db:pull` now call it instead of the bare `prisma` binary. I also added a `COPY app/backend/scripts backend/scripts` line ahead of `npm ci` in `app/backend/Dockerfile`, since the image build runs that same postinstall and would otherwise not have the runner on disk yet (the frontend image installs with `--ignore-scripts` and needed nothing). I verified the postinstall succeeds with `.bin/prisma` deliberately replaced by a copy, then restored a normal install. Nothing else in the slice changed.

npm install in app/ failed:
npm error
npm error Error: ENOENT: no such file or directory, open '/home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/prisma_schema_build_bg.wasm'
npm error     at Object.openSync (node:fs:561:18)
npm error     at Object.readFileSync (node:fs:445:35)
npm error     at /home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/prisma:49:9832
npm error     at /home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/prisma:2:263
npm error     at Object.<anonymous> (/home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/prisma:259:154)
npm error     at Module._compile (node:internal/modules/cjs/loader:1854:14)
npm error     at Object..js (node:internal/modules/cjs/loader:1985:10)
npm error     at Module.load (node:internal/modules/cjs/loader:1577:32)
npm error     at Module._load (node:internal/modules/cjs/loader:1379:12)
npm error     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19) {
npm error   errno: -2,
npm error   code: 'ENOENT',
npm error   syscall: 'open',
npm error   path: '/home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/prisma_schema_build_bg.wasm'
npm error }
npm error
npm error Node.js v24.16.0
npm error A complete log of this run can be found in: /home/alstruk/.npm/_logs/2026-09-20T22_03_55_913Z-debug-0.log
npm --prefix app run check failed:
Node.js v24.16.0
npm error Lifecycle script `typecheck` failed with error:
npm error code 1
npm error path /home/alstruk/GitHub/digital-marketplace-next/app/backend
npm error workspace @digital-marketplace/backend@0.1.0
npm error location /home/alstruk/GitHub/digital-marketplace-next/app/backend
npm error command failed
npm error command sh -c tsc --noEmit -p tsconfig.json

node:internal/modules/cjs/loader:1503
  throw err;
  ^

Error: Cannot find module '../lib/tsc.js'
Require stack:
- /home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/tsc
    at Module._resolveFilename (node:internal/modules/cjs/loader:1500:15)
    at wrapResolveFilename (node:internal/modules/cjs/loader:1071:27)
    at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1095:10)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1116:12)
    at Module._load (node:internal/modules/cjs/loader:1285:25)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.require (node:internal/modules/cjs/loader:1600:12)
    at require (node:internal/modules/helpers:153:16)
    at Object.<anonymous> (/home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/tsc:2:1)
    at Module._compile (node:internal/modules/cjs/loader:1854:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/home/alstruk/GitHub/digital-marketplace-next/app/node_modules/.bin/tsc'
  ]
}

Node.js v24.16.0
npm error Lifecycle script `typecheck` failed with error:
npm error code 1
npm error path /home/alstruk/GitHub/digital-marketplace-next/app/frontend
npm error workspace @digital-marketplace/frontend@0.1.0
npm error location /home/alstruk/GitHub/digital-marketplace-next/app/frontend
npm error command failed
npm error command sh -c tsc --noEmit -p tsconfig.json

_Ruled: return by runner:verify_
