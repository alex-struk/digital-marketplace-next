---
stage: "build"
title: "build slice 5"
at: "2026-10-01T04:40:56.528Z"
cost: 0.26608719999999997
turns: 10
session: "6fbdec5c-55b5-426b-b46b-85a8df019505"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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