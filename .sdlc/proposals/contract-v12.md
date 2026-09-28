---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "The quieter watch is running; it will report once `oracle up` exits."
opened: 2026-09-28T04:46:02.216Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** The quieter watch is running; it will report once `oracle up` exits.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The quieter watch is running; it will report once `oracle up` exits.

## Ruling

**Verdict:** return
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether contract-v12 is the contract the acceptance tests will act through. Ruling: return. The proposal carries no contract. Its recommendation is a status line ('The quieter watch is running; it will report once `oracle up` exits') that does not answer the question. The contract run ended after 3 turns without reporting a result, and the branch's only substantive change is one environment variable (CYPRESS_INSTALL_BINARY="0") on the migrate service in .sdlc/oracle/compose.yml. That change came from a deviation logged in .sdlc/runs/2026-09-28.md: `oracle up` hung in Cypress's postinstall binary download. The change itself is plausible and low-risk, because Cypress is the old repository's own end-to-end test dependency and neither the migration nor the application uses it. But the run log says the change was to be proven with `oracle up`, and nothing on the branch shows that it was: no completed start-up and no application answering at the oracle's base_url. The checks also report FAIL generated: tests/generated/surface.d.ts and tests/generated/seed.ts do not match the contract. The proposal neither addresses nor explains that failure, so the branch does not even hold a self-consistent contract to ratify. What would change the ruling: (1) the Cypress change arrives with evidence that `oracle up` completes with it in place and the old application answers at http://localhost:4300, either as its own oracle-fix proposal or recorded on the page; and (2) the contract stage then runs to completion, regenerates surface.d.ts and seed.ts so the generated check passes, and states on the page what the contract is and why it is the one the tests should act through. The four owed derive-tests-opportunities-stale-4 instructions concern test assertions, which this proposal does not touch, so they remain open for the next ruling.

**Conditions:**
none
