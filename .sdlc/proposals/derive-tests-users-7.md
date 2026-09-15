---
gate: G3
question: "Do the revised users tests now follow from their criteria and from nothing else?"
recommendation: "I rewrote the R-4.32 test and changed nothing else."
opened: 2026-09-14T23:59:34.300Z
---

# Do the revised users tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote the R-4.32 test and changed nothing else.

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the revised users tests follow from their criteria and from nothing else, specifically whether R-4.32 now meets the condition the previous ruling returned it on. It does. The test no longer assumes that nothing is ticked when the export dialog opens. It finds the no-kind combination by trying all kind toggles under two different field states, at most one of which can have no field ticked, so exactly one combination leaves export unavailable under both. It finds the no-field combination the same way, applies both to reach a known empty state, then checks kind only (unavailable), field only (unavailable) and one of each (available). Every assertion, including the two exactly-one checks, follows from the criterion's rule that at least one kind and one field must be chosen. The new inputs are the criterion's own names, and nothing about how the app is built leaks in. The runner's typecheck passed with no diagnostics under acceptance/users, and every check is ok; the warnings concern superseded tests in other domains. The R-4.14 and R-4.31 rewrites and the not-testable.yaml change come from the returned derive-tests-users-stale-1 run, which that ruling accepted. The not-testable.yaml change moves five entries to the end of the file without changing their text. No protected path is touched, the tier is STANDARD and no residual risk is unaccepted, so nothing escalates. The ruling would change to return if the old app's export choices turned out not to be independent toggles, since the test's search depends on that.

**Conditions:**
- R-4.32: approved as written; its redo.yaml entry, and the R-4.14 and R-4.31 entries the previous ruling said may be removed, are for the stage that maintains redo.yaml to remove.
- For the adapter owner: userList.toggleExportUserType and toggleExportField pass the given name to tick() as a label match. Confirm that 'public sector employee', 'vendor', 'first name', 'last name', 'email address' and 'organization name' each reach the matching checkbox in the old app's export dialog (its defaults suggest labels like 'Government Users' and 'Email', which those names would not match). Otherwise R-4.32 fails for an adapter reason, not a product one.
- For the adapter owner, carried forward: signIn must treat the deactivated-vendor persona as a normal sign-in once the account has been reactivated, or R-4.14's setup fails for a reason that is not the product's.

### Runner-owned typecheck evidence

Proposal revision: `1142eddc3e7f9cb9d4d469ac58becf23008765d9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    No diagnostics.
