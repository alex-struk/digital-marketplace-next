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

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this contract change gives R-7.29's open clause a usable starting state without changing behaviour that has already been ruled. It does. R-7.29 says that when a screen embeds a page's body and that page is missing, the screen still works and the embedded section is empty. R-7.25 says no screen and no request can remove a page the service needs, and 000-installation.sql puts every such page back on every reset. So the only honest way to reach the R-7.29 state is a separate oracle instance whose data is different, and that is what this proposal builds: the configuration `service_page_absent`. I checked three things against the branch. First, the override's `db` command is the base file's own command (`postgres -c log_statement=all`, sources/old/docker-compose.yml) with one custom database setting added. Second, 017-absent-service-page.sql uses `NULLIF(current_setting('sdlc.absent_page', true), '')`, so under the default the setting is empty and the file deletes nothing. It also deletes `contentVersions` before `content`, so it does not trip a foreign key. Third, the configuration sets up only the condition, the page being gone, and leaves the outcome (an empty scope section) to the application. That keeps the test blind. Neither criterion's statement, version or confidence changes, so there is nothing to confirm or edit, and no condition lines are needed. The observables entry lists what such an instance makes false (any criterion about the scope section's content) and keeps it out of the default run, which keeps the shared suite sound. The proposal says the startup proof was run on the oracle (404 on the scope page in the configuration copy, 200 in the default copy, and the same after a reset). I did not re-run it. The missing-test/R-7.29 condition stays open until derive-tests writes a test tagged `@service_page_absent`. That is correctly routed to derive-tests and is not a reason to hold this back. What would change the ruling: evidence that the setting leaks into the default instance (for example, a default run where the scope section comes back empty), or a claim that R-7.29's clause also needs the Team With Us terms page absent. That second case would need its own configuration value and a separate ruling, not a change to this one. Tier is STANDARD and there is only one plausible reading of the intent, so nothing escalates.

**Conditions:**
none
