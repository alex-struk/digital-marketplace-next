---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-29T03:17:24.945Z"
cost: 1.0429018
turns: 31
session: "143517a7-96d8-4556-afa3-a881acb6440c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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