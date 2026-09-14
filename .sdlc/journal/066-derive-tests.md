---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-14T02:32:49.987Z"
cost: 0.7142660000000001
turns: 16
session: "6b3e9aa3-8af4-4035-a734-1ce9c993f020"
---

I changed two files in `tests/acceptance/files/`, one per condition that asked for a change. I could not run the typechecker because the command needed approval I didn't have, so neither change has been compiled. I checked both by hand against `tests/generated/surface.d.ts` and `tests/tsconfig.json` (ES2022, strict), and both should compile. The `derived` dates on these two files are still 2026-09-14, which is later than today, and this return gave me no new header lines. Nothing else in `tests/acceptance/files/` or `tests/acceptance/not-testable.yaml` was touched.

1. **R-8.21: done.** In the test "a profile picture whose content can be read as a PNG is accepted", I removed the checks that the stored image is exactly 40×30. The test now reads `fileImagePicker.currentImage()` on the person's own profile before editing and again after saving. It checks three things: no `rejectedImageError`, a non-empty current image after saving, and that it differs from the one before. That is the acceptance-only form the reviewer asked for. I also rewrote the file's top comment, which had claimed the image "is seen to be stored at its own size". The small PNG builder and the two refusal tests are unchanged.

2. **R-8.17: done.** Both refusal checks used to require the same digits as the limit shown before choosing a file. Now each size in the refusal is converted to bytes: kilo, mega and giga units are read both as powers of 1000 and of 1024, and a bare number counts as bytes. The check passes if any of those is within 0.5% of the stated limit converted the same way. So "10 MB" and "10485760 bytes" both count as naming a 10 MB limit, but a refusal that names no size, or a different one, still fails. The same check covers the upload refusal (`fileUpload.sizeLimitNamedInRefusal`) and the attachment refusal in the form (`fileAttachmentControl.uploadRefusedForSize`). How big the oversized upload is, and every other assertion, stays as it was.

3. **R-8.14 kept alongside R-8.21: not acted on.** This was carried forward as a question for the spec process, not a job for me. Removing `R-8.14.spec.ts` would decide that question here, so I left it exactly as I found it. That ruling is still needed before the suite is used as a pass/fail gate.

4. **R-8.23 and R-8.24 contradict R-8.18: not acted on.** R-8.23 and R-8.24 end by pointing at R-8.4's "service fault" outcome, while R-8.18 says a bad request. That clash is in the criteria themselves, so no change to a test can settle it. Whoever owns the criteria still needs to rule on it, and both test files are unchanged.

No new not-testable entries were needed. Coverage is still 22 tests and 2 not-testable entries out of 24 criteria. I didn't need any surface action or observation that the contract lacks.