| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-25T14:10:37.884Z |
| holder | agent:reviewer |

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** R-8.22 (v1), the one criterion I was given, now has a test at `tests/acceptance/files/R-8.22.spec.ts`.

R-8.22 (v1), the one criterion I was given, now has a test at `tests/acceptance/files/R-8.22.spec.ts`. I deleted its entry from `tests/acceptance/not-testable.yaml`, so it is no longer recorded as untestable. None of the tests have been run, and I could not type-check the file because the workspace would not run the compiler without approval.

**What changed in the contract.** The entry was blocked because every way to attach a file uploaded new bytes. Nothing could name a file that was already stored. The contract has since added two things. The first is a page called `file-attach-by-identifier`, which works for both opportunities and proposals. It has one action, `attach_stored_file`, and three observations: `attachment_accepted`, `attachment_refused` and `attached_file_identifiers`. The second is a seeded file, `seed.stored_files.privateOfFileUploader`, which has no read-access entries, so only the person who uploaded it can read it.

**What the test checks.** The criterion covers two kinds of record and has two outcomes, so the file holds four tests:

- **Opportunity, refused:** the public-sector staff persona saves their own draft Code With Us opportunity. They try to attach the private seeded file by its identifier. The test expects `attachment_refused` to be set, `attachment_accepted` not to be set, and the file's identifier to be missing from the record's attachments.
- **Opportunity, allowed:** the same person on the same kind of draft attaches a file they uploaded themselves. The test expects it to be accepted and the identifier to appear in the attachments.
- **Proposal, refused and allowed:** the same pair, with the vendor persona using their own draft individual proposal on `seed.opportunities.publishedCodeWithUs`.

The allowed tests are there to show that a refusal comes from the person not being allowed to read the file, not from attaching by identifier being refused in general.

**Two assumptions to note:**
- **The action's input:** the contract says only that `attach_stored_file` takes "the stored file's identifier". I passed it as `{ fileId }`. If the adapter expects a different shape, that is where a failure would come from.
- **Program coverage:** I used Code With Us only. The page accepts all three programs, and the criterion names none of them. I wrote no clause entry for Sprint With Us or Team With Us, because the criterion states no requirement per program.

**Missing from the surface:** nothing for this criterion. I did not change any path outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Do the tests for R-8.22 follow from the criterion and nothing else? Yes. R-8.22 says a file may be attached to an opportunity or proposal only by someone permitted to read it. The two refused tests have a person who may not read seed.stored_files.privateOfFileUploader (readable by its uploader alone, per the seed manifest) name it on their own draft opportunity or draft proposal. They assert only what the criterion implies: attachment_refused is set, attachment_accepted is not, and the id is absent from attached_file_identifiers. The paired allowed tests (same person and record kind, a file they uploaded and so may read) establish that the refusal comes from read permission rather than from attaching by identifier being refused in general. Every page, action and observation used is in the contract (file-attach-by-identifier with attach_stored_file and its three observations), and no selector, route, status code or storage detail appears. Deleting the not-testable entry is sound: the missing action and refusal observation it named now exist on the surface. The runner's typecheck reports no diagnostics under acceptance/files; its two failures are in adapters/new, which this proposal does not answer for. The { fileId } input shape and Code With Us-only coverage are acceptable: the first is the adapter's to bind, and the criterion names no program. The tests have not run yet; missing-test/R-8.22 closes itself when a result row records them. A verify result of unbound caused by the tests demanding something the criterion does not ask for would turn this into a test-overreaches return.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `c9e930ec5e26628cf50be7cb5a32a54b70e30419`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
