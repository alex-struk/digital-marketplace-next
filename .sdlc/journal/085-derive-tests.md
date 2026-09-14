---
stage: "derive-tests"
title: "derive-tests: post-checks failed"
at: "2026-09-14T23:37:53.368Z"
cost: 2.5442069999999997
turns: 48
session: "ce909108-eeaf-4eeb-9180-04ba44ac6974"
---

I rewrote one test and moved the other criterion to not-testable.yaml. That's one of two criteria with a test; the other is blocked by a single missing observation. I couldn't type-check the result because TypeScript isn't installed in the workspace, and nothing was run against a target.

**R-1.3 (has a test).** I rewrote `tests/acceptance/opportunities/R-1.3.spec.ts` in response to the redo note, with the new header. There are still two tests, one for what staff see and one for what an administrator sees.
- **The fix:** before the staff account (`seed.users.staffOne`, the account `persona.publicSectorStaff` signs in as) does anything, an administrator makes sure it holds no administrator rights. The administrator opens `userProfile` for `seed.users.staffTwo` and reads `accountType()`. Nobody can sign in as that account, so no test can promote it, which makes it a reliable ordinary staff account. If `staffOne`'s account type differs, the administrator withdraws the rights with `toggleAdminPermission()` and the test requires the two to match before going on.
- **Why compare instead of checking for a word:** the contract doesn't say what `accountType()` returns, so matching against a word like "admin" would be a guess.
- **The rest is unchanged:** staff read `opportunityList.unpublishedGroup()` and `openGroup()`, and the administrator reads `opportunityDashboard.allOpportunitiesForAdministrator()`.
- **Kept to the given/when/then:** the tests check drafts only. The criterion's statement also mentions opportunities under review, but its given/when/then doesn't.

**R-1.21 (blocked).** I deleted its test file and added an entry beginning `blocked:` to `tests/acceptance/not-testable.yaml`.
- **Where it breaks:** the redo asks for a saved draft to be submitted and for the test to read what the author is told. Saving a draft sends the author to `opportunityCwuEdit`, and nothing on that page reads a message. `fieldError()` exists only on the create pages, which is the unsaved form the redo rejected.
- **Why the form tab can't stand in:** `opportunityTab()` returns the form itself, and its own "Completion Date" and "Location" labels would make any check on the wording meaningless.
- **Why the partial test went too:** I didn't keep a test that only checks the refusal. It would pass a system that names the missing field, which is exactly what the criterion forbids. A criterion can't have both a test file and a not-testable entry.
- **What's already reachable:** the refusal itself can be seen today, because `opportunityCwuView.status()` stays at draft. The only thing missing is the message.

**Missing from the contract:** an observation on `opportunity-cwu-edit` that returns the message shown when `submit_for_review` is refused (something like `submit_for_review_refusal`). `opportunity-swu-edit` and `opportunity-twu-edit` need the same. Adding it would unblock R-1.21 across all three programs.

I left `redo.yaml` untouched; its entries for R-1.3 and R-1.21 are for whoever manages that file to clear.

## Fix turn

I made no changes this pass, because the conflict the check reported is no longer on disk. I searched all of `tests/acceptance/` and found no `R-1.21.spec.ts` in any domain folder. The only files that mention R-1.21 are the `not-testable.yaml` entry and the entry in `redo.yaml`. The opportunities folder was last changed after `not-testable.yaml` was written, so the old file from the previous derivation was most likely deleted after the check took its snapshot. There was nothing left to delete. I kept the `blocked:` entry rather than writing a test, and I checked it again against `tests/generated/surface.d.ts` first. The entry is still right. `opportunityCwuEdit`, `opportunitySwuEdit` and `opportunityTwuEdit` all offer `submitForReview()`, but none of them has a refusal or error observation. The only `fieldError()` is on the create pages, and those read a form that was never saved as a draft, which the redo note specifically rules out. So a test can show that the draft keeps its status after being refused, but it cannot read what the person is told. That message is the half of the criterion that matters. What would unblock it is one observation on each of the three edit pages, such as `submitForReviewRefusal()`. I also checked that R-1.3 has only its test file and no `not-testable.yaml` entry, so it doesn't have the same conflict. If the check still finds R-1.21 in both places, it is reading a copy of the workspace other than the one here.

tests/acceptance/not-testable.yaml: R-1.21 also has tests/acceptance/<domain>/R-1.21.spec.ts. A criterion is one or the other, never both. The file may be left over from an earlier derivation rather than written by this run: either delete it, or delete the not-testable entry and make the test work.
tests/acceptance/not-testable.yaml: R-1.21 also has tests/acceptance/<domain>/R-1.21.spec.ts. A criterion is one or the other, never both. The file may be left over from an earlier derivation rather than written by this run: either delete it, or delete the not-testable entry and make the test work.