| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T02:32:50.003Z |
| holder | agent:reviewer |

# Do the revised files tests now follow from their criteria and from nothing else?

**Recommendation.** I changed two files in `tests/acceptance/files/`, one per condition that asked for a change.

I changed two files in `tests/acceptance/files/`, one per condition that asked for a change. I could not run the typechecker because the command needed approval I didn't have, so neither change has been compiled. I checked both by hand against `tests/generated/surface.d.ts` and `tests/tsconfig.json` (ES2022, strict), and both should compile. The `derived` dates on these two files are still 2026-09-14, which is later than today, and this return gave me no new header lines. Nothing else in `tests/acceptance/files/` or `tests/acceptance/not-testable.yaml` was touched.

1. **R-8.21: done.** In the test "a profile picture whose content can be read as a PNG is accepted", I removed the checks that the stored image is exactly 40×30. The test now reads `fileImagePicker.currentImage()` on the person's own profile before editing and again after saving. It checks three things: no `rejectedImageError`, a non-empty current image after saving, and that it differs from the one before. That is the acceptance-only form the reviewer asked for. I also rewrote the file's top comment, which had claimed the image "is seen to be stored at its own size". The small PNG builder and the two refusal tests are unchanged.

2. **R-8.17: done.** Both refusal checks used to require the same digits as the limit shown before choosing a file. Now each size in the refusal is converted to bytes: kilo, mega and giga units are read both as powers of 1000 and of 1024, and a bare number counts as bytes. The check passes if any of those is within 0.5% of the stated limit converted the same way. So "10 MB" and "10485760 bytes" both count as naming a 10 MB limit, but a refusal that names no size, or a different one, still fails. The same check covers the upload refusal (`fileUpload.sizeLimitNamedInRefusal`) and the attachment refusal in the form (`fileAttachmentControl.uploadRefusedForSize`). How big the oversized upload is, and every other assertion, stays as it was.

3. **R-8.14 kept alongside R-8.21: not acted on.** This was carried forward as a question for the spec process, not a job for me. Removing `R-8.14.spec.ts` would decide that question here, so I left it exactly as I found it. That ruling is still needed before the suite is used as a pass/fail gate.

4. **R-8.23 and R-8.24 contradict R-8.18: not acted on.** R-8.23 and R-8.24 end by pointing at R-8.4's "service fault" outcome, while R-8.18 says a bad request. That clash is in the criteria themselves, so no change to a test can settle it. Whoever owns the criteria still needs to rule on it, and both test files are unchanged.

No new not-testable entries were needed. Coverage is still 22 tests and 2 not-testable entries out of 24 criteria. I didn't need any surface action or observation that the contract lacks.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised files tests now follow from their criteria and from nothing else? Ruling: approve. The previous ruling returned on two narrow points, and git diff 62b689a..eb3477f limited to tests/acceptance/files shows changes to exactly those two files and nothing else. In R-8.21, 'a profile picture whose content can be read as a PNG is accepted' no longer checks the stored width and height. It now checks no rejectedImageError, a non-empty currentImage after saving, and that it differs from the image before editing. That follows from the criterion's 'is accepted' and matches the form the previous ruling named. In R-8.17, both refusal checks convert every size the message names to bytes, reading kilo/mega/giga as both 1000 and 1024 and a bare number as bytes, and accept a match within 0.5% of the stated limit. That is what 'a message naming the limit' asks for, whatever units the message uses. A refusal naming no size or a different size still fails, and the oversized upload (5% plus 1 KiB over the limit) is too far off to match by accident. No selectors, routes, tables or status codes were added. Moved-line diffing shows the files not-testable entries were reordered and re-wrapped with the same wording, so the R-8.16 and R-8.22 reasons already accepted still stand. Coverage is unchanged at 24 criteria: 22 tests and 2 not-testable. The runner's own typecheck on this revision passed with no diagnostics under acceptance/files. Tier is STANDARD and no residual risk is marked unaccepted, so nothing here needs escalating. What would change the ruling: any files test gaining an assertion its criterion does not state, or a later typecheck failing under acceptance/files.

**Conditions:**
- Carry forward, not a blocker here: R-8.14 is superseded by R-8.21 but still has a spec file that contradicts R-8.21's test (the checks report this as a warning). Whoever runs the spec process still needs to rule on whether tests for superseded defect criteria are kept, before the suite is used as a pass/fail gate.
- Carry forward, not a blocker here: R-8.23 and R-8.24 each end with a clause pointing at R-8.4's service fault, which contradicts R-8.18 (refused as a bad request). Whoever owns the criteria needs to rule on this conflict; the two test files correctly leave that clause unasserted.

### Runner-owned typecheck evidence

Proposal revision: `eb3477f6c173a965ea4ac18d3bd18bea777fe077`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    No diagnostics.
