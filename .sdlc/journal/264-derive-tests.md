---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T15:07:36.635Z"
cost: 0.6176079999999999
turns: 12
session: "36ed7ba8-a8e2-4031-b8f2-8ef27403ee1e"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote the test for the one criterion in this batch, R-8.12. It is now `tests/acceptance/files/R-8.12.spec.ts` and carries the new spec header. I could not type-check it: the compiler command needed an approval nobody was here to give. I did check by eye that every page, observation, persona and seed handle it uses exists in the generated contract. Nothing was added to `not-testable.yaml`.

**What was wrong.** The earlier version got its unreadable file by uploading one as the file-uploader. Before that, it signed in as an administrator and made sure the uploader's and the vendor's accounts were active. The criterion asks for none of those steps, and the upload that followed was refused, so the test failed in its own setup and never made the request the criterion is about.

**How the new version gets its file.** The seed already holds a stored file that only its uploader may read: `seed.stored_files.privateOfFileUploader`. The vendor asks for that one. There is no upload and no administrator step, so setup cannot fail at storing a file, which is what the ruling asked for. For "a file that does not exist" the test uses an id taken from the seed, not an invented value: the published Code With Us opportunity's id, which is well-formed and is not a file's.

**The three tests.** There is one per outcome, each titled with the criterion's own words:
- **Vendor asks for the seeded private file:** the download page reports "not authorized" (`refusedWhenNotPermitted`).
- **Vendor asks for the id no file carries:** the page reports the refusal for an unknown file (`refusedForUnknownFile`). The contract has since added that observation, so the test uses it instead of the general "not permitted" one.
- **Administrator asks for the same missing id:** the page reports "not found" (`notFoundForAdministrator`). The old version also asserted that the administrator was *not* refused. The criterion doesn't say that, so I dropped it.

**Not found in the surface:** nothing this criterion needed was missing. The contract already had a seeded file the vendor may not read, a download page opened by file id, and a separate observation for each of the three answers. I changed nothing outside `tests/acceptance`.