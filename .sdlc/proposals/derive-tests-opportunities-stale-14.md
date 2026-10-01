---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I wrote one new test and recorded the other criterion as untestable."
opened: 2026-10-01T13:42:08.190Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote one new test and recorded the other criterion as untestable.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote one new test and recorded the other criterion as untestable. I could not run the type check or a YAML parse on the result, because the shell commands for both were refused permission. Nothing was run against an application either.

**R-1.5 — Watching an opportunity (rewritten, `tests/acceptance/opportunities/R-1.5.spec.ts`).** The test now uses the new `opportunityWatchRequest` page from the contract, whose watch action always asks to watch and never toggles. It signs in as the vendor and works on `seed.opportunities.publishedCodeWithUs`, which somebody else created and nobody watches. It is split into two tests, each titled with the criterion's own words:
- **Watch, then watch again.** Before anything, the vendor is not watching. The first `watchByRequest` is accepted and `watching` reports a watch. The second is not accepted and `refusalReason` is `conflict`, and the person is still watching. The test then stops watching, so the opportunity is left unwatched as the contract asks.
- **Stop watching.** The test watches, then calls `stopWatchingByRequest`, and `watching` no longer reports a watch.

As the ruling required, nothing in it reads the watcher count on the management screen (`opportunityCwuEdit.reportingWatchers`) or any other count. `not-testable.yaml` had no R-1.5 entry, so there was nothing to remove.

One assumption: the contract does not say what form the yes/no answer from `watching` takes. The test treats an empty reading, `false`, `no` or `0` as "not watching" and anything else as "watching". If the adapter answers some other way, those assertions will need adjusting.

**R-1.6 — An opened public page counts as a view (now in `not-testable.yaml`, blocked, owner `contract`).** I deleted the old test file, since a criterion gets either a test or an entry. The criterion is about the recorded view count. The only surface observation that returns a view count is `opportunityCwuEdit.reportingViews`, the management-screen figure the ruling forbids. The ruling says the counters observable (`view_count`) already observes what the criterion names, and in the contract that is true. But that observable is an HTTP read (`/api/counters`) that appears on no surface page, so a test, which can only use `surface`, `persona`, `seed` and `mail`, cannot reach it. I read the whole surface again: no other page or observation reports views.

**Missing from the surface:** a page, for example `opportunity-counters`, addressed by an opportunity's program and identifier. It needs a `view_count` observation that returns the counters `view_count` as a number and can be read signed out or by any persona. With that page, the test reads the count, opens `opportunityCwuView` for `publishedCodeWithUs`, and checks the count rose by exactly one. A matching `watcher_count` observation on the same page would let watching be read as a count as well, though R-1.5 no longer needs it.

In total, 1 of the 2 criteria has a test and 1 is not testable. I changed no files outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the opportunities tests follow from R-1.5 and R-1.6 and nothing else? Approve. R-1.5 now covers all three clauses of its criterion, on an opportunity the vendor did not create and does not watch. The first watch request is accepted and the vendor is reported as watching. The second request is refused as conflict, which the contract's watch-request page uses for a duplicate, and the vendor is still watching. A separate test stops watching and checks the vendor no longer watches. The test drives only the contract's watch-request page, which asks to watch and never toggles. It reads no management-screen or reporting count, so the overreach the earlier redo named is gone. The read helper turns a failed read into an empty answer, but no assertion can pass that way: each test also requires a positive watching reading or a refusal reason of exactly 'conflict'. The runner's typecheck passed with no diagnostics. The owed test for R-1.5's duplicate clause is neither met nor withdrawn by this ruling. A test now asserts the clause, so it closes when that test runs at v1, and withdrawing it would close it with no run behind it. R-1.6 is correctly moved to not-testable, blocked and owned by contract. The only surface reading of a view count is the management-screen reporting figure the criterion never mentions. The counters observable it does mean is on no surface page, and the entry names the page and observation that would make it testable. That condition is already open, owed by contract. What would change this ruling: evidence that the contract's refusal reason for a duplicate watch is not 'conflict' (a return to re-align the assertion), or a surface page that reads view_count, which would make R-1.6 testable now (a return to derive its test).

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `7e5c693f9b236c69f78987eb3c283cb7b2fa1eb5`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
