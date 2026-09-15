---
gate: G3
question: "Do these tests follow from the content criteria and from nothing else?"
recommendation: "I wrote tests for all five content criteria, so nothing went into `not-testable.yaml`."
opened: 2026-09-15T05:14:39.503Z
---

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** I wrote tests for all five content criteria, so nothing went into `not-testable.yaml`.

I wrote tests for all five content criteria, so nothing went into `not-testable.yaml`. The type check didn't run, because running `tsc` needed approval that wasn't given. I checked each file against the generated surface, seed and personas by eye, and a scan for selectors, locators, routes or the page object found none.

The workspace already had approved tests for all five criteria, and `redo.yaml` held a note against each one. I rewrote each file under the new spec header and dealt with those notes.

**R-7.9 (removing an ordinary page)** — one test, using the seeded ordinary page, which has three versions. The test publishes one more change first, so it holds the text of both the replaced version and the current one. It then removes the page and checks four things:
- the administrator is told the page was removed;
- they are back on the list, and the page's address is no longer there;
- the page is not found by its address or by its identifier;
- a new page published afterwards at the same address carries none of the old text, either in its body or in the managing screen's version history.

Nothing on the surface reads the service's stored data, so the test can't tell text that was deleted from text that is kept but never shown. The file says so.

**R-7.12 (the pages a fresh installation carries)** — two tests: a visitor reading a page, and an administrator looking at the list. Only seven page addresses are named: about, accessibility, copyright, disclaimer, privacy, markdown-guide and terms-and-conditions. The spec never gives the addresses of the program pages, so I didn't guess them. Before reading anything, each test first confirms these pages exist on the installation and are marked as needed. The count of twenty-two is not checked.

**R-7.22 (no shared addresses)** — two tests, one clashing on creating a page and one on renaming. Both finish publishing, so the clashing change is actually sent. Each then checks:
- the address is reported as already in use;
- the existing page's title and body are unchanged;
- in the rename case, the page that tried to move is still at its own address.

I used the seeded page's address rather than "about", because the test can confirm that page exists.

**R-7.25 (pages the service depends on)** — one test on "disclaimer". It first confirms the page is there, then checks the warning, the locked address and the withheld removal. It doesn't take the screen's word for those: it tries to remove and to rename the page through the managing screen, then checks the page is still at its address and nothing answers at the new one. It also changes the title and body and reads the new wording back.

**R-7.27 (who published and who last changed a page)** — two tests. The first checks that "accessibility" names "System" as publisher and last editor, after confirming the page exists and is one the service made. The second reads both administrators' names from their profiles, using the seeded user ids. It then has the second administrator change the seeded page and checks the managing screen names each of them.

Surface pieces I needed but did not find, so the contract can be extended:
- **A page count on `content-list`.** R-7.12's twenty-two pages can't be counted. There is also no per-row reading, so `page_public_address` and `page_is_fixed` can't be tied to a particular page.
- **Where the author names lead on `content-edit`.** Nothing returns the profile links behind `published_by` and `updated_by` (for example, `published_by_profile_link` and `updated_by_profile_link`). R-7.27's "each linked to their profile" is not checked.
- **A way to call the service directly.** Nothing sends a request other than through a screen, so R-7.25's "a request to rename or remove it made another way is refused" is not checked.

Risks for whoever runs or rules on this:
- **Second administrator on the old app.** The `administrator-other` persona has no sign-in route on the old application, so R-7.27's second test can only run on the rebuild. A seeded page whose current version was written by `administratorTwo` would let it run on the old application too.
- **Pages missing on the target.** An earlier run's notes (in `redo.yaml`) say the target held none of the pages the service needs. If that is still true, the R-7.12, R-7.25 and R-7.27 tests will stop at their opening check that the page exists, not at the claim being tested.
- **The spec disagrees with itself.** R-7.12 counts twenty-two needed pages and the seed notes say nineteen. D-content-27, a spec entry marked obsolete, says the rebuild stops creating seven of them. R-7.18 adds a service level agreement page. The seven addresses I test are in every version of that list, but the count needs a ruling before anyone checks it.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the rewritten content tests (R-7.9, R-7.12, R-7.22, R-7.25, R-7.27) follow from their criteria and from nothing else? Ruling: approve. Each assertion traces to its criterion's then-clause. R-7.9's identifier probe uses the spec's own statement that a page can be read by its identifier (content.md:75), and its version-history reading uses the content-edit version_history observation the contract added for exactly that absence, so neither leaks implementation. R-7.12 names only the seven addresses the criterion's note gives, and the not-asserted parts (the count of twenty-two in R-7.12, 'a request made another way' in R-7.25, profile links in R-7.27) are disclosed with real surface gaps. R-7.22 uses the seeded address, which is legitimate for a general rule. R-7.27's second administrator is the seeded administratorTwo per the manifest. No steps name selectors, routes or tables; the runner typecheck passed with no diagnostics; the redo.yaml and applied.yaml pruning matches the pipeline's pattern on earlier stale-test proposals. Tier is STANDARD with no unaccepted residual risk, so no escalation. Would change to return if the identifier or history readings proved to come from the application's source rather than the spec, or if calibration showed R-7.9 failing on its setup step of reusing the removed address, which the criterion does not promise.

**Conditions:**
- R-7.9: the step publishing a new page at the removed page's address is setup, not a claim of the criterion; if calibration fails there, triage it as test-wrong rather than a product question
- R-7.12: the needed-page count (22 in the criterion vs 19 in the seed manifest, and D-content-27 / R-7.18 changes) needs a product-owner ruling before any test asserts the count
- R-7.27: the second test runs only on the rebuild until the seed adds a page whose current version was written by administratorTwo

### Runner-owned typecheck evidence

Proposal revision: `9f95882b9611fcf4b374c455a4072c00909b1087`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
