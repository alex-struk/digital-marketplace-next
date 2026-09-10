---
gate: G-POL
question: "Name the mail catcher in oracle.up and the migration one-off in oracle.migrate_service?"
recommendation: "Yes: oracle.up: [db, mailpit] and oracle.migrate_service: migrate. .sdlc/oracle/compose.yml:112-124 defines the mailpit service publishing its API on SDLC_MAIL_API_PORT, which spec/contract/observables.yaml reads as SDLC_MAIL_API; :131-154 defines the migrate one-off behind a profile, building the application's own image and running its migrations. policy-v3's own first condition asked for exactly this proposal."
opened: 2026-09-10T20:44:11.663Z
---

# Name the mail catcher in oracle.up and the migration one-off in oracle.migrate_service?

**Recommendation.** Yes: oracle.up: [db, mailpit] and oracle.migrate_service: migrate. .sdlc/oracle/compose.yml:112-124 defines the mailpit service publishing its API on SDLC_MAIL_API_PORT, which spec/contract/observables.yaml reads as SDLC_MAIL_API; :131-154 defines the migrate one-off behind a profile, building the application's own image and running its migrations. policy-v3's own first condition asked for exactly this proposal.

Without oracle.migrate_service nothing creates the schema, which .sdlc/oracle/compose.yml:37-39 states in its own header comment. Without oracle.up the service list is derived from compose config --services, which starts test-db as well: harmless but wasted, and it is not what the seed or the tests use. Naming [db, mailpit] starts exactly the two services the application needs behind it. The migration service is a one-off run with --rm after the database is ready and before seeding, which is the order src/commands/oracle.mjs already implements.
