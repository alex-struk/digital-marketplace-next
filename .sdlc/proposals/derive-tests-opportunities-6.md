---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record."
opened: 2026-09-25T10:27:50.656Z
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record.

I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record. That was the only condition, and I didn't touch any other file. I couldn't run the typecheck: this session wasn't allowed to run commands.

**R-1.35 (`tests/acceptance/opportunities/R-1.35.spec.ts`):** The file used to have two tests, and each one called `arrangeWatcherAndProponent` on `seed.opportunities.publishedCodeWithUs`. That record is loaded once and never reset. So the second test's `toggleWatch` as `persona.competingVendor` turned the first test's watch back off, and `persona.vendor` submitted a second proposal to the same opportunity. The file now has one test, titled with the criterion's own statement, and it works through the setup once:

1. It sets up the watcher and the proponent a single time. This keeps the existing check that the administrator's reporting shows more watchers and more proposals than before.
2. It clears the mail catcher, changes the opportunity's details, and checks that the watcher, the proponent and the author are each reached.
3. It clears the catcher again, adds an addendum, and runs the same check on all three.

This follows the reviewer's suggested shape. One test fits because the criterion has a single given, with "edits it or adds an addendum" as one when. The helper functions, the recipient-matching logic and the assertions are unchanged. I only merged the two test bodies and rewrote the explanatory comment to say why the setup happens once. The header stays as it was: the file's content did change, and its derived date was already today's, 2026-09-25.

**Not verified:** I couldn't confirm the reviewer's result that the typecheck shows no diagnostics under `acceptance/opportunities/`. The edit only rearranges calls that were already in the file and already typechecked, so I don't expect new diagnostics, but the next run should confirm that.

I changed nothing in `tests/acceptance/not-testable.yaml`, `tests/generated`, or any other opportunities spec. No criterion became untestable, and I found no surface action or observation missing for this criterion.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Do the revised opportunities tests now follow from their criteria and from nothing else? Returned. The condition owed from derive-tests-opportunities-5 is met: R-1.35 is now one test that sets up the watcher and the proponent once on seed.opportunities.publishedCodeWithUs. It then clears the catcher, changes the details and checks that all three people are reached, and clears it again, adds an addendum and checks again. Its assertions follow from the criterion. It checks that each person is reached, not that each is notified exactly once, so it asserts less than the criterion and nothing it does not ask for. The runner's typecheck reports no diagnostics under acceptance/opportunities/; its one diagnostic is in adapters/new/, outside this proposal. The other specs are unchanged since the last ruling passed them. The run-order defect has moved across files, though. R-1.31.spec.ts, lines 19-26, which this proposal does not change, also has persona.vendor submit a proposal against the same seeded record, and a vendor holds at most one proposal per opportunity. Whenever R-1.31 runs first, R-1.35's submission by persona.vendor adds nothing, and its poll that the proposal count exceeds the earlier reading fails on a correct application. That failure comes from run order, not from anything R-1.35 governs. What would change the ruling: R-1.35 establishes its proponent in a way that holds whatever order the suite runs in.

**Conditions:**
- condition-met derive-tests-opportunities-5#2: tests/acceptance/opportunities/R-1.35.spec.ts is now a single test. arrangeWatcherAndProponent runs once, then the catcher is cleared before the details change and before the addendum, and expectEachReached checks the watcher, the proponent and the author after each, so nothing in the file toggles the watch twice or submits twice.
- R-1.35: tests/acceptance/opportunities/R-1.35.spec.ts, lines 61-68, has persona.vendor submit a proposal against seed.opportunities.publishedCodeWithUs and then polls that the reported proposal count exceeds the earlier reading (line 79). tests/acceptance/opportunities/R-1.31.spec.ts, lines 19-26, has the same persona submit against the same record, which is loaded once and never reset, and a vendor holds at most one proposal per opportunity. When R-1.31 runs first, R-1.35's submission adds nothing and the poll fails on a correct application. Establish the proponent so it holds in either order: for example, submit as a persona no other spec submits with against this record, or accept that persona.vendor's proposal may already exist and establish that a submitted proposal from them is there rather than that the count went up.

### Runner-owned typecheck evidence

Proposal revision: `c7f1de2fefbb23585da349f89fce54096e8ef252`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
