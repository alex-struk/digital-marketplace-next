---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added the two configurations the owed test was missing."
opened: 2026-10-02T23:54:22.613Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added the two configurations the owed test was missing.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the two configurations the owed test was missing. The oracle starts, the migration runs and the seed loads under the default. I could not start it with either new configuration switched on, because the sandbox would not run a command that sets an environment variable.

**What was owed.** The criterion is R-7.29: when a screen embeds a page and that page is missing, that part of the screen stays empty and the rest still works. The test writer could not reach the clause about the two evaluation-instructions screens, one for Sprint With Us and one for Team With Us. It needed a way to start the oracle with one of those instructions pages removed, plus a tag for its tests.

**What I found already in place.** An earlier contract run built a general switch for this. The variable `SDLC_ORACLE_ABSENT_PAGE` names one page. The Compose override hands that name to the database as the setting `sdlc.absent_page`, with an empty default. The seed file `tests/seed/017-absent-service-page.sql` then deletes the named page after the rest of the seed has restored it. Only one configuration used the switch, `service_page_absent`, and it names the Sprint With Us scope page. Nothing named either instructions page.

I checked the old application's code. Both instructions tabs read their page and show an empty body if the read fails, so the criterion holds for both programs. Both pages are seeded under the expected names (`sprint-with-us-evaluation-instructions` and `team-with-us-evaluation-instructions`), so the existing delete applies to them unchanged.

**What I added.** Two entries under `configurations:` in `spec/contract/observables.yaml`:
- `evaluation_instructions_absent_swu`: select `SDLC_ORACLE_ABSENT_PAGE=sprint-with-us-evaluation-instructions`, tag `@evaluation_instructions_absent_swu`.
- `evaluation_instructions_absent_twu`: select `SDLC_ORACLE_ABSENT_PAGE=team-with-us-evaluation-instructions`, tag `@evaluation_instructions_absent_twu`.

There is one per program because the variable names a single page and each screen embeds a different one. Each entry says what a test can observe:
- The page's address under `/api/content/` answers not found.
- The instructions screen, opened for the seeded closed opportunity (`opportunities.closedSprintWithUs` or `opportunities.closedTeamWithUs`) by a panel member (`users.staffOne`, signed in as `public-sector-staff`), shows an empty `instructions_body` while the rest of the screen still loads. I confirmed in the manifest that `users.staffOne` is an evaluator on both panels.

Each configuration runs on its own oracle copy, and its tests are left out of the default run. I also updated the comment in `017-absent-service-page.sql` to name all three configurations.

**What I did not change.** No pages, personas, API description, other seed files or the Compose override were touched: the override already reads the variable with the default fallback the runner requires.

**Oracle run.** `oracle up` with the default configuration started all four copies. The migration ran (78 migrations in one batch on a fresh database). The application served seeded records:
- The seeded Sprint With Us opportunity (`00000000-0000-4000-8000-000000000701`) from `/api/opportunities/sprint-with-us`.
- The Sprint With Us instructions page from `/api/content/sprint-with-us-evaluation-instructions`, with status 200, which is correct because the page should be present under the default.

I then ran `oracle down` and nothing is left running. I made no changes to the override.

Neither new configuration has been seen to remove its page. To run the oracle with a variable set, the command has to set it or read `$SDLC_BIN`, and the sandbox blocks both forms without an approval nobody here can give. The existing seed and database setting do this work for `service_page_absent`, but I did not watch them do it in this run either. The calibration run, which starts a copy with each `select`, will be the first to see an instructions page actually gone.

re-address missing-test/R-7.29 to derive-tests: added configurations evaluation_instructions_absent_swu (select SDLC_ORACLE_ABSENT_PAGE=sprint-with-us-evaluation-instructions, tag @evaluation_instructions_absent_swu) and evaluation_instructions_absent_twu (select SDLC_ORACLE_ABSENT_PAGE=team-with-us-evaluation-instructions, tag @evaluation_instructions_absent_twu) in spec/contract/observables.yaml. Each removes that program's instructions page through tests/seed/017-absent-service-page.sql, so instructions_body on evaluation-instructions-swu / evaluation-instructions-twu can be observed empty for the seeded closed opportunities, opened as users.staffOne.
