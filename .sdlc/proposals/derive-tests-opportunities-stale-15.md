---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I wrote a test for R-1.6, the one criterion in this run, and removed its entry from `tests/acceptance/not-testable.yaml`."
opened: 2026-10-01T14:01:12.478Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote a test for R-1.6, the one criterion in this run, and removed its entry from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote a test for R-1.6, the one criterion in this run, and removed its entry from `tests/acceptance/not-testable.yaml`. Nothing in this run was left untestable, and I needed no surface action or observation that the contract doesn't already have. The test hasn't been run or type-checked: running the TypeScript compiler from this workspace needed approval and was refused.

**Why it can now be tested.** R-1.6 was recorded as blocked because the view count was on no surface page. The contract stage has since added the `opportunity-counters` page, opened by the opportunity's program and identifier, with a `view_count` observation (`viewCount()` in the generated types). That is the count the criterion is about.

**What the test does** (`tests/acceptance/opportunities/R-1.6.spec.ts`, one test titled with the criterion's statement). It works on `seed.opportunities.publishedCodeWithUs`:
1. Signs in as `persona.administrator`, opens the counters page for the opportunity and reads the count. An empty answer reads as 0, because the contract says a counter never incremented is left out of the answer. Then it signs out.
2. Opens the opportunity's public page (`opportunityCwuView`) signed out, and checks the page shows the opportunity's identifier.
3. Reads the count again the same way and asserts it went up by exactly one.

Two choices worth knowing:
- **Who opens the public page.** The handback note said counters would be "readable signed out or by any persona", but the contract allows only an administrator or public-sector staff. So the test reads the count as the administrator and opens the public page as an anonymous visitor. That keeps the one viewing between the two reads a genuine public opening, not a staff member on the page.
- **Exactly one, not just a change.** The test checks an increase of exactly one rather than any change, which is what the earlier review in `tests/acceptance/redo.yaml` asked for. That review had flagged the previous test for reading the count off the management screen; it is already closed, so I left it alone.

**What could break it.** The test assumes nothing else views this seeded opportunity between the two reads. A suite run in parallel against a shared target could break that. Also, the counters page takes the seed's `program` value (`code-with-us`) as-is; the contract stage reported checking that this addressing works on the oracle.

I changed nothing outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the R-1.6 test follow from its criterion and nothing else, and does it assert every clause? Ruling: return. What the test asserts is sound and stays within the contract surface. It reads the count through the opportunity-counters page as the administrator, which the contract allows. It opens the public page as a visitor who is not signed in and checks for an increase of exactly one. The removed not-testable entry is properly answered by the new counters page. The runner's typecheck passed. The identifier check after opening the public page only confirms the page actually opened, so it is acceptable. The problem is a missing clause. The criterion's 'when' is 'anyone, signed in or not, opens its public page', and the test only exercises 'not'. A signed-in visitor opening the page is a separate path: an application could count only anonymous views, or skip views from logged-in users, and this test would still pass. As written, the test's first passing run would close R-1.6's missing test with the signed-in half owed by nobody. The writer can assert it: the generated personas include an actable vendor (persona.vendor, reached by /auth/createsessionvendor). Nothing names that clause in not-testable.yaml. Per the brief, a clause the writer could assert and did not is a return, not a note on an approval. The ruling would change to approve once the test also has a signed-in visitor who is not staff (for example persona.vendor) open the public page between two counter reads and asserts the count rose by exactly one, alongside the anonymous case. A not-testable.yaml entry carrying `clause` would also do, but only with a real surface reason, and there doesn't appear to be one.

**Conditions:**
- R-1.6: the criterion's 'when' covers anyone 'signed in or not', but tests/acceptance/opportunities/R-1.6.spec.ts only opens the public page signed out. Add a viewing by a signed-in persona that is not staff (e.g. persona.vendor): read the count, open opportunityCwuView signed in as that persona, sign out, read again, and assert an increase of exactly one. Keep the anonymous case. If the surface truly cannot reach a signed-in viewing, record a not-testable.yaml entry for R-1.6 carrying `clause: signed-in visitor opens the public page` with the concrete surface gap instead.

### Runner-owned typecheck evidence

Proposal revision: `e37bc8f526ef85e9b1ac8c66d90c6837ff502cd1`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
