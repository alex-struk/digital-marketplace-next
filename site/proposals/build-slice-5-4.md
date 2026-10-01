| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T04:40:56.584Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 5 (An administrator can write and manage the service's pages) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision: the ruling didn't ask for any.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application in this revision: the ruling didn't ask for any.

**Why nothing changed:** 17 of slice 5's 18 criteria passed. The one that failed, R-7.8, failed because of a fault in the test adapter, not in the app. The ruling also confirmed that the previous build's two changes need no revision:
- the image-chooser fix for R-7.26 and R-8.29;
- keeping the current title or body when a request leaves one out, which matches R-7.20 (it refuses an empty title, not a missing one).

**Why R-7.8 fails:** the public page at `/content/<address>` shows its dates as a definition list, with "Published" and "Last updated" as terms and each date in the element after its term. The design specifies this layout (`design/DESIGN.md:1614`, `design/catalogue/content-view.default.stories.tsx:30`). I checked `app/frontend/src/screens/content-view.tsx` against the story and they match:
- the dates use `data-testid="content-published-date"` and `content-updated-date`;
- the labels are the same as the design's.

The adapter's `contentView.updatedDate` instead looks for a line like `Updated <date>`. "Last updated" never matches that, so the adapter reads an empty string both before and after an edit, and the test fails. Changing the page to suit the adapter would move it away from the approved design, and three earlier builds had already changed the app over this same fault. So I left the page alone.

**Not mine to do:** rebinding `contentView.updatedDate` (and `publishedDate`, for consistency) in `tests/adapters/new/index.ts:698` to read the value after the "Last updated" and "Published" terms. That fix belongs to bind-adapter, the ruling has already filed it there, and I didn't touch the adapter. Once it's rebound, R-7.8 should pass against this tree. If it still fails after that, the fault is in the app again.

**Check:** `npm --prefix app run check` passes. Typechecking passes in the migrations, backend and frontend packages, and all unit tests pass: 16 in migrations, 315 in backend, 177 in frontend. Dependencies weren't installed in this workspace, so I installed them to run the check. I then deleted the `node_modules` folders because the app has no ignore file and they would otherwise have gone back with the proposal. That install may have rewritten the lockfile. I couldn't tell, because the workspace has no version control to compare against.

**For the next slice:** nothing new is missing from slice 5. It has everything it had when it was returned.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 5 (an administrator can write and manage the service's pages) do what its 18 criteria say, and nothing more? Verify ran for this proposal (build-slice-5-4) against application tree 400635c and is current. All 18 claimed criteria passed, none failed, and none went unasserted. That includes R-7.8 (publishing a change keeps the old wording as an earlier version), which had failed before because the test adapter read the page's dates wrongly; it now passes against this unchanged tree. That confirms the build's reading that the page matched the design and the adapter was at fault. On the rest of what a merge answers for, the code does what the criteria say. The backend refuses every page request from anyone but an administrator before it looks at which page is named, with one 401 refusal in the same shape whether the page exists or not (R-7.10, R-7.16); the in-memory tests and the end-to-end tests both check this across visitor, public sector employee and vendor. Title, address and body are checked against the limits the criteria give, every failing field is named, and an address another page holds is refused, including when two requests race for it and hit the database's uniqueness rule (R-7.20 to R-7.22). Pages the service needs are refused a rename or a removal on the server as well as on the screen (R-7.25). Removing a page deletes every version in one transaction (R-7.9). Publishing a change adds a new version and takes no record of which version it was based on, as R-7.28 specifies. Only an administrator is told who published or changed a page (R-7.27). An inserted image is stored readable by anyone and written into the body as an @file/<identifier> marker, which becomes a download address only when the page is displayed (R-8.29). The always-answering service level agreement page (R-7.18) is answered without being stored, so the fresh-installation list still shows exactly twenty-two needed pages (R-7.12); decision record 0026 explains this and the tests cover it. Nothing built belongs to another slice. The only contract change, accepting an address as well as an identifier when changing or removing a page, follows from R-7.4 and is documented. Unit tests cover the new seams: the page rules, the page store interface, the controller over the database's real table layout, the editor's formatting functions, and the screens. I saw no secret, credential or personal data. The test tokens are generated by a test identity server, and the seeded names are placeholders. The build's worry that installing dependencies rewrote the lockfile is not borne out: no lockfile is in the diff's file list. The failed egress check (internal ticket numbers) points only at files from earlier proposals, slices 2 and 3, none of which this diff touches. What would change the ruling: a failure in a later verify run against this tree, or a lockfile or dependency change turning up on the branch that the diff summary does not show.

**Conditions:**
none
