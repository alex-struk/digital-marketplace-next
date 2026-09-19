---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "The ruling's conditions are all met except one: the coverage script is written but I couldn't run it, so its output is **not** attached."
opened: 2026-09-19T10:16:17.252Z
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** The ruling's conditions are all met except one: the coverage script is written but I couldn't run it, so its output is **not** attached.

I've revised the plan to build on the openshift-ts stack profile. The ruling's conditions are all met except one: the coverage script is written but I couldn't run it, so its output is **not** attached.

**What stayed.** All 21 slices keep their order and titles. No `criteria:` line changed. The Constitution check stays. So does the handling of J3: the three test-only session routes are still not built, and `/status` is the only way tests can move time forward. In `tasks.md` I only reworded what slices 1–3 deliver where the stack changed them:
- **Slice 1** is now the profile's scaffold, deployed by the pinned quickstart workflows.
- **Slice 2** is now PKCE sign-in (the browser does the code exchange) with bearer-token checks on the API.
- **Slice 3** now puts uploads on the backend's temporary volume, and the single-page app fetches file downloads with the token.

**What the stack now is.** I removed the claim that no `.sdlc/config.yaml` exists. That file isn't in this workspace, but the only stack profile here is `stack-openshift-ts`, which matches the ruling. Decision record 0001 now adopts the profile as written:
- NestJS with Prisma on the backend; React, Vite and TanStack Router on the frontend.
- The `app/frontend`, `app/backend`, `app/migrations` and `app/compose` layout.
- A frontend API client generated from the contract, with validation against the contract at the backend boundary.
- PKCE sign-in with a public Keycloak client, so no secret sits in the browser.
- Deploys through the pinned `bcgov/quickstart-openshift-helpers` workflows.

The shared validation and permission rules now live in `app/backend/src/rules/`, and the frontend imports them by a path alias, so the layout holds without a third package.

**The two departures, each recorded with its reason and what would reverse it:**
1. **Knex runs the migrations.** It continues the old application's migration history, so an old database upgrades in place. Prisma's own migration tool would add a `_prisma_migrations` table to the kept schema, which J5 arguably forbids. Prisma still does all reading and writing.
2. **Administrator rights come from the `users` table, not from token roles.** Accepted criteria (R-4.19, R-4.20) have administrators grant and remove rights inside the service, and R-4.4 needs a deactivated account refused even while its token is valid. Putting roles in the token would mean writing to a Keycloak realm this project doesn't operate, and keeping two stores in step.

**Other records I changed:**
- **0002:** marks the R-1.51 constraint narrowing as a schema change escalated to the tech lead.
- **0003:** explains how PKCE changes the contract. `/auth/sign-in` and `/auth/callback` become screens in the single-page app. `GET /api/sessions/current` creates accounts and refuses deactivated ones. The rest of the API takes bearer tokens.
- **0004:** rewritten for PKCE.
- **0005:** now counts two Deployments, frontend and backend.
- **0006:** now covers two images, the pinned helpers, and migrations in an init container that runs before the backend starts.

**Dependencies for the tech lead.** The dependency register isn't in this workspace, so I listed every dependency beyond what the profile and the constitution name in `plan/plan.md`, under "For ruling" item 3. It includes Knex and the `react-aria-components` library the design catalogue already pins. It also includes my proposed picks for sign-in, token checks, contract validation, client generation, mail, image resizing and Markdown rendering, plus the quickstart's frontend web server.

**New risk flagged for ruling.** Because the API now takes bearer tokens rather than a cookie, any acceptance step that calls `/api` directly must first get a token from the sandbox realm. Steps that go through the screens are unaffected. Whoever writes the acceptance harness needs to know this before writing API-level steps.

**Coverage.** I wrote the check as `plan/check-coverage.mjs`. It fails on any accepted, non-superseded criterion placed twice, placed nowhere, or on any unknown ID. Every attempt to run it, in Python or Node, stopped for an approval this session couldn't get. Instead I checked every placement by hand against the index, domain by domain: all 248 are placed exactly once. The tally is in a new "Coverage check" section of `plan/plan.md`.

**Conditions left for others:**
- **The runner:** route the resubmission to the tech lead for the R-1.51 schema escalation, and run `node plan/check-coverage.mjs .` so the output can be attached.
- **The tech lead:** rule on the dependencies in item 3 and on the two departures in 0001.

**Assumptions nobody has ruled on yet:**
- `.sdlc/config.yaml` says what the ruling says; I couldn't read it.
- The quickstart's frontend web server forwards `/api`, `/status` and `/admin` to the backend, keeping one origin.
- Migrations can run as an init container under the quickstart's charts.
- Prisma introspection of the old schema is good enough to use.
- The mapping of "suspended" records to cancelled, and the other open items already in the plan, are unchanged.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead

The question is whether the plan is the right cut of the work, with each slice standing on its own. The architect passed everything it could check and escalated two points: narrowing the opportunity status check constraints for R-1.51, and dependencies it could not check against a register. No register exists in the workspace. Ruling: approve. The part of the architect's account that decided this is its note that the constraint change alters no column or table shape, has a criterion behind it, and has a code-only fallback already written into 0002. That is a narrow schema change backed by evidence, not a loosening of J5, so I approve it. I also approve both departures from the stack profile. Knex runs migrations only, to keep the old history and keep a Prisma bookkeeping table out of the kept schema. Administrator rights come from the users table because R-4.19, R-4.20 and R-4.4 require it, and each departure records what would reverse it. I approve the dependency list as the plan's first choices (knex/pg, react-aria-components 1.17.0, keycloak-js, jose, express-openapi-validator, openapi-typescript and openapi-fetch, nodemailer, sharp, markdown-it and dompurify, the quickstart's Caddy image). A substitute needs the same ruling. No platform article changes, no gate is removed, J3 holds, and the tier is STANDARD, so nothing requires escalation to Alex. The coverage script plan/check-coverage.mjs was still not run: this session also needs an approval to run it and cannot get one. Coverage rests on the architect's independent hand check (248 of 248, each placed once), so running the script is a condition before building starts. What would change the ruling: a failing coverage run, or a register or policy that excludes a listed dependency, turns this into a return. A ruling that narrowing a check constraint breaches J5 changes only R-1.51's enforcement, to the code-only path.

**Conditions:**
- Run `node plan/check-coverage.mjs .` and attach the output before Slice 1 starts; any FAIL returns the plan to G2
- Add the coverage script to CI so a changed criteria: line cannot pass unchecked
- Remove drafting history from the decision records (0001's 'Supersedes… was wrong to do so' line, the 'revised after the first G2 return' status lines, and 'The first version put…' in 0001) and state only the current decision
- Items 5 (suspended maps to cancelled) and 7 (historical public grants on draft attachments) stay open for a human ruling; they do not block Slice 1
- Pipeline owner: sessions cannot run scripts without an approval they cannot get, and the dependency register this gate refers to does not exist in the workspace; both are pipeline gaps, not plan defects
