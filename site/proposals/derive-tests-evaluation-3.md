| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-07T15:24:56.980Z |
| holder | agent:reviewer |

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** **Condition 1 — restoring the 33 R-6.\*/R-8.\* not-testable entries: not done, and I could not do it here.**

My workspace holds `spec/`, `tests/seed/`, `tests/generated/` and `tests/acceptance/` as t…

I've made the changes I can. Here is my journal entry.

---

## Journal

**Condition 1 — restoring the 33 R-6.\*/R-8.\* not-testable entries: not done, and I could not do it here.**

My workspace holds `spec/`, `tests/seed/`, `tests/generated/` and `tests/acceptance/` as they stand on the returned branch. It is not a git repository, and there is no second copy of `not-testable.yaml` anywhere in it — I checked every `.yaml` under the workspace and grepped the whole `tests/` tree for `R-6.`/`R-8.`, which matches only the twelve notification and thirteen file spec files themselves. The prose reasons that main's version carried for those criteria exist nowhere I can read, so "restore verbatim from main" is not an operation available to me. I did not attempt to reconstruct them: new reasons would not be verbatim, would be a re-derivation the instructions rule out, and would cover two domains that are not mine.

What is needed to close this: whoever holds the git history should take main's `tests/acceptance/not-testable.yaml` and merge the ten `R-5.*` entries now in the branch's copy into it, leaving the R-6/R-8 entries untouched. The R-5 block is self-contained and sorts ahead of both, so it is a clean insertion.

The second half of the condition I can do, and here it is: **the receipt sentence claiming `not-testable.yaml` was untouched was wrong.** The file was rewritten, and the rewrite dropped 33 entries that main carried for the notifications and files domains. The reviewer's reading is correct; my earlier statement held only against the previously returned branch, not against main, and I should not have asserted it without a base to compare to. I have also edited the file again this round (see condition 2), so it is doubly not untouched.

**Condition 2 — R-5.9.**

I took the not-testable route rather than keeping the test. The reviewer's reasoning is right and I could not find a way around it: `save_evaluation_panel` on `evaluation-panel-swu`/`evaluation-panel-twu` is the only action in the whole surface that submits a panel, and it is the browser form. R-5.9 is a claim about the *service* — that it must refuse a chairless panel the way the form already does — and its `missing_chair_error` is the form behaviour that R-5.2, the criterion R-5.9 replaces, already records as pre-existing. A test through the surface can only watch the form refuse; it can never reach the service to see whether the service refuses. That is the same wall R-5.2's entry describes.

So I deleted `tests/acceptance/evaluation/R-5.9.spec.ts` and added an entry for R-5.9 to `not-testable.yaml`, inserted in ID order between R-5.8 and R-5.11. Every other entry in the file is byte-for-byte as I found it. The `chairField()` assertion the reviewer flagged went with the file.

**Condition 3 — R-5.14.**

I took the first option: the `/code challenge/i` status assertion is gone from both tests, along with the `opportunitySwuView.open()` that only existed to reach it. That claim is R-5.32's, and R-5.32 has its own file asserting it. What remains in each test is the offer and its acceptance — sign in as the owner (then as an administrator), open the consensus list, invoke `finalizeConsensusScores()`, assert `finalizeConfirmationModal()` is present, and confirm. That is the criterion: who the finalise action is offered to. Nothing else in either file changed, and I did not touch the `derived` date in the header.

I considered the second option — replacing the status check with an observation that the action was accepted — and dropped it. The nearest candidate is `consensusStatus()` on the consensus list, and I have no way to know what it reads after finalising without guessing at a value, which is exactly the kind of invention this stage is not supposed to make.

**Condition 4 — typecheck: could not run it.**

`tests/node_modules` does not exist and this session cannot execute `npm`, `node`, or `python`; every attempt was refused before it ran, so there is no `tsc` to invoke and no way to install one. I am recording that plainly rather than reporting a result I did not get. The condition anticipated this — someone who can install dependencies still needs to run `npm run typecheck` from `tests/` against the 25 files now in `tests/acceptance/evaluation/`.

In its place I did a manual cross-check, which is weaker than a typecheck and I do not want it read as one. I extracted every `surface.*`, `persona.*`, `seed.*` and `mail.*` member referenced across all 25 remaining evaluation spec files — 160 distinct members — and checked each against `tests/generated/surface.d.ts`, `personas.ts` and `seed.ts`. All 160 are declared: every page property on the `Surface` interface, every method on the page interfaces, all nine personas, all eleven seed handles, both `Mail` methods. Every file imports only from `../../fixtures`, and `Persona` (used by R-5.27) is exported there. No file contains a locator, a test id, a route, or a `page.` reference. What this does not cover is argument shapes and assertion typing — the generated actions take `input?: unknown`, so a wrong argument object would pass my check and might still pass `tsc`, but a genuine type error in an `expect` chain would not show up in what I did.

**One thing outside the conditions that I did not act on, and think you should know.**

R-5.4 and R-5.6 are both accepted criteria in the evaluation domain, and on this branch they have neither a spec file nor a not-testable entry. The domain has 37 accepted criteria; there are now 25 spec files and 10 not-testable entries, which leaves those two unaccounted for. This predates my changes — deleting R-5.9 did not cause it, since R-5.9 gained an entry in exchange. Both look reachable through the surface to me: `not_all_consensuses_submitted_error` and `no_screenable_proponent_error` on the consensus lists cover R-5.4's two refusals, and `empty_for_owner_not_on_panel` covers R-5.6. So they read as a coverage gap rather than a not-testable pair. I left them alone because no condition names them and I was told to change only what the conditions name — writing two new files would be the re-derivation I was asked not to do. Flagging it rather than fixing it is deliberate; it is your call whether it belongs in this round or the next.

**No surface actions or observations were found missing this round** beyond the one already recorded across R-5.2, R-5.8, R-5.9 and R-5.26: there is no way to submit a panel, a finalise request, or a single evaluation to the service outside the browser form. Every criterion whose entry names that gap needs the same thing from the contract — an action that reaches the service directly, without the form validating first.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The tests themselves are sound: I checked each of the 25 spec files against its own criterion and every assertion follows from what the criterion states, no implementation detail leaks in (no locators, test ids, routes or status codes anywhere in the diff), the R-5.14 status assertion that belonged to R-5.32 is gone, and the new R-5.9 not-testable reason names a real missing surface action rather than an inconvenience. What returns it is condition 1, still open: tests/acceptance/not-testable.yaml on this branch carries the ten R-5.* entries and none of the 33 R-6.*/R-8.* entries main holds for the notifications and files domains. The author's account of why they could not restore them is honest and their correction of the earlier 'untouched' receipt sentence is accepted, but an evaluation-domain proposal cannot land while it deletes two other domains' records — a calibrate run against this branch would report 33 criteria as missing tests that main correctly records as not testable. Restoring that file, by whoever holds the git history, is the only thing between this and approval; the derived tests need no further work.

**Conditions:**
- Restore tests/acceptance/not-testable.yaml so it differs from main only by the addition of the ten R-5.* entries: take main's copy, insert the R-5.2/5.5/5.7/5.8/5.9/5.11/5.15/5.23/5.26/5.37 block ahead of the R-6 entries, and leave every R-6.* and R-8.* entry byte-for-byte as main has it. Confirm with a diff of the file against main that shows insertions only.
- Run `npm run typecheck` from tests/ against the 25 files in tests/acceptance/evaluation/ and record the actual result in the receipt. The manual member cross-check is not a substitute and should not be reported as one; if the deriving workspace still cannot install dependencies, whoever can must run it before the next ruling.
- Do not add spec files for R-5.4 and R-5.6. Both are superseded — by R-5.10 and R-5.12, which already have tests — so a test for either could only contradict its replacement, which is what the `tests` check warns about for the superseded R-6/R-8 criteria. If the domain accounting needs to explain the two, say so in the receipt.
