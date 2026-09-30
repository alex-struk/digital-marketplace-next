---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T06:42:21.198Z"
cost: 0.39352539999999997
turns: 17
session: "b932c16d-b6ed-46b4-afa2-0255c5ca7ce0"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I changed the one observation this ruling returned, `fileEmbeddedImage.imageRenderedInPublishedText` (R-8.29), and nothing else. I couldn't run the typecheck: the session refused approval for the `tsc` command, so the edit has only been checked by reading it. It hasn't been run end to end against a published page with an image in it either.

**Throw replaced with a return.** The observation still waits for the published `/content/:slug` page to finish drawing, the `ready()` wait this revision added. It then polls for about five seconds for an image kept at `/api/files/<id>`, where the id comes from the `FILE_ID` marker last written into the body. When that image never arrives, it now returns whatever image sources the body shows, or an empty string if there are none. It no longer throws `unbound: …`. The page exists and the observation binds to it, so a missing image is for R-8.29's assertion to report.

**Image search limited to the body text.** On the target I opened the seeded `/content/about-us` page and looked at how it is laid out. The only image anywhere on it is the site header's logo, `/images/logo.svg`. The page's title (its top heading) is followed by a line reading "Published … | Updated …", then the body. `imageSources()` now starts from that heading and collects images only from what follows it, skipping the Published/Updated line. This is the same region `contentView.pageBody` already reads. It still picks up images with no name, so they are included, but it no longer uses `document.images` or a page-wide image-role search. The header logo therefore can't satisfy the test. If the page has no top heading, the function returns an empty list. Against `about-us` the new scoping returns nothing, which is correct: that page's body has no images.

**Bindings file.** `bindings.yaml` already listed `image_rendered_in_published_text` as `bound`, so I left it as it was. Nothing outside `tests/adapters/old/` was touched, no route failed to resolve, and no password or environment value appears in anything written.