---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the R-8.12 finding: when a vendor asks for a file that doesn't exist, the adapter now hands that refusal to the test instead of reading it as \"\"."
opened: 2026-09-29T17:14:36.990Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
