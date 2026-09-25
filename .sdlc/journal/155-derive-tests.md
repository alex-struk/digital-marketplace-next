---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T14:10:37.853Z"
cost: 0.7591508
turns: 21
session: "63d36247-fbb8-465c-b3e4-ceece5abd3b6"
---

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