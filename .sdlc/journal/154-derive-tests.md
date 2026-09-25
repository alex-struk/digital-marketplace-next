---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-25T14:05:18.480Z"
cost: 0.5952688
turns: 17
session: "4ef5de69-06d0-44a9-84e6-fc41e37b6ac1"
---

Both criteria that were handed back now have a test. R-7.17 has a full test in `tests/acceptance/content/`. R-7.28 has a test for its reachable half, and its old not-testable entry has been replaced by an entry for the one clause that still can't be reached. I didn't compile the tests or run them: running the YAML parser to check the edited file needed approval, so I stopped there.

**R-7.17 (v1).** The existing file already had the test comparing the rendering on the page's own address with the embedded rendering, and that test was accepted when it was last reviewed. I kept it unchanged. The earlier concern had been that nothing could tell markup that ran apart from markup that was stripped out. The contract now supplies both things that were missing: `content-view.body_script_ran`, `content-view.body_element_names`, and the seeded page `seed.content.scriptProbePage`. Its body holds an inline script and an image error handler that each pop up a dialog if they run, plus an emphasis tag. I added a second test named after the first half of the criterion. It opens that page with no one signed in and checks four things:
- the title matches;
- the visible words of the body are there;
- `body_script_ran` is empty;
- no `script` element appears in the list of body elements.

It deliberately does not check whether the markup appears as literal text or is removed. The criterion doesn't decide that, and an earlier redo said asserting a literal rendering goes too far. The "formatted text" part is still asserted by R-7.1 against the same observation. R-7.17 had no entry in `not-testable.yaml`, so nothing needed removing.

**R-7.28 (v2).** I wrote `tests/acceptance/content/R-7.28.spec.ts` using the route the contract documents on `content-request`:
1. The administrator opens the page-editing screen and starts editing, so the screen holds the old wording.
2. The same page is changed through `content-request.change_page_by_request`, which returns an accepted answer.
3. The screen then publishes different wording.

The test checks that the screen says the change was published, and that the public page shows the screen's wording and not the change made in between. That is the silent-overwrite half.

The collision clause is still not tested: two publishes landing inside one read-then-write window, with the second refused by a service error. I rewrote the R-7.28 entry to name only that clause. I marked it **unobservable**, with owner **ratify**. The interleaving happens inside a single request on the server. Nothing in the surface can open or hold that window, and two requests sent at once would only interleave by chance, so neither a passing nor a failing run would show anything. An observation for a service error on the editing screen would still be worth having, but on its own it wouldn't make the clause reachable. What would help is the clause restated in terms something can observe, or a ruling that withdraws it and accepts it without a test.

**Contract gaps and cautions:**
- The R-7.28 test relies on `content-request` not moving the browser when it is opened, so the editing screen keeps its old wording. The contract says so, but if the adapter navigates on `open`, the test will fail for that reason and not because of the application.
- Beyond the error observation above, I found no other surface action or observation missing.
- I changed nothing outside `tests/acceptance`.