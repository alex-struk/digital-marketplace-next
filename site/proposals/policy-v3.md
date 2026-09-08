| Field | Value |
| --- | --- |
| gate |  |
| opened |  |
| holder |  |

---
gate: G-POL
question: "Set turn budgets for the test-side stages and name the oracle's app and database services?"
recommendation: "Yes: budgets contract 200, derive-tests 300, bind-adapter 200, rule 80 (sources/old/docker-compose.yml lines 3-15 define the app service and lines 17-31 the db service with POSTGRES_USER digmkt, POSTGRES_DB digmkt; the mail catcher and migration services are proposed separately once the contract stage has written the compose override that defines them)."
opened: 2026-09-07T11:04:14.451Z
---

# Set turn budgets for the test-side stages and name the oracle's app and database services?

**Recommendation.** Yes: budgets contract 200, derive-tests 300, bind-adapter 200, rule 80 (sources/old/docker-compose.yml lines 3-15 define the app service and lines 17-31 the db service with POSTGRES_USER digmkt, POSTGRES_DB digmkt; the mail catcher and migration services are proposed separately once the contract stage has written the compose override that defines them).



## Ruling

**Verdict:** approve
**By:** agent:tech-lead

The cited evidence verifies exactly: sources/old/docker-compose.yml:3-15 is the app service on port 3000 (matching oracle.base_url) and :18-31 is the db service with POSTGRES_USER/POSTGRES_DB digmkt, correctly chosen over the digmkt-test test-db service on :33-46. The deferral of the mail catcher and migration services is accurate — that compose file defines neither. The budget half is a unit migration, not a loosening: git history shows the template's archaeology: 4000000 was replaced with 120 by the tech lead's own budget-v1 ruling (recorded as a raise), so derive-tests 2000000 -> 300 converts a leftover in the old unit, and measured archaeology runs of 94-112 turns under a 120 cap make contract 200, derive-tests 300, bind-adapter 200 and rule 80 conservative fail-closed caps. Nothing beyond the two questions moved: constitution.md is untouched so no platform article changes, rungs remains empty, gates, triage, egress and the lockfile are unchanged, and build/review were correctly left in place rather than converted opportunistically. Tier is STANDARD and all eight checks pass, so no escalation trigger fires.

**Conditions:**
- The mail catcher and migration services come as their own G-POL proposal citing the compose override that defines them, not as an amendment to this one.
- A cap found too low is raised by a one-line proposal citing the run that hit it, as archaeology was at budget-v1 — not by an in-flight edit to config.yaml.
- build: 3000000 and review: 1000000 remain in the pre-migration unit and are converted to turn budgets in a proposal of their own.
