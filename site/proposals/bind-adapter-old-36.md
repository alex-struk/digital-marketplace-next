| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T03:17:24.975Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added both new observations to the adapter, so `proposal-swu-view` and `proposal-twu-view` now both have `offered_score_actions`, and `tests/adapters/old/bindings.yaml` lists both as `bound`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added both new observations to the adapter, so `proposal-swu-view` and `proposal-twu-view` now both have `offered_score_actions`, and `tests/adapters/old/bindings.yaml` lists both as `bound`. Every page route in the contract already resolves on the target. I couldn't run the TypeScript type check or the adapter itself: the type check needed approval this session doesn't have. What I did test was the same logic, rebuilt in the browser tool against the running target.

**What the target shows.** As the administrator, I opened the seeded proposals the contract names and looked at every stage tab. A stage that is open for scoring shows "Enter Score" in the top bar, or "Edit Score" once a score exists. A stage the opportunity hasn't reached shows the sentence "…can be scored once the opportunity reaches…" and no score button. A stage the proposal has already been carried past shows only its other controls, such as "Screen Out". On the Team With Us pages, the Resource Questions tab never offered a score for any proposal I opened. That score is entered through the consensus instead, so the reader lists it only if a score button appears there.

**How the reader works.** For each scored stage it finds that stage's tab link and loads the tab from its own address. It then looks for "Enter Score" or "Edit Score" in the top bar, or inside the "Actions" menu when the bar groups its controls there. It returns this page's own action names, one per line, and an empty string when none is offered. An empty answer means the tabs were reached and simply had no score button, which is what the contract describes.

I load each tab from its address rather than clicking it for a reason. My first version clicked from tab to tab and reported `score_team_scenario` wrongly for the proposal still at the code challenge. The code challenge tab's "Enter Score" button was still in the top bar just after switching to the Team Scenario tab, and the reader counted it.

**Results against the seeded proposals, all matching what the contract expects:**

| Seeded proposal | Result |
|---|---|
| `swuScreenedIntoScenarioEarly` | empty |
| `swuScreenedIntoCodeChallenge` | `score_code_challenge` |
| `twuScreenedIntoChallengeEarly` | empty |
| `twuChallengeLast` | `score_challenge` |
| `twuChallengeScored` (already scored; offers "Edit Score") | `score_challenge` |

None of these proposals put the score inside an "Actions" menu, so that branch of the reader hasn't run against the target.

I changed nothing outside `tests/adapters/old/`, and none of the existing bindings were touched.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-old-36 bind offered_score_actions on proposal-swu-view and proposal-twu-view, and nothing else? Approved. The binding is navigation and locators only: for each stage it opens that stage's tab by its own address, looks for 'Enter Score' or 'Edit Score' in the top bar or inside the 'Actions' menu, and returns the page's own action names, one per line. It decides nothing about whether a test passes. It matches the surface contract's definition of the observation (a stage's score is offered only on its tab, only once the opportunity has reached that stage and the proposal is in it) and the seeded cases the contract names, which the author checked against the running target. Only tests/adapters/old/ changed, nothing under tests/acceptance, and no unbound entries were added. The runner's typecheck exited 2, but it reports no diagnostics under adapters/old/; the two it reports are in adapters/new/, which this proposal does not answer for. Known weaknesses that do not warrant a return: an empty answer rests on a 2.5-second wait (cut short when the tab says it cannot be scored yet), so a very slow page could read as offering nothing; the reader leaves the browser on the last stage tab it opened; and the 'Actions' menu branch has not run against the target. Calibration exercises all three. The ruling would change if typecheck diagnostics appeared under adapters/old/, or if a calibration failure were traced to this reader.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `31011684c132a913756e30e1f0f3dc37bec5d4d1`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
