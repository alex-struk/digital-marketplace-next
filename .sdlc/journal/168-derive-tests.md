---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T05:23:24.013Z"
cost: 2.1311373999999996
turns: 37
session: "30391482-c47e-44b7-af95-5c5a27a61da4"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I rewrote the three tests the ruling sent back. All three criteria (R-2.27, R-2.33 and R-2.34) now have a test file in `tests/acceptance/proposals/`, and none of them depends on a particular word being shown. I have not run or type-checked them: this workspace has no TypeScript toolchain and no target to run against. I searched the three files by hand for selectors, locator calls, test ids, routes and URLs and found none.

**How state is read now.** A proposal's status is read the way its own vendor sees it, on the proposal's management screen (`proposalCwuEdit.status()`, or `proposalTwuEdit.status()` for Team With Us).
- **Disqualified** means that status is different from what it was before, and the reason appears on the proposal's history or proposal tab. The administrator reads the reason on a Code With Us proposal only, where the history should be readable during evaluation.
- **Refused** means that status is exactly what it was before. The refusal tests also accept a form that won't send the request at all, since that leaves the proposal unchanged too.
- **Opportunity moved on** means its status is different from what it was before the action.

The only place a label is still matched is while waiting for a seeded opportunity to close, which only sets up the starting point and follows the closing procedure in `observables.yaml`.

**R-2.27.**
- **First test:** after the closure, one proposal is disqualified. That is shown by its vendor-read status changing and the reason being recorded. Scoring the second proposal leaves the opportunity's status as it was. Scoring the third changes it, and the opportunity's history carries the note the criterion quotes.
- **Second test:** the same move on the opportunity seeded with a withdrawn proposal. Scoring the two still in contention is enough to move it, so the withdrawn one isn't counted.
- **Not tested:** that draft proposals are not counted. No seeded closed opportunity has a draft next to a proposal that can be scored, and a test can't build one, because an opportunity a test publishes never closes. I added a clause entry to `not-testable.yaml`: blocked, owned by `contract`, asking for such a seeded opportunity.

**R-2.33.**
- **First test:** builds the stated starting point: one proposal disqualified (shown as above), then the other scored until the opportunity moves on.
- **After the award:** the awarded proposal's status changes, and so does the opportunity's. The opportunity names `seed.organizations.qualified.legal_name` as its successful proponent. The disqualified proposal's vendor-read status is the same as before the award.
- **Withdrawn proposal:** its vendor (the seeded user `users.proponentThree`) has no persona, so this is the one place I read the administrator's history instead. It must be non-empty and identical before and after the award.
- **Second test:** covers the statement's "marks every other proposal still in contention as not awarded", on the opportunity whose two proposals both come from vendors a test can sign in as. The proposal not chosen changes status, and ends on a different status from the chosen one.

**R-2.34.** Seven tests:
- **Refused:** no reason; a reason of 5,001 characters.
- **Accepted:** a reason with the proposal becoming disqualified and the reason kept; a 1-character reason; a 5,000-character reason.
- **Another stage:** a Team With Us proposal under question review. This one checks the status change only and doesn't read the history, which is what the ruling objected to.
- **Re-check:** the "then" clause that the opportunity is re-checked. With two proposals scored, disqualifying the third moves the opportunity on.

**Assumptions to know about:**
- The tests reuse seeded records named for other criteria, such as the scoring and final-stage opportunities. This relies on the fixture resetting to the seed before every test. The manifest says in one place that the seed is loaded once per run, which conflicts with that fixture, so it is worth confirming.
- The award test waits for the opportunity to leave evaluation before awarding. This assumes, as the seed's own notes say, that scoring the last proposal in contention is what makes the award possible.

**Missing from the contract:**
- `proposal-cwu-view` (and the Team With Us and Sprint With Us equivalents) has no `status` observation. So an administrator can't read a proposal's state, and the state of a proposal whose vendor has no persona can only be inferred from its history.
- There is no persona for `users.proponentThree`.
- There is no seeded closed Code With Us opportunity with a draft proposal next to a submitted one (the R-2.27 clause entry above).

I changed nothing outside `tests/acceptance`.