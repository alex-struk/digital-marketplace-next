| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T04:38:35.817Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound `contentView.publishedDate` and `contentView.updatedDate` in the adapter for target `new`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rebound `contentView.publishedDate` and `contentView.updatedDate` in the adapter for target `new`. They now read the date from the public page's own list of labelled terms, as the ruling asked. I changed nothing else, and I could not typecheck the file.

**What I confirmed on the running target.** Signed out, I opened the seeded page at `/content/about-us`. Under the heading it shows two labelled entries: "Published", with January 5, 2026 in the element after it, and "Last updated", with January 7, 2026. There is no "Published … | Updated …" line on that page. The old reader searched for one, never found it, and so `updatedDate` returned an empty string both before and after an edit. That is why R-7.8's `not.toBe(readerUpdatedBefore)` failed against "".

**What I changed in `tests/adapters/new/index.ts`.** There is a new helper, `publicDate`, next to `contentFact`. It waits for the page to settle, then looks for the named entry ("Published" or "Last updated") in the page's main area. If the entry is missing, it throws `unbound: content-view.published_date` or `unbound: content-view.updated_date`, naming the address and the missing entry, instead of returning ''. If it is there, it returns the value from the element that follows, using the same `contentFact` that `contentEdit.updatedDate` already relies on. Both content-view members now call it. The existing rule that the not-found page returns '' stays as it was: a missing page is a place the test reached that legitimately has no date.

**What I left alone.** The old `datedLine` helper is still in the file because the opportunity view's `publishedDate` uses it. The ruling did not name that member, so I did not touch it. `bindings.yaml` needed no change, since both members were already listed as `bound` and still are.

**Not verified.** The typechecker could not run because this session needed approval for the command and none was given, so the file has not been compiled. Instead I checked by hand that every name the new code uses is defined in the same `create` scope. In the browser I confirmed that each entry's following element holds the date. I did not run the acceptance suite.

All requests in the ruling were taken up; none are deferred.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the target `new` adapter now binds `contentView.publishedDate` and `contentView.updatedDate` correctly, and whether it still does nothing but navigation and locating. It does. The diff touches only `tests/adapters/new/index.ts`. A new helper, `publicDate`, finds the 'Published' or 'Last updated' entry in the main area of the public page's term list and reads the date from the element after it, using the same `contentFact` that `contentEdit.updatedDate` already uses. When the entry is missing, it now throws an unbound error naming the address and the entry instead of returning an empty string, so a missing date can no longer pass silently as ''. That is what made R-7.8's `not.toBe(readerUpdatedBefore)` fail before. The adapter makes no assertion and contains no business logic. The existing behaviour where the not-found page returns '' is unchanged, which is legitimate because that page has no date to show. Nothing under `tests/acceptance` changed, and no protected path is touched. The author could not compile the file, but the runner's typecheck on this revision passed with no diagnostics under `adapters/new/`. The egress failures are all in proposal and gate files from earlier slices and are not in this diff. The tier is STANDARD and no residual risk is marked unaccepted, so nothing needs escalating. I would return this if a verify run showed either member answering unbound on a seeded published page that does display the entry. That would mean the term locator, an exact case-insensitive match on the entry text within the main area, misses how the page marks it up.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2225eac3f068c28442389569b640dbb72bd23332`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
