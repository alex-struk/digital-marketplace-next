---
gate: G-POL
question: "Name the mail catcher in oracle.up and the migration one-off in oracle.migrate_service?"
recommendation: "Yes: oracle.up: [db, mailpit] and oracle.migrate_service: migrate. .sdlc/oracle/compose.yml:112-124 defines the mailpit service publishing its API on SDLC_MAIL_API_PORT, which spec/contract/observables.yaml reads as SDLC_MAIL_API; :131-154 defines the migrate one-off behind a profile, building the application's own image and running its migrations. policy-v3's own first condition asked for exactly this proposal."
opened: 2026-09-10T20:44:11.663Z
---

# Name the mail catcher in oracle.up and the migration one-off in oracle.migrate_service?

**Recommendation.** Yes: oracle.up: [db, mailpit] and oracle.migrate_service: migrate. .sdlc/oracle/compose.yml:112-124 defines the mailpit service publishing its API on SDLC_MAIL_API_PORT, which spec/contract/observables.yaml reads as SDLC_MAIL_API; :131-154 defines the migrate one-off behind a profile, building the application's own image and running its migrations. policy-v3's own first condition asked for exactly this proposal.

Without oracle.migrate_service nothing creates the schema, which .sdlc/oracle/compose.yml:37-39 states in its own header comment. Without oracle.up the service list is derived from compose config --services, which starts test-db as well: harmless but wasted, and it is not what the seed or the tests use. Naming [db, mailpit] starts exactly the two services the application needs behind it. The migration service is a one-off run with --rm after the database is ready and before seeding, which is the order src/commands/oracle.mjs already implements.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead

The evidence verifies exactly. .sdlc/oracle/compose.yml:112-124 defines the mailpit service publishing its API on SDLC_MAIL_API_PORT, which spec/contract/observables.yaml:12-17 reads as ${SDLC_MAIL_API} with catcher: mailpit; :131-154 defines the migrate one-off behind a profile, building the application's own image and running the documented migration script. src/commands/oracle.mjs confirms both keys behave as described: upServices() (:86-92) passes the named list to `up -d --build` (:152), the application is started separately at :176, and migrate_service runs as `run --rm` at :163 after the db wait and before the seed. Unset, the list is derived from `compose config --services` minus the app and migrate service, which is the imprecision being fixed. Nothing beyond the two questions moved: constitution.md and its platform articles are untouched, the gate table is unchanged, rungs stays empty, and lock.json, personas, triage and egress are untouched — the whole diff is two lines in .sdlc/config.yaml plus the proposal page and the run record. This is the proposal policy-v3's first condition asked for, filed on its own citing the compose override rather than as an amendment to that ruling. Tier is STANDARD, all eight checks pass, and no confidence shortfall is reported, so no escalation trigger fires. The five test warnings concern acceptance tests for superseded requirements; no test file is touched on this branch, so they are pre-existing and belong to their own gate.

**Conditions:**
- A third service needed before the application starts is added to oracle.up by its own one-line proposal citing the compose lines that define it, not by an in-flight edit to config.yaml.
- The superseded-requirement test warnings (R-8.14, R-6.10, R-6.14, R-6.22, R-6.26) are settled at the gate that owns those tests; they are not evidence for or against a policy change.
- build: 3000000 and review: 1000000 remain owed a conversion to turn budgets in a proposal of their own, as policy-v3 required.
