| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T23:56:48.673Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** I rewrote the R-7.29 test so it now covers the evaluation instructions screens as well as the opportunity scope section.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the R-7.29 test so it now covers the evaluation instructions screens as well as the opportunity scope section. One clause still can't be tested, so its entry stays in `not-testable.yaml`, now limited to that clause. I could not run the type check, the Playwright listing or a YAML parse here because each needed approval nobody was present to give. The file and the YAML entry have only been checked by reading them.

**What the test file now holds.** `tests/acceptance/content/R-7.29.spec.ts` has three tests. Each one needs the application started with one embedded page removed, and each carries the tag of the configuration that removes it:

- **`@service_page_absent`** (kept from the previous derivation): a vendor opens the seeded closed Sprint With Us opportunity on `opportunitySwuView`. The opportunity's identifier, status, proposal deadline, budget and phases still show, and `scopeSection()` reads empty.
- **`@evaluation_instructions_absent_swu`** (new): the scheduled transition trigger is run so the seeded closed opportunity moves into evaluation. `persona.publicSectorStaff` signs in; the seed says that persona signs in as `users.staffOne`, an evaluator on that opportunity's panel. It opens `evaluationInstructionsSwu` for `seed.opportunities.closedSprintWithUs`. `visibleToEvaluatorsOnly()` must read non-empty, which shows the screen still loads, and `instructionsBody()` must read empty.
- **`@evaluation_instructions_absent_twu`** (new): the same steps on `evaluationInstructionsTwu` for `seed.opportunities.closedTeamWithUs`.

The criterion is one statement, but each removed page needs its own instance, so each screen is its own test. Playwright does not allow two tests in one file with the same title. Each title is therefore the criterion's statement with the screen added in parentheses.

**What is still owed.** Of the three counts in the run summary, one criterion got a test, none was fully untestable, and one has a clause untestable. The entry now names only the clause "the scope section is empty, with nothing said about why", on the Sprint With Us opportunity screen. Its reason starts with `blocked:` and its owner is `contract`. The new configurations covered the instructions screens but added nothing that shows what else is on the opportunity screen. Without that, no test can check that no notice, alert or error explains the missing page.

**What the contract needs to add.** One observation on `opportunity-swu-view`, for example `notices` or `page_messages`. It should return the text of any notice, alert or error the screen shows outside its sections, and be empty when there is none. A test on the `service_page_absent` instance can then read it as empty, and the entry can be removed.

Nothing asked me to change any read-only path, and I edited only `tests/acceptance/content/R-7.29.spec.ts` and `tests/acceptance/not-testable.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-7.29 tests follow from the content criteria and from nothing else? Ruling: approve. R-7.29 says that on any screen embedding a page, a missing page leaves that part empty and the rest of the screen works. The three tests each check one screen that embeds a page, each against an instance with that page removed. The Sprint With Us opportunity screen keeps its own material (identifier, status, deadline, budget, phases) while its scope section reads empty. The Sprint With Us and Team With Us evaluation instructions screens still offer their instructions tab while their instructions body reads empty. Moving the opportunities into evaluation and signing in as the seeded panel evaluator are steps the screens need before they can be opened, not extra assertions, and no test reads a selector, route, table or status code. The runner's typecheck passed with no diagnostics. The one clause no test asserts, 'with nothing said about why' (no notice, alert or error elsewhere on the opportunity screen explains the missing page), is now the only clause in the not-testable.yaml entry. Its reason is real: the contract gives no way to observe messages outside a screen's sections. It is kept owed by contract below. The open missing-test for the evaluation instructions screens is asserted by the new tests and closes when they run, so this ruling neither marks it met nor withdraws it. What would change the ruling: a typecheck failure, or the evaluation_instructions_absent_* configurations turning out not to exist in the contract.

**Conditions:**
- missing-test R-7.29: the scope section is empty, with nothing said about why — on opportunity-swu-view, that no notice, alert or error message anywhere on the screen outside its scope section explains the missing page — owed by contract: an observation on opportunity-swu-view (for example notices or page_messages) returning the text of any notice, alert or error message the screen shows outside its sections, empty when none is shown, so a test on an instance started in service_page_absent can read it as empty

### Runner-owned typecheck evidence

Proposal revision: `2e2cc0d7f340041b18fd29580ae57228651bbc39`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
