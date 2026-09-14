---
gate: G3
question: "Do these tests follow from the files criteria and from nothing else?"
recommendation: "I rewrote the files domain against the current contract."
opened: 2026-09-14T02:25:51.861Z
---

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I rewrote the files domain against the current contract.

I rewrote the files domain against the current contract. All 24 criteria in the brief are accounted for: 22 have a test file and 2 have a `not-testable.yaml` entry, with none in both places. I couldn't run anything. The typecheck and a check of the PNG builder both needed approval I didn't have, so the tests are unrun and untypechecked.

**Why I rewrote the existing files.** The earlier files-domain tests were derived from spec@4060538. They used parameter names the generated surface no longer has, such as `{ opportunity }`, `{ file }` and `{ user }`. Most of their "not asserted" comments also explained gaps the contract has since filled: `file-upload`, `file-description` and stored-image width and height now exist. So I deleted and rewrote the twelve that were on my list, and removed ten not-testable entries whose reasons no longer hold (R-8.5, 8.6, 8.7, 8.11, 8.13, 8.17, 8.18, 8.19, 8.24, 8.31). I left `R-8.14.spec.ts` alone because R-8.14 is superseded and wasn't on my list. It deliberately contradicts R-8.21 and probably should be removed. I also left the entries for superseded criteria (R-8.3, 8.4, 8.8, 8.9, 8.15, 8.26); their reasons describe the old contract.

**Tests written:** R-8.1, 8.2, 8.5, 8.6, 8.7, 8.10, 8.11, 8.12, 8.13, 8.17, 8.18, 8.19, 8.20, 8.21, 8.23, 8.24, 8.25, 8.27, 8.28, 8.29, 8.30, 8.31. Four choices shape how they read:
- **File identifiers.** Uploads made straight to the storage address get the identifier from `stored_file_identifier`. Attachments, pictures and embedded images only report an address, so the tests take the identifier from the last part of that address. The contract says this address is how a test reaches a download.
- **Uploads that state no read access.** I read `uploadFile` as that kind of upload, because `uploadFileStatingItsReadAccess` exists beside it. So R-8.24 uses `uploadFile`, and every upload meant to succeed states its read access.
- **Test images.** Profile pictures and logos are real PNGs built inside each test file, because tests can't import helpers. The builder was not run.
- **Proving a read path.** Each path is shown with a reader who can only be explained by that path. Examples: a vendor on a draft versus the same vendor after publishing, or the creator of a draft that somebody else attached a file to.

**Not testable:**
- **R-8.16 is unobservable.** The working directory is on the service's own machine, and nothing the service answers mentions it.
- **R-8.22 is blocked.** Every attaching action uploads new bytes. Nothing names a file that is already stored, so the refused attempt can't be made.

**Parts left out of tests that do exist:**
- **R-8.23 and R-8.24 each end with a clause pointing at R-8.4's service fault.** R-8.4 is superseded by R-8.18, which asks for the opposite (a bad request). A test for those clauses could only contradict R-8.18. These two accepted criteria still disagree about malformed read access, and someone needs to rule on it.
- **R-8.6 can't show who uploaded a file.** `observables.yaml` says the uploader is never returned, so the test shows it through what the uploader is allowed to read.
- **R-8.18's error log** is not observable.
- **R-8.31: deleting a proposal** isn't walked. Only drafts can be deleted, and nothing says who other than the author may read one.

**Surface additions the contract stage could make:**
- **R-8.22:** an action on `file-attachment-control` and the proposal edit pages that attaches a stored file by its identifier, plus an observation that the attachment was refused.
- **R-8.18:** a `file-upload` observation naming what was wrong with a submission that has no file part.
- **R-8.31:** a `file-description` observation saying whether a stored file is detached, meaning no record refers to it any more.
- **R-8.21:** some way to produce an image that reads as a JPEG or PNG but can't be resized.
- **R-8.20:** the attachment control, or an attachment address, on the Sprint With Us and Team With Us proposal forms. Both forms accept attachments, but nothing reports where one was stored.
- **R-8.28:** a logo observation on `organization-list`, for the criterion's own example.
- **Everywhere an address is reported:** a file-identifier observation beside `attachment_address` and both `image_address` observations, so tests don't have to take identifiers from addresses.

## Fix turn

I fixed the one compile error the check reported. The file `tests/acceptance/files/R-8.14.spec.ts` called `surface.userProfile.open()` with the argument `{ user: ... }`, but the generated contract says that page's `open()` takes `{ userId: string }` (`tests/generated/surface.d.ts:686`). I changed that argument to `{ userId: seed.users.fileUploader.id }` and left the rest of the file as it was. I couldn't rerun the type checker because this session wasn't allowed to run commands, so the fix hasn't been checked by a compile run; it was only matched against the generated type.

Something the next stage should know: the file is from an earlier derivation. Its header still says `spec@4060538…, derived 2026-09-07`, and R-8.14 is not on this run's list of criteria. The test says in its own comment that R-8.21 replaces it, and the two tests contradict each other. The check asked for only this compile error to be fixed, so I didn't delete the file or change its header. Whether it stays in the suite still needs a decision.

**Journal addition:** Following the check, I fixed the one compile error it reported. In `tests/acceptance/files/R-8.14.spec.ts`, the call `surface.userProfile.open()` passed `{ user: ... }`, while the generated contract gives that page's `open()` the parameter `{ userId: string }`. I renamed the property to `userId` and still pass the seeded user's id. Nothing else in the file or the rest of the suite changed. I couldn't rerun the type checker because command execution wasn't permitted, so the fix is unverified beyond matching it to the generated type. The file itself is left over from an earlier derivation: its header points to an older spec commit, and R-8.14 wasn't among this run's criteria. Its own comment says R-8.21 supersedes it, and the two tests contradict each other. The check named only the compile error, so I didn't remove the file, but whoever reviews this proposal should decide whether it belongs in the suite.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the rewritten files-domain tests follow from their criteria and from nothing else? Ruling: return. Coverage is complete (24 criteria: 22 tests, 2 not-testable, none in both). The runner's typecheck shows no diagnostics under acceptance/files; its failure is confined to acceptance/notifications, which this proposal does not answer for. No implementation leaks: the read-access tags any/user/userType come from the contract's FileUpload schema (openapi.yaml:1370). Taking the identifier from the last path segment follows the contract's own address form (/api/files/{fileId}) and surface.yaml:1503, which names attachment_address as how a test reaches file-download. Read paths are proven by readers only the association explains. Both not-testable reasons are real: R-8.16's working directory is on the host, and surface.yaml has no action that attaches an already-stored file for R-8.22. Keeping R-8.14's superseded test was already ratified at this gate. The return is narrow. In R-8.21, the test 'a profile picture whose content can be read as a PNG is accepted' also asserts the image is stored at exactly 40x30 pixels. R-8.21 says only that such an image is accepted, and R-8.13 says only that images over 500 pixels are reduced. No criterion says a small image keeps its dimensions, so a rebuild that normalises avatars to a fixed size would satisfy every criterion and fail this test. Per the reviewer brief, that is fixed by the test writer, not waved through. What would change the ruling: drop the storedImageWidth/storedImageHeight assertions from that test, or replace them with a check that the image was set (for example, currentImage changed after saving).

**Conditions:**
- R-8.21: remove the exact 40x30 stored-dimension assertions from 'a profile picture whose content can be read as a PNG is accepted'. Assert acceptance only (no rejectedImageError, and the picture set after saving).
- R-8.17: the refusal is required to contain the same digit string as the limit stated before choosing a file. The criterion asks only that each names the limit, and '10 MB' vs '10485760 bytes' both do. Loosen the refusal assertion so it does not depend on both messages using the same units. Blind-writer fix, same pass.
- Carry forward from the prior ruling, not a blocker here: R-8.14 (superseded by R-8.21) still has a spec file that contradicts R-8.21's test. A spec-process ruling on whether superseded defect criteria keep their tests is still owed before the suite is used as a pass/fail gate.
- Carry forward, not a blocker here: R-8.23 and R-8.24 each end with a clause pointing at R-8.4's service fault, which contradicts R-8.18 (bad request). The two accepted criteria disagree on malformed read access and need a ruling from whoever owns the criteria.

### Runner-owned typecheck evidence

Proposal revision: `62b689a846b93479a9dae0c1150a727517b31855`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/notifications/: 13 diagnostics
