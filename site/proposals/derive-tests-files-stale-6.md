| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T15:07:36.742Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I rewrote the test for the one criterion in this batch, R-8.12.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for the one criterion in this batch, R-8.12. It is now `tests/acceptance/files/R-8.12.spec.ts` and carries the new spec header. I could not type-check it: the compiler command needed an approval nobody was here to give. I did check by eye that every page, observation, persona and seed handle it uses exists in the generated contract. Nothing was added to `not-testable.yaml`.

**What was wrong.** The earlier version got its unreadable file by uploading one as the file-uploader. Before that, it signed in as an administrator and made sure the uploader's and the vendor's accounts were active. The criterion asks for none of those steps, and the upload that followed was refused, so the test failed in its own setup and never made the request the criterion is about.

**How the new version gets its file.** The seed already holds a stored file that only its uploader may read: `seed.stored_files.privateOfFileUploader`. The vendor asks for that one. There is no upload and no administrator step, so setup cannot fail at storing a file, which is what the ruling asked for. For "a file that does not exist" the test uses an id taken from the seed, not an invented value: the published Code With Us opportunity's id, which is well-formed and is not a file's.

**The three tests.** There is one per outcome, each titled with the criterion's own words:
- **Vendor asks for the seeded private file:** the download page reports "not authorized" (`refusedWhenNotPermitted`).
- **Vendor asks for the id no file carries:** the page reports the refusal for an unknown file (`refusedForUnknownFile`). The contract has since added that observation, so the test uses it instead of the general "not permitted" one.
- **Administrator asks for the same missing id:** the page reports "not found" (`notFoundForAdministrator`). The old version also asserted that the administrator was *not* refused. The criterion doesn't say that, so I dropped it.

**Not found in the surface:** nothing this criterion needed was missing. The contract already had a seeded file the vendor may not read, a download page opened by file id, and a separate observation for each of the three answers. I changed nothing outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the rewritten R-8.12 tests follow from the criterion and from nothing else. Approved. Each clause has its own test. A vendor asking for a file they may not read (the seeded file only its uploader may read, which has no read-access rows) is refused. A vendor asking for an identifier no file carries (a seeded opportunity id) is refused. An administrator asking for that same identifier is told it was not found. The unknown-file observation the second test now uses is bound in the contract to the same refusal as the not-permitted observation, so it still checks the criterion's 'not authorized' answer. The dropped 'administrator is not refused' assertion was never in the criterion, so dropping it is correct. The administrator step, the account reactivation and the upload that made the earlier version fail in its own setup are gone, which is what the redo asked for. The runner's typecheck reports no errors under acceptance/files/; the two it does report are in adapters/new/, which this proposal does not answer for. This would become a return if the contract separated the unknown-file refusal from the not-authorized refusal, or if the seeded private file turned out to be readable by the vendor.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `11c2e913d20e37a68f277c4aef6bf6d26a2fdeec`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
