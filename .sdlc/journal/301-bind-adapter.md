---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T06:40:04.402Z"
cost: 0.6006340000000001
turns: 16
session: "3d15c159-be8a-4c1e-9348-ee97e0fbae7f"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the one flagged binding, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), but I could not run the TypeScript compiler, so the edit is not typechecked. It also has not been run against the target or checked in the browser.

**The problem.** This observation is read on the published `/content/:slug` page. It collected image sources as soon as `contentView.open` returned, without waiting for the page to finish drawing. So it could read an empty page and return `''`, which a test then took as its answer.

**What it does now:**
- It waits for the page to draw, the same way `contentView.pageTitle` and `pageBody` do on that page.
- It then checks the page's images for up to about five seconds, looking for one whose source contains `/api/files/<id>`. The id is the one named in the body's `FILE_ID` marker.
- The adapter knows that id because the body's text, once the upload writes the `FILE_ID:<id>` reference into it, is now recorded. This happens in two places: in `uploadBodyImage`, and in `fileEmbeddedImage.imageAddress` when it reads the editor's Body field.
- If no upload has been seen, it accepts any image kept under `/api/files/`.
- Images come from those with an image role plus the page's full image list. An image with no name has no image role, so the first source alone would miss it.
- When a matching image appears, it returns all the sources it found.
- If none appears, it throws `unbound: file-embedded-image.image_rendered_in_published_text — …`, naming the page, the address it waited for and every image source the page did show. It never returns `''` in that case.

The changes are all in `tests/adapters/old/index.ts`: the upload helper (around line 8340), a new helper for collecting image sources just below it, and the observation itself (around line 9190).

**Checks.** Both ways of running the compiler needed approval, which nobody is here to give. I checked by reading instead: `tsconfig` targets ES2022 with the DOM library, which covers `matchAll` and `document.images`, and the new code follows patterns already in the file. I relied on the finding's description of how the published page shows the image rather than looking at a published page myself.

`bindings.yaml` did not need changing, since this observation was already listed as bound. No other binding was touched, no file outside `tests/adapters/old/` was changed, and I found no page route in `surface.yaml` that failed to resolve.