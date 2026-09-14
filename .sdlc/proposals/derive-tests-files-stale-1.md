---
gate: G3
question: "Do these tests follow from the files criteria and from nothing else?"
recommendation: "I rewrote the test for the one criterion in this run, R-8.1 (v1), so it is now `tests/acceptance/files/R-8.1.spec.ts`."
opened: 2026-09-14T20:21:32.651Z
---

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
