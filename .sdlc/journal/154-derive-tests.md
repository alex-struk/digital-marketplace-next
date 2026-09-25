---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T14:07:15.083Z"
cost: 0.22255280000000002
turns: 5
session: "55e57271-62f2-4a91-a939-783ed00f9948"
---

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