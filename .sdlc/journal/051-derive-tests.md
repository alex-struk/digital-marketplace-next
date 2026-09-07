---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-07T16:25:07.079Z"
cost: 1.8290375
turns: 36
session: "08d56f39-8cee-42df-a0bd-8cc922d2cd98"
---

All four conditions are addressed to the extent the workspace permits. Final accounting check passes: 35 accepted R-3 criteria = 28 spec files + 3 not-testable entries (R-3.17, R-3.20, R-3.35) + 4 superseded criteria deliberately left to their replacements.

---

## Journal

**Condition 1 — not done, and deliberately so.** The condition instructs me to restore the thirty-four R-6.\* and R-8.\* reasons verbatim via `git show main:tests/acceptance/not-testable.yaml`. This workspace is not a git repository — there is no `.git` anywhere reachable, `git` itself is outside what I can run here, and a filesystem search turns up exactly one copy of `not-testable.yaml`, the working one. Main's text is not available to me in any form.

The one thing I was sure not to do was paper over that by writing thirty-four fresh reasons of my own, which is precisely the fault the review identified. So I did not touch `tests/acceptance/not-testable.yaml` at all: it is byte-for-byte as I found it, including the three new entries for R-3.17, R-3.20 and R-3.35 that the condition says to keep. Whoever has a checkout with history needs to do the restore — it is a mechanical `git checkout main -- tests/acceptance/not-testable.yaml` followed by re-adding those three entries, and it should be done before this is judged, because the reviewer is right that thirty-four ratified reasons in two other domains are currently carrying prose nobody approved.

**Condition 2 — done.** I deleted four spec files, each for a criterion the spec marks `superseded-by`: `R-3.4.spec.ts` (superseded by R-3.18), `R-3.5.spec.ts` (by R-3.19), `R-3.16.spec.ts` (by R-3.20) and `R-3.29.spec.ts` (by R-3.35). That clears both contradictions the review named — the suite no longer asserts both that the contact phone is discarded and that it is saved, and no longer drives Edit/Save controls that R-3.18 says are never offered. I did not add not-testable entries for these four: they are dropped as superseded, not as unreachable, and all four were in fact reachable through the surface. Worth flagging for whoever rules this: R-3.16 and R-3.29 had working tests, and their replacements R-3.20 and R-3.35 are both filed not-testable, so those two areas of behaviour now have no executable coverage at all. That is what the condition asks for and I think it is right — a test for a superseded criterion asserts the old defect — but it is a real coverage loss rather than a bookkeeping one.

**Condition 3 — done.** R-3.18 previously asserted only the two refusals, which is its least novel claim; its actual new content is that the controls are not offered in the first place. I added a first test that reads `organizationEdit.organizationTab()` as the owner and then as the organization administrator, requiring "Edit" and "Archive" to be present in the first reading and absent from the second. I made it differential rather than a bare absence check on purpose: an absence assertion against free text passes just as happily when the observation returns nothing at all, which is the failure mode the reviewer caught elsewhere in this slice. Taking the owner's reading first means the test fails loudly if the tab text never names those controls for anyone, instead of passing for the wrong reason. The two refusal tests are untouched.

**Condition 4 — done, with a substitution rather than a bare deletion.** I removed the `"Admin Rights Given"` changelog assertion from R-3.12's first test; that wording is R-3.33's claim and belongs only there. Deleting it outright would have left the test with no assertion, so I replaced it with a differential reading of `organizationEdit.teamMemberRow()` taken immediately before and after the grant, asserting the row changes. That stays on one page with one persona, reads the team list where membership status actually lives, and commits to no vocabulary the criterion does not state. I judged this to be within "one assertion inside a file"; if a later reviewer disagrees, the narrower reading of the condition leaves the test assertion-free, which seemed worse.

I changed nothing else. No header `derived` date was rewritten anywhere — both edited files already carried today's date, so the question did not arise, and I left the twenty-six untouched organizations specs and every other domain alone.

**Verification is partial.** `tests/node_modules` does not exist, so I could not run `npm run typecheck` or the suite. I checked the separation rules by hand across the whole organizations directory instead: no `page.`, `locator(`, `getBy`, `data-testid`, `querySelector`, `goto(`, no URL- or route-shaped string literals, and every import is from `../../fixtures`. Every action and observation I used is named in `spec/contract/surface.yaml`. That is a static check, not a green run.

**Surface gaps the contract should close.** Two of these edits were harder than they should have been, both for the same reason — the organizations pages report state well but report *affordances* not at all.

- `organization-edit` has no observation of which controls a viewer is offered. The proposal pages have `available_actions`; the organization management page has nothing equivalent, so R-3.18's central claim can only be tested by reading control names out of `organization_tab`'s free text. An `available_actions`, or an explicit `edit_control_offered` / `archive_control_offered` pair, would let that test say what R-3.18 says instead of approximating it.
- `organization-edit` has no observation of a member's administrator status. There is `owner_badge` and `pending_badge` but no admin equivalent, which is why R-3.12's grant has to be read as a difference in `team_member_row` rather than asserted directly. An `admin_badge` observation would fix that, and would also give R-3.12 a check that survives unrelated changes to the row's layout.