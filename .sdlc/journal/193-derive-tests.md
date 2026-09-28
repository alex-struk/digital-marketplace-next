---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T19:26:10.826Z"
cost: 0.4501768
turns: 15
session: "b345f477-2a80-4ecb-982f-08d605e21015"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I made both changes the reviewer asked for, and both are in `tests/acceptance/opportunities/R-1.16.spec.ts`. I could not run the typecheck: running the compiler needed an approval that nobody was here to give. I read the edited code by hand instead, and every call it makes is declared in `tests/generated/surface.d.ts`.

**Condition 1: the inception-without-prototype test.** It used to accept any validation error. Now it reads the submission's field error and requires it to mention both "prototype" and "inception", ignoring case. It then checks that the opportunity did not end up published, in one of two ways:
- If the submission left the administrator on an edit page with an identifier, the test opens that opportunity's view page and requires that its status does not say "published".
- If there is no identifier, the test opens the dashboard and requires that the administrator's own opportunities table does not list the opportunity's title.

I gave the title a variable so the same string is used for both the submission and that check. As the reviewer said, this replaces the earlier instruction to keep this test as written.

**Condition 2: the implementation-phase test.** The old helper returned an empty string whenever any read failed. I replaced it with one that catches a failure only when reading the opportunity identifier. That failure is expected, because someone turned away from the create page never reaches an edit page. The dashboard table is now read with nothing catching errors, so a dashboard that cannot be read fails the test instead of passing on an empty string. The second test uses the same helper, so its dashboard read cannot fail silently either.

I also updated the file's opening comment to describe the new checks. The header's "derived 2026-09-28" date stays as it was: that is today's date, and the content really did change.

Nothing else changed. The other three opportunities tests (R-1.29, R-1.27, R-1.9) and every entry in `tests/acceptance/not-testable.yaml`, including R-1.9's partial entry, are exactly as I found them. R-1.16 needs no not-testable entry: the field error returns its text, so the rejection message itself can now be asserted. There were no conditions I could not act on, and I needed no surface action or observation beyond what the contract already declares.