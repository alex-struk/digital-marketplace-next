---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T10:45:56.180Z"
cost: 6.3594342
turns: 118
session: "95537401-c1aa-4dfc-ab27-e516e06e26ec"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I made changes for all four findings, but I couldn't run any of them. Node isn't permitted in this workspace, there's no `node_modules`, and the browser tool can't load the TypeScript. So none of the new code has been type-checked or executed. What I did do was replay each flow by hand on the running target at http://localhost:4300, which showed the causes below, and then re-read every edited region. All changes are in `tests/adapters/old/index.ts`. `bindings.yaml` is unchanged because every member involved was already bound and still is. Every route I used opened.

**R-1.10 (Teaser and Description over the limit on the Code With Us form).** The finding's diagnosis of the Description was right. Its markdown editor has its own image "Choose File" input, and the field-message reader counted that as a second field and stopped before reaching the message. The reader now ignores file inputs. If it still finds nothing, it also reads what follows the box inside the field's own group (the element holding its label). Replaying that logic in the browser, it read the Teaser, Title and Description messages, and read nothing on valid fields.

I could not reproduce the Teaser failure. A 501-character Teaser is entered and its message survives a full walk through the steps with the rest of the form completed, and the old reader already read it correctly. Old checks these boxes about half a second after the last change. So I added a pause of up to 0.9 seconds after entered values, taken before any step change and before Publish or Submit for Review is pressed. That covers the remaining timing risk, but I can't prove it was the Teaser's cause.

**R-1.17 (Team Questions on the Sprint With Us form).** The Question value was being entered. The problem is that old validates a question's box about half a second after it changes, and changing another box of the same question before then cancels that check. The Question is entered before the Response Guidelines, so its message never appeared; the Guidelines, entered last, did get checked, which is why that row passed. The cancelled check is also lost if the step is left too soon.
- After typing into a question box, the adapter now waits out that delay when the value is empty or over 1,000 characters (the range old states for these boxes). An empty value is still typed, then cleared, then the box is left, so a change fires.
- Valid values don't trigger that wait, so 102 questions still fit in the test's two minutes. By hand, the 102 questions took about 55 seconds to enter.
- With 102 valid questions, old enables "Submit for Review". After the confirmation it stays on the form and shows "Unable to Submit Opportunity — Sprint With Us opportunity could not be submitted. Please try again later."
- `submitForReview` now waits for either the record's address or a new refusal alert, and keeps that alert. `fieldError` adds it to what it reads, even if the alert has gone by then.
- A disabled "Submit for Review" still ends the action without pressing, leaving the form's messages for `fieldError`. That is unchanged.

**R-7.26 (image embedded in a content page).** On the published `/content/<slug>` page, old draws the body image as `img alt="body-image.png"` with an empty source, in the paragraph after the "Published … | Updated …" line. The reader now drops an image only when every line of the enclosing element is a date or the "|" between them, rather than any container whose text starts with "Published". Separately, the upload wait used to stop at any visible alert, including a "published" notice left over from an earlier step, so the test could publish before the `![name](FILE_ID:<id>)` marker was written. The wait now ignores alerts that were already up, and ends only on a new image reference in the Body box or a new alert. `imageInsertedIntoText` now re-reads the Body box for up to five seconds.

**R-8.31 (attachment on a just-published Code With Us opportunity).** Walked by hand end to end on an opportunity I created and published for the purpose: choose Edit from Actions, hand the file to the Attachments step's input (a `blob:` preview appears), press "Publish Changes" and confirm "Publish Changes to Code With Us Opportunity?". The step then links the file at `/api/files/<id>`. The adapter's add path could end silently in two places, and both now raise:
- **Wrong input.** It could hand the file to an editor's image-only input on another step. It now uses only a "Choose File" that doesn't restrict itself to images, and only on the Attachments step.
- **Silent endings.** If no preview appears, it now raises unless a new refusal alert or a message on the step explains why. If the save produces no new `/api/files/` link, it raises and says what the page shows.

On the target I left several draft Code With Us and Sprint With Us opportunities, one published Code With Us opportunity with an attachment, and one published content page. I opened the seeded published Code With Us opportunity for editing and added a file to it, but cancelled without saving. Nothing outside `tests/adapters/old/` was touched.