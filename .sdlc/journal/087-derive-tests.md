---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-14T23:59:34.285Z"
cost: 0.8414385
turns: 16
session: "eeb451a4-5ff7-4ce5-9b93-f07cd53770ec"
---

I rewrote the R-4.32 test and changed nothing else. I couldn't type-check it or run it: TypeScript isn't installed in the workspace, and there's no app to run against.

**Condition 1 (R-4.32).** I rewrote the one test in `tests/acceptance/users/R-4.32.spec.ts`, keeping both header lines as they were; the derived date was already today's. The test no longer checks that export is unavailable as the dialog opens. Nothing on the user list reports which kinds and fields are ticked, so the test finds the empty state using only whether export is available:

- **Finding "no kind ticked".** It tries every combination of the two kind toggles and records which ones leave export unavailable. It does this once with the fields as they opened, and again after toggling email address. Those two field states differ, so at most one of them has no field ticked. The kind combination that is unavailable in both runs is therefore the one that leaves no kind ticked.
- **Finding "no field ticked".** It does the same over all sixteen combinations of the four field toggles, once with kinds as they opened and once after toggling vendor.
- **Assertions and checks.** The test asserts that each search finds exactly one combination; if the rule holds, it always will. It then applies both combinations, so nothing is ticked, and runs the three checks in order: vendor alone is unavailable, email address alone is unavailable, and vendor plus email address is available. Finally it cancels the export.

Every step goes through actions and observations the user list already has. The only new inputs are "public sector employee", "first name", "last name" and "organization name". They follow the same shape the adapter already receives for vendor and email address (`{ userType }` and `{ field }`), with the names taken from the criterion. Whoever owns the adapter should confirm it handles them. The comment about what the exported file contains stays as it was, because nothing can read the exported document. Since the rewrite could be done, R-4.32 has no entry in `not-testable.yaml`, and I changed nothing there.

**Condition 2 (redo and applied entries).** I left `tests/acceptance/redo.yaml` alone; its R-4.32 entry is still there. Your instructions let me change only the spec file, a not-testable entry or one assertion, so removing that entry now the rewrite is done is for a later stage. The workspace has no `applied.yaml`, so there was nothing to keep or remove there.

**Condition 3.** I did not touch R-4.14 or R-4.31. Every other file in `tests/acceptance/users/` and every entry in `not-testable.yaml` is as I found it.

**Condition 4.** This one is for the adapter owner, not me. I'm passing it on: sign-in has to treat the deactivated-vendor persona as a normal sign-in once the account is active again, or R-4.14's setup will fail for a reason that has nothing to do with the product.

One risk in the new approach: the search reads availability straight after each toggle and can't wait for a known answer, because the answer is what it's finding out. If the export control is slow to update after a toggle, one of the two "exactly one" assertions will fail, which should make that easy to spot.

The contract still has no observation on the user list of which export kinds and fields are ticked. With one, this test could drop the search, and the currently untestable part of R-4.32 would still need an observation that returns the exported document's contents.