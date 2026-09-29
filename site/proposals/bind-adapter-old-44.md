| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T17:14:36.990Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the R-8.12 finding: when a vendor asks for a file that doesn't exist, the adapter now hands that refusal to the test instead of reading it as "".

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-8.12 finding: when a vendor asks for a file that doesn't exist, the adapter now hands that refusal to the test instead of reading it as "". I could not type-check the change, because both attempts to run the TypeScript compiler were refused approval. Nothing else was run: no test and no calibration pass.

**What the target does.** I checked the running target at http://localhost:4300 through the browser, using the session routes, with a made-up all-zeros file identifier:
- **Vendor 1:** gets 401 `["You do not have permission to perform this action."]`, both on `/api/files/:fileId?type=blob` (the download) and on `/api/files/:fileId` (the description).
- **Administrator:** gets 404 `["File not found."]` on both addresses.

So a vendor is refused as not authorized, and only an administrator is told the file is missing. This matches the finding.

**The fix.** `refusedForUnknownFile` used to report only a 404, which is why the vendor's 401 read as "". It now hands over a 401 or 403 refusal whole, status and body, as the other refusal readers in the adapter do. `notFoundForAdministrator` is the only reader that still looks for a 404.

**Both pages changed.** I made the same change on the file-description page as well as the file-download page. Both implement this observation the same way, and I confirmed the target answers identically on both routes.

**Bindings file unchanged.** `bindings.yaml` already lists `refused_for_unknown_file` and `not_found_for_administrator` as bound on both pages, which is still true.

Every route involved resolved on the target. I changed nothing outside `tests/adapters/old/`, and no value from the environment went into any file.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation, and nothing else, now that the R-8.12 finding has been addressed? Ruling: approve. R-8.12 says a vendor asking for a nonexistent file is answered as not authorized and only an administrator is told it was not found. The author probed the target and found a vendor gets 401 'You do not have permission to perform this action.' and an administrator gets 404 'File not found.' on both the download and description routes. Previously refusedForUnknownFile accepted only 404, so it read the vendor's 401 as empty. It now accepts 401/403 on both pages, while notFoundForAdministrator keeps 404. The binding remains a locator: it hands the status and body over through the same refusal() helper as the other refusal readers, and the test decides whether that passes. Only tests/adapters/old/index.ts changed. Nothing under tests/acceptance was touched, and bindings.yaml still lists both observations as bound. The runner's typecheck exited 2, but all of its diagnostics are under adapters/new/ and none under adapters/old/, the part this proposal answers for. What would change the ruling: a calibration run in which the vendor case of R-8.12 still reads empty, or an administrator's 404 being accepted by refusedForUnknownFile, would point back at this binding as adapter-wrong.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cd6d02c15edad124f2c89c279e95e565cba7afd2`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
