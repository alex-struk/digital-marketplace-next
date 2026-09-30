---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the one flagged binding, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), but I could not run the TypeScript compiler, so the edit is not typechecked."
opened: 2026-09-30T06:40:04.438Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the one flagged binding, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), but I could not run the TypeScript compiler, so the edit is not typechecked.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-old-50 keep fileEmbeddedImage.imageRenderedInPublishedText (R-8.29) an adapter, meaning navigation and locators only? Ruling: return. The revision correctly waits for the published /content/:slug page to draw (ready()), polls for the image instead of reading an empty page too early, and also collects images that have no name. It touches nothing under tests/acceptance, and the runner's typecheck passed with no diagnostics under adapters/old/. But when no image kept at /api/files/<id> appears within about five seconds, the observation throws 'unbound: …' instead of returning what it observed. unbound means the application provides no surface for the adapter to bind. Here the page exists and the observation bound to it. An image missing from the published text is the very outcome R-8.29's then-clause ('a reader of the finished page sees the image') tests. Throwing would record a genuine product failure as a binding gap and route it toward test-overreach or re-scoping, which could get a correct test re-derived. That is the adapter deciding the outcome's classification, which is not an adapter's job. The throw exists because the observation reads every image on the whole page (document.images), so an unrelated image such as the site header's logo would satisfy the test's toBeTruthy. The right fix is a locator fix: scope the observation to the published body text, and return an empty string on timeout. What would change the ruling: a revision that scopes to the rendered body and returns rather than throws when the image never appears.

**Conditions:**
- tests/adapters/old/index.ts fileEmbeddedImage.imageRenderedInPublishedText: when no matching image appears before the wait ends, return the sources observed (an empty string when there are none) instead of throwing 'unbound: file-embedded-image.image_rendered_in_published_text'. The observation is bound: the published page exists. An image absent from it is a failure of R-8.29's then-clause for the test's assertion to report, not a surface the application lacks.
- tests/adapters/old/index.ts imageSources()/imageRenderedInPublishedText: collect image sources only from the published page's body text, not every image in the document (document.images and page-wide getByRole('img')), so an unrelated image elsewhere on the page, such as a header logo, cannot be returned as the image rendered in the published text. Keep the ready() wait and the polling for an image kept at /api/files/<id> that was introduced in this revision.

### Runner-owned typecheck evidence

Proposal revision: `42688e8e5da29e0388c275ecbd4e4eaf147cc4a8`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
