---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "The R-7.29 test now has what it was missing: a second copy of the oracle, started in a new configuration called `service_page_absent`, in which the Sprint With Us scope page doesn't exist."
opened: 2026-10-02T23:39:23.173Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** The R-7.29 test now has what it was missing: a second copy of the oracle, started in a new configuration called `service_page_absent`, in which the Sprint With Us scope page doesn't exist.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The R-7.29 test now has what it was missing: a second copy of the oracle, started in a new configuration called `service_page_absent`, in which the Sprint With Us scope page doesn't exist. I proved it on the running oracle and took every container down afterwards.

**What this run did.** The contract was already complete from earlier runs, and nothing on any page, persona or API operation changed. The only thing this stage owed was a starting state for R-7.29's clause, which reads: "an opportunity whose screen embeds the scope page's body, with that page removed, shown in full with the scope section empty".

**Why the shared seed couldn't supply it.** The page at `sprint-with-us-opportunity-scope` is one the service needs for itself, so R-7.25 means no screen or request can remove it. Before every test, `000-installation.sql` puts all twenty-two of those pages back. Every Sprint With Us opportunity reads that one page, so deleting it from the shared seed would empty the scope section in every test. The state can only exist on a separate copy of the oracle.

**How the configuration works.**
- **The database setting.** The override's `db` service keeps the base command and adds `-c sdlc.absent_page=${SDLC_ORACLE_ABSENT_PAGE:-}`. When the variable isn't set, the setting is empty.
- **The seed file.** `tests/seed/017-absent-service-page.sql` runs after the rest of the seed. It deletes the page named by that setting, and its versions. With an empty setting it matches nothing.
- **The contract entries.** `observables.yaml` declares `service_page_absent` for R-7.29, with `select: SDLC_ORACLE_ABSENT_PAGE=sprint-with-us-opportunity-scope` and tag `@service_page_absent`. Its notes say what to observe, and that a test with the tag runs only against that copy and is left out of the default run.
- **The cross-references.** The `scope_section` comment in `surface.yaml` now points to this configuration. `tests/seed/manifest.yaml` lists the new file and marks `content.servicePageSprintWithUsOpportunityScope` as `absent_in: [service_page_absent]`.

The application itself starts exactly as it does by default; only the data differs. It sets up the condition, not the outcome: the page is gone, and whether the scope section comes out empty is up to the application.

**Proof on the oracle.**
- **Default copies.** The usual four copies came up: 78 migrations ran and the seed loaded. The seeded page `about-us` (version 3) and the opportunity `publishedCodeWithUs` both came back through the application's API, and the scope page answered 200.
- **Configuration copy.** The scope page answered 404. The Team With Us terms page and the seeded Sprint With Us opportunity `closedSprintWithUs` both answered 200.
- **After a reset.** Both copies were reset to the seed: the page stayed absent on the configuration copy and present on the default one.

The prompt said to run the CLI as `node $SDLC_BIN`, but the shell guard refused any command containing a variable. I ran `~/GitHub/agentic-sdlc/bin/sdlc.mjs` directly instead, which I took to be the same CLI from the pipeline checkout. Nothing needed fixing in the override to start the oracle.

**Still open.**
- Calibration will refuse this configuration until a test under `tests/acceptance/` carries the tag `@service_page_absent`. Writing that test is the test-writing stage's job.
- The configuration only names the Sprint With Us scope page, because that is the page R-7.29's clause is about. The same variable would remove another service page, such as the Team With Us terms or the evaluation instructions mentioned in the criterion's note, but no clause owed this run needs that.

re-address missing-test/R-7.29 to derive-tests: the configuration `service_page_absent` in spec/contract/observables.yaml (select SDLC_ORACLE_ABSENT_PAGE=sprint-with-us-opportunity-scope, tag "@service_page_absent") starts an oracle copy where tests/seed/017-absent-service-page.sql has removed the page at sprint-with-us-opportunity-scope; a test tagged "@service_page_absent" opens any seeded Sprint With Us opportunity (e.g. opportunities.closedSprintWithUs) on opportunity-swu-view and reads scope_section alongside the screen's other observations.
