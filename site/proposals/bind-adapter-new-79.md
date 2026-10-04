| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T09:48:36.384Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't run the TypeScript compiler or a YAML parse: both commands needed approval, which this unattended session can't give.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've answered both conditions in this run, so neither is deferred. I couldn't run the TypeScript compiler or a YAML parse: both commands needed approval, which this unattended session can't give. Instead I ran the new locator logic against the live page in the browser, and on the vendor's Scoresheet it read "87.5%" and "1 of 2".

**Condition 1: scores and rank on the staff proposal screen (Sprint With Us and Team With Us).** I signed in as the administrator and opened `/opportunities/sprint-with-us/00000000-0000-4000-a018-000000000001/proposals/00000000-0000-4000-a018-000000000101`. The screen now has a "Scores" region under the header terms: Team questions 100%, Code challenge 80%, Team scenario 70%, Price 100%, Total score 87.5%, Rank 1 of 2. Its sibling proposal ...a018...102 reads 72.75%, rank 2 of 2, and the earlier-walked ...a016...101 now shows its scores too.
- I also re-walked Team With Us as asked. The same region appears on ...a032...101 (Resource questions 100%, Challenge 80%, Price 100%, Total score 92%, Rank 1 of 1) and on ...a033...101.
- On ...a032...102, which is still at the challenge, the region reads "Not scored" and "Not yet calculated" and has no Rank term at all.
- `proposal-swu-view` now binds `questions_score`, `challenge_score`, `scenario_score`, `price_score`, `total_score` and `rank`. `proposal-twu-view` now binds `questions_score`, `challenge_score`, `price_score`, `total_score` and `rank`.
- Each one reads its term's value from the "Scores" region as shown. A figure the proposal doesn't hold yet ("Not scored", "Not yet calculated", a dash, or no term) returns empty, because the page was reached and has nothing there. The old binding did the same.

**Condition 2: the vendor's Scoresheet tab (`proposal-swu-edit` and `proposal-twu-edit`).** I signed in as the organization owner (the persona whose username is test-vendor-2) and opened the awarded Sprint With Us proposal 00000000-0000-4000-a020-000000000101 at `.../edit`. "Proposal sections" now offers Proposal, Scoresheet and History. The Scoresheet (`?tab=scoresheet`) says "During evaluation, evaluators saw this proposal as Proponent 1." and lists Team questions, Code challenge, Team scenario, Price, Total 87.5% and Rank 1 of 2.
- Proposals that aren't decided still offer only Proposal and History, with no score in the header. I checked Sprint With Us ...a018...101 (evaluated at the team scenario) and Team With Us ...a035...101 (under review at the challenge).
- `scoresheet_tab` is now bound on both pages. It opens the Scoresheet and returns the region's text. When the screen doesn't offer the tab, it returns empty instead of throwing, since the page was reached and is withholding the scoresheet before the decision. The old binding behaved the same way.
- `total_score` and `rank` on both edit pages now read the Scoresheet's "Total" and "Rank". Before, they looked for header terms the screen never draws. They then return to whichever section was open, so a later reader of the Proposal section isn't stranded on the Scoresheet.
- No Team With Us proposal is seeded as awarded or not awarded, so I couldn't see a Team With Us Scoresheet. `proposal-twu-edit` shares the same code path, and on an undecided Team With Us proposal the tab is correctly absent.

**Judgement calls a reviewer should check:**
- **Rank format.** The screen draws a rank as "1 of 2". `surface.yaml` names the form "1st"/"2nd", and the old binding returned "1st", so the new rank readers on all four pages convert "N of M" to the ordinal. If R-2.32 or R-1.27 actually expects "1 of 2", this conversion is the thing to change. The existing Code With Us `rank` (accepted earlier) still returns the raw "1 of 2"; I left it alone because neither condition names it.
- **Anonymous proponent name.** The vendor's Scoresheet now also carries the anonymous name ("…as Proponent 1"), which `anonymous_proponent_name` doesn't read yet. Neither condition named it, so I left that binding unchanged; it is a likely candidate for the next round.

I also updated the explanatory comments in `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml` so they no longer claim these screens show no scores. Nothing else changed, and no route in `surface.yaml` failed to resolve for the pages I touched.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does bind-adapter-new-79 bind every surface action and observation on the new target, and nothing else? Ruling: approve. The diff touches only tests/adapters/new (bindings.yaml, index.ts) plus pipeline records, and nothing under tests/acceptance. The new bindings are navigation and locators only: scoreTermIn reads term/definition pairs from the named 'Scores' or 'Scoresheet' region, openTeamScoresheet clicks the vendor's Scoresheet section, and teamScoresheetTerm returns to the section that was open. None asserts or decides an outcome. Mapping 'Not scored', 'Not yet calculated', a dash or a missing term to empty reads a reached page that holds no figure, as the earlier binding did. The 'N of M' to ordinal rank conversion cannot change an outcome: R-2.32 checks the vendor's rank only for whether it contains a digit (spec lines 57 and 77), and R-1.27 reads only totalScore. The remaining unbound members (stage tabs, score control, wrong_stage_error, offered_score_actions) still carry real reasons naming what the walked screen lacks. The runner's typecheck on revision 2f39efbc passed with no diagnostics under adapters/new. Both open revision requests from build-slice-16-3 are answered. What would change the ruling: a verify run showing the Scores or Scoresheet readers return the wrong term or fail to find the region the walk describes, or a vendor screen that shows scores before the proposal is decided while the adapter reads empty.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2f39efbccb48873b5b30b3ef6bfa76b666fb48d6`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
