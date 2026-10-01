| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T13:18:23.646Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** R-1.5 (watchers) and R-1.6 (views) are still unbound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-1.5 (watchers) and R-1.6 (views) are still unbound. I looked for them again on the running application, and no screen shows either count, though the application does keep them. I couldn't run the type check or the YAML parse, because both commands were blocked by permission prompts. My edits only add plain prose inside existing string literals (no new double quotes) to one constant in `index.ts` and to two `bindings.yaml` entries.

**How I looked this time.** I signed in through the sandbox identity provider as the administrator (`test-admin`), typing only the variable name into the password field. The management screen of the seeded published Code With Us opportunity has the same four sections as before: Summary, Opportunity, Addenda and History. Its Summary lists only Proposal deadline, Reward, Published, Created by and Last changed by. Asking for a hidden section with `?tab=reporting` or `?tab=proposals` just brings back that Summary.

I then went through every other place a count might plausibly appear:
- **Other opportunities:** the management screens of the seeded lapsed opportunity with three proposals, the one at its final stage, and the one in processing all look the same.
- **Public pages:** the public opportunity page shows details and "Watch this opportunity", but no count.
- **Lists:** `/dashboard` and `/opportunities` show no count either.
- **Report page:** `/opportunities/code-with-us/:id/complete` returns "Page not found" on all three of those seeded opportunities.

The previous run had already checked as the owning public sector employee, and again after the administrator ticked "Watch this opportunity".

**New finding.** The counters endpoint described in `observables.yaml` works on this target. `GET /api/counters?counters=opportunity.code-with-us.<id>.views` answered 1 for the published opportunity, and `.watchers` answered 0. So the application counts views and watchers but never displays them. I chose not to have the page observation read these numbers from the API. A test passing on that would report a count the page never shows, so the adapter would be deciding the test's outcome. The shortfall is the missing display, which needs fixing in the application, not the adapter.

**What I changed.** Only the explanatory text, so a reader can act on it:
- `REPORTING_LOOKED` in `tests/adapters/new/index.ts`, the reason the adapter gives when it reports these members unbound.
- The `reporting_views` and `reporting_watchers` entries for `opportunity-cwu-edit` in `tests/adapters/new/bindings.yaml`.

Both now record this run's search and the counters finding. No other binding changed, I wrote nothing outside `tests/adapters/new/`, and no password or environment value appears in any file.

**Routes.** Every surface route I opened resolved except `/opportunities/code-with-us/:id/complete`, which returns "Page not found" on this target. Earlier runs found the organization edit route also returns "Page not found"; that is unchanged.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation and nothing else? The adapter edits are sound: they only rewrite unbound reasons inside tests/adapters/new, the runner's typecheck on db615143a passes with no diagnostics under adapters/new, and the reasons are real — on this target no screen shows a view or watcher count, and the adapter correctly declines to make a page observation out of an API read, which would have the adapter deciding the test's outcome. But the two criteria stay unbound because their tests reach past them, not because the adapter or the application falls short of what the criteria ask. R-1.5 asks that watching is recorded and a duplicate refused; R-1.6 asks that the recorded view count rises by one. Neither asks for any count to be displayed. Yet both tests read the count from a reporting observation on the opportunity's management screen, while the contract offers a direct counters read for exactly these numbers, and this run found it works on this target. No adapter run can bind a display the criteria never required, so the fix belongs to the test writer and the proposal is returned with test-overreaches for both. Separately, R-1.5's clause that the same opportunity cannot be watched twice is asserted by no test and has no not-testable entry; the reason given in the test's comment is real (the surface offers only a toggle and no observation of a refusal), so it is recorded as owed by contract. This would be approved once regenerated tests read the recorded counts through an observation the contract offers and the adapter binds them, or once the contract stage establishes that a displayed count is part of what these criteria require.

**Conditions:**
- test-overreaches R-1.5: the test reads the watcher count from a reporting figure on the opportunity's management screen (opportunityCwuEdit.reportingWatchers), but the criterion asks only that watching is recorded for the person and that a second watch is refused; it says nothing about any screen showing a watcher count. The contract's counters observable (watcher_count, read directly) already observes what the criterion names.
- test-overreaches R-1.6: the test reads the view count from a reporting figure on the opportunity's management screen as the administrator (opportunityCwuEdit.reportingViews), but the criterion asks only that the recorded view count for the opportunity increases by one when its public page is opened; it does not require the count to be displayed anywhere. The contract's counters observable (view_count, read directly) already observes what the criterion names, and it can check an increase of exactly one rather than only a change.
- missing-test R-1.5: the same opportunity cannot be watched twice (the second request is refused as a duplicate) — owed by contract: the surface offers only a watch toggle, so asking twice turns the watch off instead of making a second request, and no observation reports a refusal as a duplicate; it needs a watch action that does not toggle and an observation of the refusal

### Runner-owned typecheck evidence

Proposal revision: `db615143a4f54ba7ca637fa31678f62d6c8a6ce1`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
