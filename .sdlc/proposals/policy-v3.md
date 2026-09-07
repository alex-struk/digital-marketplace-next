---
gate: G-POL
question: "Set turn budgets for the test-side stages and name the oracle's app and database services?"
recommendation: "Yes: budgets contract 200, derive-tests 300, bind-adapter 200, rule 80 (sources/old/docker-compose.yml lines 3-15 define the app service and lines 17-31 the db service with POSTGRES_USER digmkt, POSTGRES_DB digmkt; the mail catcher and migration services are proposed separately once the contract stage has written the compose override that defines them)."
opened: 2026-09-07T11:04:14.451Z
---

# Set turn budgets for the test-side stages and name the oracle's app and database services?

**Recommendation.** Yes: budgets contract 200, derive-tests 300, bind-adapter 200, rule 80 (sources/old/docker-compose.yml lines 3-15 define the app service and lines 17-31 the db service with POSTGRES_USER digmkt, POSTGRES_DB digmkt; the mail catcher and migration services are proposed separately once the contract stage has written the compose override that defines them).


