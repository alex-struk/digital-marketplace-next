| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T03:42:41.409Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't type-check or run the adapter: `tsc`, `python3` and multi-step shell commands all needed an approval nobody was here to give.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've re-bound the three content-management pages (`content-list`, `content-create`, `content-edit`) on the "new" target, so every criterion on your list (R-7.5 to R-7.28 and R-8.29) now has the members it needs. I couldn't type-check or run the adapter: `tsc`, `python3` and multi-step shell commands all needed an approval nobody was here to give. I tested the selectors and readers by hand in the browser instead, but a real calibration run is the first proper check.

**Why they were unbound before.** The old reason said a signed-in person got "Page not found" on every content-management screen. That is no longer true. Signed in through the identity provider as the administrator (`test-admin`, typing only the variable name as the password), `/content`, `/content/create` and `/content/:slug/edit` all open, and the header now has a "Content" link. Signed out, all three still show "Page not found", which is what `refused_for_non_administrator` reads.

**What I walked to bind them:**
- **List:** the 27-row table of pages, the "Create page" link, the title links to each page's edit screen and the public-address links.
- **Create:** I created a page, edited it, published the change and deleted it, watching each confirmation and status message ("Page published", "Changes published", "Page removed").
- **Refusals:** I tried a badly formed address, then an address already taken on both the create and edit forms (`about-us`, then `privacy`). The second was refused, so the page wasn't changed.
- **Fixed pages:** I opened `about` and `terms-and-conditions`, the pages the service needs. They show the "The service needs this page" note, a locked Address field and no "Delete page" button.
- **Cleanup:** every page I made was deleted again, and no seeded page was changed.

**How the bindings behave:**
- **Filling forms:** the actions fill every field the test passes in (title, address, body). An input key with no matching field throws `unbound:` naming that key. A disabled "Publish page" or "Publish changes" button fails at once and quotes what the page says is missing.
- **Facts on the edit screen:** dates, the two "by" names and their profile links are read from the page's own labels. A page the service created says "System" with no link, so the link readers return empty.
- **`page_is_fixed`:** returns one line per row, like `/content/about: Yes`, because the contract doesn't say which row it means.
- **Empty versus unbound:** for someone shown "Page not found", the create form's actions do nothing and the list and create readers return empty, so the refusal is what the test reads next; this copies the old adapter. On the edit screen the same refusal reports `unbound:` instead.
- **`version_history`:** returns empty, because the screen says earlier versions are kept but cannot be viewed.

**One binding I could not watch work: `upload_body_image`.** The "Insert image" button is there and the page says it takes a JPEG or PNG up to 10 MB. But the browser tool I was using never showed a file chooser when I clicked it, so I never saw an image land in the body. I marked it bound; if a real run gets no chooser, it fails and says so.

**Other fixes I made while there:**
- **`content-view.follow_body_link`** is now bound. A page with a link can be written now, and I found the old reader looked in the wrong place on this layout, so it would have missed the link. I fixed it to look inside the page's main text and checked it against a throwaway page linking to `/content/about`. `body_element_names` uses a similar positional walk and may only see the first paragraph of a body. It isn't on your list, so I left it alone.
- **`notification-terms-broadcast`** stays unbound, but its reason was wrong. The terms page does open now; nothing on it, before or after "Edit page", offers to notify vendors.
- **Shared wording:** the reason text reused across hundreds of other members also claimed content management answered "Page not found". I corrected it in the code, the bindings file and both headers.

**What's still unreachable.** I checked again as the administrator: `/opportunities`, `/organizations`, `/opportunities/create` and `/proposals` still answer "Page not found". Those members stay unbound with their existing reasons. Every page route in the content domain resolves on the target.

I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every action and observation on 'new' that it can, and nothing else? Ruling: approve. Only tests/adapters/new/index.ts and bindings.yaml changed in the adapter's output, plus the stage's own .sdlc records. Nothing under tests/acceptance, app/ or spec/ changed. The author could not type-check, but the runner did on this exact revision (5b7de8bb3), and tsc --noEmit reported no errors under adapters/new/. The new content-list, content-create and content-edit bindings only navigate and read: they press named controls, fill fields, and read table columns, the page's listed facts, status and alert text, and control state. Every judgement stays with the test. ordered_by_title returns the titles in the order shown and the test decides whether that order is right. delete_withheld_for_fixed_page reports 'absent', 'disabled' or 'enabled' without saying which is correct. version_history reads empty because the screen offers no earlier versions, which matches what R-7.28 says ('nothing in the service can show'). The bindings fail loudly where they should: an input key with no matching field reports 'unbound:', a disabled Publish button quotes the page's reason, and a missing confirmation throws. The create-form actions do nothing for a refused person, so the test reads the refusal next. This copies the old adapter and decides nothing about the outcome. The one remaining unbound reason, notification-terms-broadcast, was corrected to what the administrator actually sees on /content/terms-and-conditions/edit, and that reason holds. The shared wording reused across hundreds of other members now drops content management from its list of 'Page not found' screens, which matches the corrected walk. One binding has not yet been seen to work: upload_body_image (R-8.29). The author says plainly that the file chooser never appeared while binding, and the binding throws a clear error if a real run gets no chooser, so calibration will catch it rather than hide it. What would change this ruling: calibration showing that upload_body_image, or the edit-screen readers that find each fact by the value next to its label, read something other than what the criterion names. Those would come back here as adapter-wrong conditions.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5b7de8bb3de24799f14eeaffd5525c57dc4ac8fd`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
