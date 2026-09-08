| Field | Value |
| --- | --- |
| gate |  |
| opened |  |
| holder |  |

---
gate: G3
question: "Do these tests follow from the content criteria and from nothing else?"
recommendation: "I wrote 21 spec files and eight not-testable entries, covering all 29 criteria."
opened: 2026-09-07T14:18:10.844Z
---

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** I wrote 21 spec files and eight not-testable entries, covering all 29 criteria.

I wrote 21 spec files and eight not-testable entries, covering all 29 criteria. Dependencies aren't installed in this workspace (`tests/node_modules` is absent), so I could not run `tsc` or Playwright; I checked the files by hand against `tests/generated/surface.d.ts` and grepped them for everything the separation check refuses — no `page.`, locator, test id, route-shaped literal or import outside `../../fixtures`.

**Journal**

Twenty-one of the twenty-nine criteria in the content domain got a test file under `tests/acceptance/content/`. Reading a page (R-7.1, R-7.2, R-7.4), creating, changing, renaming and removing one (R-7.7, R-7.8, R-7.9, R-7.24), the list of pages and who may reach the managing screens (R-7.5, R-7.6, R-7.10), validation of title, body and address (R-7.20, R-7.21, R-7.22), the footer's five links (R-7.19), the terms page's announce action (R-7.13), the image control in the editor (R-7.26), the placeholder pages a fresh installation carries (R-7.12), the constraints on a page the service depends on (R-7.25), authorship on the managing screen (R-7.27) and the rendering of a body as formatted text (R-7.17) are each exercised end to end through `surface`.

Three of those files test less than the whole criterion, and each says so in a comment at the top rather than quietly. R-7.3 asserts only that a malformed address and an unknown one land a visitor on the same not-found screen; whether the service answers the malformed one as an invalid request is a fact about the shape of its answer, and nothing reports that. R-7.6 asserts the direct-access half only — no surface names the navigation menu, so "no route is offered to them" has nothing to read from. R-7.13 asserts that the announce action is offered and warns first, but not that no other page carries it, since the announcement is reachable only through the terms page's own screen.

Eight criteria have entries in `not-testable.yaml` instead of files. R-7.11 and R-7.16 both turn on the shape of a refused answer, and no observation returns it — `observables.yaml` names a `refusal` status for files and exports but nothing for a page request. R-7.14 and R-7.29 need a body embedded in another screen, and R-7.18 and R-7.15 need the service level agreement link followed from the learn-more index, the program cards and the three opportunity forms; none of those is reachable. R-7.23 asks for the absence of a history, which cannot be asserted while nothing names one. R-7.28 needs two administrators holding one page open at once, and the target carries one administrator sign-in and one session.

What I needed and did not find, for whoever extends the contract: a seed group naming the pages the service creates for itself — as it stands, `seed.content` holds only the one ordinary page, so R-7.12, R-7.25 and R-7.27 carry the addresses `copyright`, `disclaimer` and `accessibility` written out from the criteria's own text, which is the weakest thing in this batch and the easiest to fix. Then a `content-list` observation returning how many pages are listed (R-7.12 claims twenty-two and nothing can count them); a `content-edit` observation of the wording it is showing, and one naming a version history or an earlier version, so R-7.23's negative can be asserted; an observation of the refusal's shape or status on the content surfaces, which would unblock both R-7.11 and R-7.16; observations of the embedded page body on the Sprint With Us and Team With Us opportunity views and on the evaluation instructions screen, plus handles for the pages those screens embed, which would unblock R-7.14 and R-7.29; a learn-more surface and a `follow_service_level_agreement_link` action on the program cards and the three opportunity forms, for R-7.15 and R-7.18; a second administrator sign-in and some way to hold a stale editing window, for R-7.28; and, smaller, observations for the editor's formatting shortcuts and its link to the guidance page, which R-7.26 leaves untested.

Two things a later stage should know about how these tests behave together. The suite runs single-worker and sequentially, and several of these tests write: R-7.8 changes the body of the seeded page, R-7.25 rewrites the disclaimer page, and the create-and-change tests leave pages behind at addresses stamped with the run's start time so a second run against the same target does not collide with the first. I chose the three service-owned pages each writing test touches so that no test reads a page another one has written — `copyright` and `accessibility` are read as untouched placeholders and nothing here writes to them — but that arrangement depends on the files staying as they are.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Three tests and two not-testable reasons do not follow from their criteria. R-7.17 asserts that raw markup survives verbatim in the rendered body; the criterion says only that it is rendered as formatted text and never executed, so a conforming rebuild that strips the tag fails the test. R-7.12 asserts the 'marked as needed' half through contentEdit.fixedPageWarning(), which is R-7.25's claim about the managing screen, when the criterion states the marking on the list and contentList.pageIsFixed() exists for it. R-7.18's not-testable reason is real for the five links but covers a half that is not missing from the surface: that the page is one the service creates for itself is readable with the same contentView/contentEdit calls used for copyright and disclaimer, and the address is named in R-7.15's note. R-7.14 and R-7.29 both assert that no observation reports an embedded page body, but organizationSwuTerms.termsBody(), organizationTwuTerms.termsBody() and evaluationInstructionsSwu/Twu.instructionsBody() are exactly that; their real blockers (no addressable handle, and a page the service needs cannot be removed) stand alone. The rest of the batch is sound - literals trace to criterion text, partial coverage is declared in comments rather than hidden, and no implementation detail leaks in.

**Conditions:**
- R-7.17: drop the assertion that the raw markup appears verbatim in the rendered body, or replace it with one that only shows the markup did not take effect.
- R-7.12: assert the needed-by-the-service marking through contentList.pageIsFixed(), as the criterion's then states it, rather than through contentEdit.fixedPageWarning().
- R-7.18: either write the testable half - that a page stands at service-level-agreement as one the service creates for itself - with the unfollowable links documented in the file, or state in the not-testable reason why that address may not be written out here when copyright, disclaimer and accessibility were.
- R-7.14 and R-7.29: strike the claim that no observation reports the embedded body, and rest each reason on the blocker that is real - no handle addresses the embedded page, and a page the service needs cannot be removed.
