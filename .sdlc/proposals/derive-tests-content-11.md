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
