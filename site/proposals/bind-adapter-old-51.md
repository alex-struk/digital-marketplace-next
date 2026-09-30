| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T06:42:21.284Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed the one observation this ruling returned, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), and nothing else.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed the one observation this ruling returned, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), and nothing else. I couldn't run the typecheck: the session refused approval for the `tsc` command, so the edit has only been checked by reading it. It hasn't been run end to end against a published page with an image in it either.

**Throw replaced with a return.** The observation still waits for the published `/content/:slug` page to finish drawing, the `ready()` wait this revision added. It then polls for about five seconds for an image kept at `/api/files/<id>`, where the id comes from the `FILE_ID` marker last written into the body. When that image never arrives, it now returns whatever image sources the body shows, or an empty string if there are none. It no longer throws `unbound: …`. The page exists and the observation binds to it, so a missing image is for R-8.29's assertion to report.

**Image search limited to the body text.** On the target I opened the seeded `/content/about-us` page and looked at how it is laid out. The only image anywhere on it is the site header's logo, `/images/logo.svg`. The page's title (its top heading) is followed by a line reading "Published … | Updated …", then the body. `imageSources()` now starts from that heading and collects images only from what follows it, skipping the Published/Updated line. This is the same region `contentView.pageBody` already reads. It still picks up images with no name, so they are included, but it no longer uses `document.images` or a page-wide image-role search. The header logo therefore can't satisfy the test. If the page has no top heading, the function returns an empty list. Against `about-us` the new scoping returns nothing, which is correct: that page's body has no images.

**Bindings file.** `bindings.yaml` already listed `image_rendered_in_published_text` as `bound`, so I left it as it was. Nothing outside `tests/adapters/old/` was touched, no route failed to resolve, and no password or environment value appears in anything written.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-old-51 bind every surface action and observation on old, and nothing else, having answered the two instructions G3 left owed on bind-adapter-old-50? Ruling: approve. imageRenderedInPublishedText no longer throws 'unbound'. After the ready() wait and about 5s of polling for an image at /api/files/<id>, it returns the body's image sources, or an empty string, so a missing image is left for R-8.29's assertion to report. The polling only ends the wait early and decides no outcome. imageSources() now collects <img> sources only from the elements after the page's h1, skipping the Published/Updated line. That is the same region the existing pageBody binding walks (tests/adapters/old/index.ts:8456), so the header logo cannot be returned. Only tests/adapters/old/index.ts changed among the stage's outputs, nothing under tests/acceptance was touched, and the runner's typecheck on cddb0ea4e passed with no diagnostics. The change has not been run against a published page containing an image; the next verify/calibrate run establishes that. What would change this ruling: evidence that the published body is not rendered as siblings of the h1. Both pageBody and imageSources() would then read the wrong region, and the binding would need to change.

**Conditions:**
- condition-met bind-adapter-old-50#1: imageRenderedInPublishedText in tests/adapters/old/index.ts now returns sources.join("\n") after the ready() wait and a 5s poll for /api/files/<id>, with no throw; the result is empty when the body shows no images.
- condition-met bind-adapter-old-50#2: imageSources() in tests/adapters/old/index.ts collects <img> src values only from the h1's following siblings, skipping the Published/Updated line (the same region pageBody reads), and no longer uses document.images or page-wide getByRole('img'); the ready() wait and the /api/files/<id> polling are kept.

### Runner-owned typecheck evidence

Proposal revision: `cddb0ea4e92010c4aada6c32a4b373c7c872a8e9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
