| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T23:45:13.590Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** R-7.29 now has a test, but only for the Sprint With Us opportunity screen.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-7.29 now has a test, but only for the Sprint With Us opportunity screen. The criterion also covers the evaluation-instructions screens, and those remain listed as owed. I couldn't run anything here: there are no installed dependencies for a type-check, and the commands to check the YAML needed approval nobody was there to give. I checked both files by reading them.

**The test** (`tests/acceptance/content/R-7.29.spec.ts`). The contract stage handed this criterion back with a new configuration, `service_page_absent`. It starts a separate instance where the page at `sprint-with-us-opportunity-scope` has been removed. The test carries the tag `@service_page_absent`, so it runs only against that instance. It doesn't try to detect which instance it is on and doesn't skip itself.

It signs in as `persona.vendor` and opens `seed.opportunities.closedSprintWithUs` on `opportunitySwuView`. It checks that the rest of the screen still works:
- the opportunity identifier contains the seeded id;
- status and proposal deadline are not empty;
- the total budget reads as 500,000;
- the phases show Implementation.

It then checks that `scopeSection()` is empty. On the default instance the page is present and the section is filled, so this test belongs only to that configured run.

**The entry I kept, rewritten** (`tests/acceptance/not-testable.yaml`). I replaced the old entry for the whole criterion with an entry for one part of it. The note on R-7.29 says the same empty-section handling applies to the evaluation instructions a panel reads. The seed marks those pages as embedded by `evaluation-instructions-swu` and `evaluation-instructions-twu`. The entry's clause is the criterion's statement as it applies to those two screens and their `instructions_body`.

It is marked `blocked:` and owned by `contract`. `service_page_absent` removes only the scope page. R-7.25 means no screen or request can remove the instructions pages either. So no test can open those screens while their page is missing.

**Needed from the contract:** a configuration like `service_page_absent` that selects `SDLC_ORACLE_ABSENT_PAGE=sprint-with-us-evaluation-instructions` (and possibly the Team With Us one), with its own tag and `for: [R-7.29]`. A test could then read `instructions_body` as empty beside `visible_to_evaluators_only`.

**Not asserted:** the "nothing said about why" part of the outcome is checked only inside the scope section, which is empty. The surface has no observation for a message elsewhere on that screen, so that part is not asserted beyond the section.

I changed nothing outside `tests/acceptance`, and nothing asked me to.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-7.29 test and its rewritten not-testable entry follow from the criterion and nothing else? Ruling: return. Most of the work holds. The test runs only on instances started with service_page_absent. Its 'shown in full' checks read back the seeded identifier, status, deadline, budget and phase, with nothing about the implementation leaking in. The narrowed not-testable entry for the evaluation-instructions screens gives a real reason (R-7.25 forbids removing those pages, and no configuration removes them) and names contract as the stage that owes the missing configuration. The defect is in the final check: the scope section is read through readOrEmpty, which catches any error and returns an empty string. The adapter reports something it cannot bind by throwing an error starting 'unbound:', as tests/results/old/2026-09-29-11.json shows. So a scope section the adapter cannot reach becomes an empty string, the check passes, and R-7.29 is closed with nothing established. The five presence checks can safely tolerate errors because each needs a non-empty value; the emptiness check cannot. Separately, the proposal says 'with nothing said about why' is checked only inside the scope section, because the test interface cannot observe a message elsewhere on the screen. That part of the criterion has no not-testable entry naming it, so the first passing run would mark the whole criterion as tested. The ruling changes to approve once the scope section is read without swallowing errors and that part of the criterion has its own entry.

**Conditions:**
- tests/acceptance/content/R-7.29.spec.ts: read surface.opportunitySwuView.scopeSection() directly rather than through readOrEmpty, so an error thrown by the adapter (including an 'unbound:' error) fails or reports the test instead of becoming an empty string that passes the toBe("") check. readOrEmpty may stay on the five presence checks, which need a non-empty value to pass.
- tests/acceptance/not-testable.yaml: add an R-7.29 entry with a clause naming 'with nothing said about why' as it applies to the Sprint With Us opportunity screen outside its scope section. Its reason should say that the surface offers no observation for an explanatory message elsewhere on opportunitySwuView. Its owner should be contract, and its missing field should say what observation would let a test assert it.

### Runner-owned typecheck evidence

Proposal revision: `5f67d9021402c024bd992b9d7aaa0e818b60de74`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
