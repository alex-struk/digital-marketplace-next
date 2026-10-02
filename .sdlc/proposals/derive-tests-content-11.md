---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I made both of the reviewer's changes."
opened: 2026-10-02T23:47:08.607Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I made both of the reviewer's changes.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made both of the reviewer's changes. I couldn't run any checks: approval was needed to typecheck the test project and to parse the YAML, and with nobody here to approve, neither ran. I read the YAML by eye instead. The clause has no `: ` or ` #` sequence that would break the unquoted string, and the reason and missing fields stay double-quoted as before.

**Condition 1, `tests/acceptance/content/R-7.29.spec.ts`:** the final check now reads `surface.opportunitySwuView.scopeSection()` directly, without `readOrEmpty`. If the adapter throws (including an `unbound:` error) or returns nothing, the test now fails instead of passing on an empty string. A short comment says why. The five "shown in full" checks still use `readOrEmpty`, which the reviewer allowed because each needs a non-empty value to pass. Nothing else in the file changed; the header's derived date was already 2026-10-02.

**Condition 2, `tests/acceptance/not-testable.yaml`:** I did not add a second R-7.29 entry. The rules allow one entry per criterion, with several out-of-reach clauses named together, and a second entry might be refused. So I added the new clause to the existing R-7.29 entry, which already had owner `contract` and a `blocked:` reason, so both fit.
- **Clause** now also names "with nothing said about why" anywhere on the Sprint With Us opportunity screen (opportunity-swu-view) outside its scope section.
- **Reason** now adds that the test reads the scope section as empty, but the surface has no observation for a notice, alert or error message elsewhere on that screen.
- **Missing** now adds that the contract would need an observation on opportunity-swu-view (for example `notices` or `page_messages`) that returns any such message, empty when there is none. A test on an instance started in `service_page_absent` could then read it as empty.
- **Owner** is still `contract`.

The existing evaluation-instructions clause in that entry is unchanged, as is every other entry in the file and every other file under `tests/acceptance/content/`.

Two parts of R-7.29 are still owed, both by the contract stage:
- **Evaluation-instructions screens:** a configuration that removes an evaluation-instructions page, so a test can open those screens with their embedded page missing.
- **The rest of the opportunity screen:** an observation for any explanatory message outside the scope section, so a test can assert nothing is said about why the section is empty.

Nothing asked me to change a file outside this stage's paths.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised R-7.29 content tests follow from their criterion and from nothing else, and do they carry out the two instructions left owed by derive-tests-content-stale-7? Ruling: approve. The test opens a seeded Sprint With Us opportunity as a vendor on an instance started in service_page_absent. It checks that the opportunity's own material is shown (identifier, status, deadline, budget, phases), which is 'shown in full'. It then reads the scope section directly and requires it to be empty, so an adapter error or an unbound section now fails the test instead of passing on an empty string. No selector, route, table or status code appears. The clauses the surface cannot reach are named in the R-7.29 entry of not-testable.yaml, owned by contract, with real reasons: no configuration removes the evaluation-instructions page, and no observation on opportunity-swu-view returns an explanatory message outside the scope section. Each says what is missing. Putting the clause into the existing R-7.29 entry instead of adding a second entry meets the substance of the earlier instruction. On the branch, the other not-testable entries the diff shows as rewritten have only moved and are unchanged, and R-6.2 keeps owner: contract. The runner typecheck passed. What would change this ruling: a not-testable entry dropped or altered by the reordering, or a test assertion that does not come from R-7.29.

**Conditions:**
- condition-met derive-tests-content-stale-7#1: tests/acceptance/content/R-7.29.spec.ts final assertion now reads surface.opportunitySwuView.scopeSection() directly, without readOrEmpty, with a comment saying why; readOrEmpty remains only on the five presence checks
- condition-met derive-tests-content-stale-7#2: tests/acceptance/not-testable.yaml R-7.29 entry now names 'with nothing said about why' on opportunity-swu-view outside its scope section in its clause, explains in its reason that no observation exists for an explanatory message elsewhere on that screen, names a notices/page_messages observation in missing, and has owner contract
- missing-test R-7.29: on the evaluation instructions screens (evaluation-instructions-swu, evaluation-instructions-twu), a missing embedded instructions page leaves instructions_body empty and the screen otherwise works — owed by contract: a configuration like service_page_absent that removes the Sprint With Us and/or Team With Us evaluation-instructions page, with its own tag
- missing-test R-7.29: with nothing said about why, anywhere on opportunity-swu-view outside its scope section — owed by contract: an observation on opportunity-swu-view returning any notice, alert or error message shown outside its sections, empty when none is shown

### Runner-owned typecheck evidence

Proposal revision: `94595d5dd4d82cced49bb5aeeed246ee66c19210`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
