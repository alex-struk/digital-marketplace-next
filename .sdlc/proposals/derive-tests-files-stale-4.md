---
gate: G3
question: "Do these tests follow from the files criteria and from nothing else?"
recommendation: "I rewrote the one criterion I was asked to, R-8.11, as `tests/acceptance/files/R-8.11.spec.ts`, and it now has a test."
opened: 2026-09-29T02:19:49.653Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I rewrote the one criterion I was asked to, R-8.11, as `tests/acceptance/files/R-8.11.spec.ts`, and it now has a test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the one criterion I was asked to, R-8.11, as `tests/acceptance/files/R-8.11.spec.ts`, and it now has a test. No criterion went into `tests/acceptance/not-testable.yaml`. I did not need any surface action or observation that the contract lacks.

**What the ruling asked for.** The previous version ended by reading the file's bytes as an administrator. That was a claim the criterion never makes, and the test failed on an empty read. The new test never reads file content.

**How the test works.** It uses the seeded file `seed.stored_files.privateOfFileUploader` rather than uploading its own. That removes a step the criterion doesn't ask for, and it means the identifier and name are checked against seeded values. The file has two tests, one for each thing the criterion states:

- **The description.** Signed in as the uploader, the test opens `surface.fileDescription` for the seeded file. It checks that:
  - `fileIdentifier()` equals the seed's id;
  - `fileName()` equals the seed's name;
  - `storedDate()` is present;
  - none of the three values contains the seeded content. This comes from the criterion's own "and its content is not".
- **Same permission rules.** The test signs in the uploader, a vendor the file does not name, and an administrator, one at a time. For each, it opens both `fileDescription` and `fileDownload` (and calls `downloadFile()`), reads `refusedWhenNotPermitted()` from each, and asserts that both requests got the same answer. It does not assert which of these people is allowed, since that belongs to other criteria. The three were chosen because they have different grounds for reading the file, so both the "allowed" and "refused" outcomes are likely to come up.

A refusal observation that returns nothing, or throws, counts as "not refused". The R-8.12 tests read these observations the same way.

**What I couldn't check.** I couldn't type-check or run the test: running `npx tsc` in this session needed an approval nobody was here to give. Instead I checked by hand that every surface member, persona key, seed handle and fixture export the file uses exists in `tests/generated` and `tests/fixtures`.

Nothing asked for a change outside `tests/acceptance`, and I made none.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-8.11 tests follow from the files criteria and from nothing else? Approve. The first test signs in the seeded file's uploader, who may read the file. It asserts only what the criterion's then-clause states: the identifier and name match the seeded file, a stored date is present, and the content appears in none of them. The second test reads 'under the same permission rules as the content itself' as a per-person comparison across the uploader, an unnamed vendor and an administrator. It asserts only that the description is refused exactly when the content is. It no longer reads the file's bytes or asserts who is permitted, which the earlier return had objected to. No selector, route, table or status code leaks in: everything goes through contract surface members and seed handles. Every clause of R-8.11 is asserted, so no not-testable entry is needed. The runner's typecheck reports no diagnostics under acceptance/files/; its only diagnostics are in adapters/new/, outside this proposal. The diff touches only tests/acceptance, redo.yaml and applied.yaml bookkeeping, and no protected path. One residual weakness: a refusal observation that answers empty or throws counts as not refused, so if neither binds, the comparison passes vacuously. That concerns the binding and does not overreach the criterion. The ruling would change if verify showed both refusal observations unbound for R-8.11, or if a run showed the description reporting a value the criterion does not name.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `4e3a1fba100896f650d491c29f5d9c74f9449b6a`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
