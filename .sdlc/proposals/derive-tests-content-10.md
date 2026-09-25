---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I rewrote the R-7.17 test as the ruling asked."
opened: 2026-09-25T14:07:15.109Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote the R-7.17 test as the ruling asked.

I rewrote the R-7.17 test as the ruling asked. Nothing else in the content domain changed.

**The ruling's one condition.** The never-executed test in `tests/acceptance/content/R-7.17.spec.ts` required that no script element appear among `body_element_names`. The criterion only says embedded markup is never executed. It does not say the markup is removed, so an inert script element that never runs meets it. I replaced the file with a new one that drops that check. The file's comment now says the test does not rule on whether the markup stays as an inert element, shows as literal text, or is taken out.

**What the R-7.17 tests now assert.** The first test opens `seed.content.scriptProbePage` on its own address. It checks that:
- the page is reached and shows its seeded title;
- its words are shown ("These words are in an emphasis tag.");
- `bodyScriptRan()` reports nothing ran, which covers both the inline script and the image failure handler in the seeded body.

It checks nothing more about the markup. The second test covers "renders identically" and is unchanged in substance. An administrator publishes the seeded raw-markup body to the Sprint With Us scope page and the Team With Us terms page. The test then checks that each page's normalised body on its own address matches what the opportunity view embeds. It also checks that the words inside each tagged span appear, so two empty screens can't pass as a match. The header lines are exactly as given; the derived date was already 2026-09-25 and is unchanged.

**What I left alone.**
- **R-7.28:** its test and its not-testable entry stay byte-for-byte. The reviewer called both sound.
- **The collision clause of R-7.28:** the condition asking for it to be restated or withdrawn is addressed to ratify, so I did not act on it.
- **`not-testable.yaml`:** R-7.17 has no entry there and needs none, because the test now asserts both of its clauses. Nothing in the file changed.
- **Everything else:** no other file under `tests/acceptance/content/` and no generated file was changed.

**What I could not do.** I did not rerun the typecheck: running it needed approval, and I didn't get it. The only change is removing one assertion and the lines that fed it. No new surface call or import came in, so I expect no new diagnostics, but I haven't checked that.

**Surface gaps.** This revision needed no surface action or observation that is missing.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the revised content tests follow from their criteria and nothing else. Approve. The one condition from the last ruling has been carried out: the never-executed test for R-7.17 no longer asserts that no script element survives in the body. It asserts only what the criterion states. The seeded probe page is reached on its own address and shows its words as text, and bodyScriptRan reports that nothing in the body executed. That covers both the inline script and the image failure handler. The test says in its own comment that it does not rule on whether the markup stays inert, shows as literal text or is removed, which is exactly what the criterion leaves open. The title check only confirms the right page was reached. The identical-rendering test is unchanged in substance and still follows from the criterion's second clause. It compares the normalised body on the page's own address with what each embedding screen shows, and guards against two empty renderings matching. R-7.28's test and its not-testable entry are unchanged and were already judged sound. The condition on R-7.28's collision clause stays addressed to ratify. No selector, route, table or status code leaks into either file. The runner's typecheck reports no diagnostics under acceptance/content. Its two diagnostics are in adapters/new, which this proposal does not answer for. missing-test/R-7.17 is not marked met here: it closes only when this test runs at the criterion's current version, and it is not withdrawn because the test is still owed. The ruling would change to a return if the calibrate run showed the probe test depending on anything the criterion does not state, or if a content diagnostic appeared in the typecheck.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `efc6cb2a426eca98ee049293ce79eb78bf62a7bd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
