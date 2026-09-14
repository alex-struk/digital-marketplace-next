| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T20:21:32.651Z |
| holder | agent:reviewer |

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I rewrote the test for the one criterion in this run, R-8.1 (v1), so it is now `tests/acceptance/files/R-8.1.spec.ts`.

I rewrote the test for the one criterion in this run, R-8.1 (v1), so it is now `tests/acceptance/files/R-8.1.spec.ts`. No criterion was found untestable, and I added nothing to `not-testable.yaml`. The file was written but not run or type-checked; this workspace has no app to run it against.

**Why it was rewritten.** A test for this criterion already existed from the last approved derivation, and `tests/acceptance/redo.yaml` sent it back. Its signed-in half only succeeded if the upload's read-access statement named one particular account, and the criterion says nothing about that.

**What changed.** The upload now states read access as "readable by anyone" (`{ tag: "any" }`). That is the plainest form the spec offers, and the sibling tests for R-8.2 and R-8.23 already use it.
- I kept a read-access statement rather than using the plain `uploadFile` action. Under R-8.24, leaving the statement out is its own refusal, which would blur what R-8.1 is testing.
- Both tests now send the same submission. The only difference between them is whether anyone is signed in.
- The signed-in actor is still `persona.fileUploader`. It's a vendor with no role, no organization membership and no administrator rights, so a successful upload depends only on being signed in.
- I removed the unused `seed` import and updated the header to the new spec commit (d4b7ad71).

**What the tests check.** The criterion has two outcomes, so there are two tests, each titled with the criterion's own wording:
- **Signed in:** a signed-in person uploads through `surface.fileUpload.uploadFileStatingItsReadAccess`. The test expects no signed-out refusal (`refusedWhenSignedOut`) and a stored file identifier (`storedFileIdentifier`).
- **Not signed in:** a visitor sends the same submission. The test expects the signed-out refusal and no stored file identifier, which covers the spec's "no file is stored."

**Gaps in the contract.** Nothing was missing: the `file-upload` page has every action and observation this criterion needs. Two things are worth knowing:
- **What "no file is stored" rests on.** The test can only show that no identifier came back. The surface has no way to confirm afterwards that nothing was saved, such as a list of stored files or a count of them. If that stronger check matters, the contract would need such an observation.
- **How the adapter reads read access.** The surface types every action's input as `unknown`. So what `readAccess: [{ tag: "any" }]` means depends on the adapter accepting the same shape the other files tests use.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the R-8.1 tests follow from the criterion ('Any person who is signed in may upload a file, and a visitor who is not signed in cannot'; then: refused as not permitted and no file is stored) and from nothing else? Ruling: approve. The signed-in test expects no signed-out refusal and a stored file identifier, which is what 'may upload' means. The visitor test sends the same submission and expects the refusal and no identifier, which is the criterion's stated outcome. The redo reason is fixed: read access is now stated as readable by anyone ({tag:'any'}), matching R-8.7's wording and the approved R-8.2 and R-8.23 tests, so success no longer depends on naming a particular account. A statement is still sent because omitting it is a separate refusal under R-8.24. Every call is a surface action or observation on FileUploadPage; no selector, route, table or status code appears. The runner typecheck passed with no diagnostics under acceptance/files, and the tests-check warnings concern other, superseded criteria. Removing R-8.1 from redo.yaml and its stale calibration rulings from applied.yaml is consistent with the rewrite and touches no protected path. The tier is STANDARD with no unaccepted residual risk, so no escalation. 'No file is stored' can only be shown as the absence of an identifier, because the page offers no list or count of stored files; that is a contract gap, not a test fault. The ruling would change if the adapter does not accept the {tag:'any'} read-access shape, or if calibration shows the signed-in upload depends on anything besides being signed in.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `564e8d932cd81dec9b44aa1d23f4e6f1290c6e3e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    No diagnostics.
