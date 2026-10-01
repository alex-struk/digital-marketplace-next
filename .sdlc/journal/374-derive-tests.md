---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-01T13:42:08.158Z"
cost: 0.8059006000000002
turns: 29
session: "421c9030-4d83-4423-b236-f0565fc22e08"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I wrote one new test and recorded the other criterion as untestable. I could not run the type check or a YAML parse on the result, because the shell commands for both were refused permission. Nothing was run against an application either.

**R-1.5 — Watching an opportunity (rewritten, `tests/acceptance/opportunities/R-1.5.spec.ts`).** The test now uses the new `opportunityWatchRequest` page from the contract, whose watch action always asks to watch and never toggles. It signs in as the vendor and works on `seed.opportunities.publishedCodeWithUs`, which somebody else created and nobody watches. It is split into two tests, each titled with the criterion's own words:
- **Watch, then watch again.** Before anything, the vendor is not watching. The first `watchByRequest` is accepted and `watching` reports a watch. The second is not accepted and `refusalReason` is `conflict`, and the person is still watching. The test then stops watching, so the opportunity is left unwatched as the contract asks.
- **Stop watching.** The test watches, then calls `stopWatchingByRequest`, and `watching` no longer reports a watch.

As the ruling required, nothing in it reads the watcher count on the management screen (`opportunityCwuEdit.reportingWatchers`) or any other count. `not-testable.yaml` had no R-1.5 entry, so there was nothing to remove.

One assumption: the contract does not say what form the yes/no answer from `watching` takes. The test treats an empty reading, `false`, `no` or `0` as "not watching" and anything else as "watching". If the adapter answers some other way, those assertions will need adjusting.

**R-1.6 — An opened public page counts as a view (now in `not-testable.yaml`, blocked, owner `contract`).** I deleted the old test file, since a criterion gets either a test or an entry. The criterion is about the recorded view count. The only surface observation that returns a view count is `opportunityCwuEdit.reportingViews`, the management-screen figure the ruling forbids. The ruling says the counters observable (`view_count`) already observes what the criterion names, and in the contract that is true. But that observable is an HTTP read (`/api/counters`) that appears on no surface page, so a test, which can only use `surface`, `persona`, `seed` and `mail`, cannot reach it. I read the whole surface again: no other page or observation reports views.

**Missing from the surface:** a page, for example `opportunity-counters`, addressed by an opportunity's program and identifier. It needs a `view_count` observation that returns the counters `view_count` as a number and can be read signed out or by any persona. With that page, the test reads the count, opens `opportunityCwuView` for `publishedCodeWithUs`, and checks the count rose by exactly one. A matching `watcher_count` observation on the same page would let watching be read as a count as well, though R-1.5 no longer needs it.

In total, 1 of the 2 criteria has a test and 1 is not testable. I changed no files outside `tests/acceptance`.