---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rebound the three criteria."
opened: 2026-10-04T19:22:45.529Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound the three criteria.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rebound the three criteria. All three were stuck for the same reason: the pages they need now exist on the running build, but the adapter still treated them as missing. Every report page (`.../complete`) and every export page (`.../proposals/:proposalId/export` and `.../proposals/export`) is now bound, for all three programs. I couldn't run the type-checker because the command needed approval. The new code is small and only uses helpers already in the file, and I checked by searching that nothing left in the file still refers to the removed stubs, but it has not been compiled.

**What the running build shows (checked 2026-10-04 at localhost:4300, using the seeded records):**
- **Report page (`.../complete`), R-1.40:** the administrator gets a page headed "<program> opportunity report". It has sections Opportunity, Addenda, History and Proposals, with every proposal written out in full. I checked all three programs. The vendor personas test-vendor-1 and test-vendor-2 (the owner who wrote the seeded proposals) get "Page not found".
- **Export of one proposal, R-2.37:** the page has "Back to the proposal" and "Print", then the proposal's details and sections. The administrator and the proposal's own vendor can open it; another vendor gets "Page not found". The Proponent field says "Proponent 1" to staff while the name is still withheld, and shows the company name ("Northern Pines Digital Ltd.") to the vendor who wrote it.
- **Export of all proposals, R-2.38:** the page is headed "Export all <program> proposals", with a "Name proponents anonymously" box, "Print", and every submitted proposal. The administrator can open it; vendors get "Page not found", including the vendor who wrote the proposals.

**How the adapter reads them:** I matched the old target's adapter. `full_report` and `exported_proposal` return the page's text without the header and footer. They return empty when the reader is refused, whether by "Page not found" or by being sent to sign in, because the page is served and the refusal is the answer. `anonymous_proponent_name` returns a name only when it has the "Proponent N" form, so the vendor's own copy reads as empty.

**Files changed:**
- In `tests/adapters/new/index.ts` I removed the stubs that had reported these nine members as absent or unbound, along with their now-unused helpers. I also corrected the comments that said these routes still answer "Page not found".
- In `tests/adapters/new/bindings.yaml` all nine members (three `full_report`, five `exported_proposal`, one `anonymous_proponent_name`) are now `bound`, with notes on what each page shows.

**Not covered by the contract:** the "Name proponents anonymously" box on the export-all page. No action in the contract presses it, so the adapter leaves it as it finds it.

**Still unserved:** `/proposals` still answers "Page not found" for test-vendor-2; I left those bindings as they were. Every route in `surface.yaml` that I opened this run resolved.

I didn't touch anything outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** runner:checks

Approved by the runner's checks, which policy.gates.G3.auto_approve lets settle bind-adapter proposals: the acceptance typecheck of 39129a028 is clean; no condition is open against it; no escalation stands on it; nothing outside tests/adapters changed.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `39129a028563bbdddfb98a4e5cbe18cc0b09d78b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
