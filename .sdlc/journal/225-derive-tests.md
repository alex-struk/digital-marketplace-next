---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T02:19:49.627Z"
cost: 0.4446692
turns: 12
session: "1134c609-5a2a-4365-916a-b1be086a5520"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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