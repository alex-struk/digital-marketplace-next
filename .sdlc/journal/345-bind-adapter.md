---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T04:38:35.778Z"
cost: 0.41852280000000003
turns: 21
session: "60a318c4-a5b3-4141-b4b4-323c93429717"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rebound `contentView.publishedDate` and `contentView.updatedDate` in the adapter for target `new`. They now read the date from the public page's own list of labelled terms, as the ruling asked. I changed nothing else, and I could not typecheck the file.

**What I confirmed on the running target.** Signed out, I opened the seeded page at `/content/about-us`. Under the heading it shows two labelled entries: "Published", with January 5, 2026 in the element after it, and "Last updated", with January 7, 2026. There is no "Published … | Updated …" line on that page. The old reader searched for one, never found it, and so `updatedDate` returned an empty string both before and after an edit. That is why R-7.8's `not.toBe(readerUpdatedBefore)` failed against "".

**What I changed in `tests/adapters/new/index.ts`.** There is a new helper, `publicDate`, next to `contentFact`. It waits for the page to settle, then looks for the named entry ("Published" or "Last updated") in the page's main area. If the entry is missing, it throws `unbound: content-view.published_date` or `unbound: content-view.updated_date`, naming the address and the missing entry, instead of returning ''. If it is there, it returns the value from the element that follows, using the same `contentFact` that `contentEdit.updatedDate` already relies on. Both content-view members now call it. The existing rule that the not-found page returns '' stays as it was: a missing page is a place the test reached that legitimately has no date.

**What I left alone.** The old `datedLine` helper is still in the file because the opportunity view's `publishedDate` uses it. The ruling did not name that member, so I did not touch it. `bindings.yaml` needed no change, since both members were already listed as `bound` and still are.

**Not verified.** The typechecker could not run because this session needed approval for the command and none was given, so the file has not been compiled. Instead I checked by hand that every name the new code uses is defined in the same `create` scope. In the browser I confirmed that each entry's following element holds the date. I did not run the acceptance suite.

All requests in the ruling were taken up; none are deferred.