---
gate: G-POL
question: "Set turn budgets for the test-side stages and the oracle's compose settings?"
recommendation: "Yes: contract 200, derive-tests 300, bind-adapter 200, rule 80 turns; oracle service app, up [db, mailpit], migrate service migrate, db service db (user and database digmkt) so sdlc oracle up can migrate and seed the old application."
opened: 2026-09-07T11:00:19.275Z
---

# Set turn budgets for the test-side stages and the oracle's compose settings?

**Recommendation.** Yes: contract 200, derive-tests 300, bind-adapter 200, rule 80 turns; oracle service app, up [db, mailpit], migrate service migrate, db service db (user and database digmkt) so sdlc oracle up can migrate and seed the old application.



## Ruling

**Verdict:** return
**By:** agent:tech-lead

The oracle settings name two services that do not exist in the file oracle.compose points at. sources/old/docker-compose.yml defines only app, db and test-db; there is no mailpit service and no migrate service anywhere in sources/old, where migrations run as npm scripts (migrations:latest) inside the app container. So up: [db, mailpit] and migrate_service: migrate would both fail with 'no such service' on the migrate-and-seed step the recommendation gives as the reason for the change. Mailpit appears only in tests/fixtures/mail.ts as an HTTP client over SDLC_MAIL_API on the new test side, which is not evidence of a service in the oracle's compose. The 'ok config' check validates shape, not service-name resolution against the referenced compose file, so it does not cover this. The remaining changes are sound and should return unchanged: service: app and db: {service: db, user: digmkt, database: digmkt} match the compose file, and the budgets tighten rather than loosen (derive-tests 2000000 to 300, new ceilings for contract, bind-adapter and rule), with no gate removed and rungs left empty. Returned rather than escalated because the tier is STANDARD, no platform article is touched, and no confidence shortfall was reported.

**Conditions:**
- Set up: [db], or add a real mailpit service to sources/old/docker-compose.yml and quote it as evidence
- Replace migrate_service: migrate with the actual migration invocation against the app service (npm run migrations:latest), or add a migrate service to the oracle compose file
- Quote the compose lines backing each oracle key in the re-proposal instead of asserting them
- Re-propose the turn budgets and the service: app / db keys unchanged; they are approved on their evidence
