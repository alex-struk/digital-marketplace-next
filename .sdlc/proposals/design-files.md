---
gate: G-DESIGN
question: "Do these screens serve the files criteria, and are they built out of the design system?"
recommendation: "Each has a `screens.yaml` entry and one story per declared state, 28 stories in all."
opened: 2026-09-19T07:49:16.517Z
---

# Do these screens serve the files criteria, and are they built out of the design system?

**Recommendation.** Each has a `screens.yaml` entry and one story per declared state, 28 stories in all.

I've designed all six files pages. Each has a `screens.yaml` entry and one story per declared state, 28 stories in all. Every `test_id` on these pages in `spec/contract/surface.yaml` is filled in, and I checked that each ID appears in at least one story. I added a new "Domain: files" section to the end of `design/DESIGN.md` and changed nothing that other domains had written. The catalogue has not been compiled or scanned yet. That happens when my turn ends, and the result goes to `design/report.json`.

**The biggest judgement call: the three service addresses.** `file-upload`, `file-description` and `file-download` answer with data or with the file itself, never with a page, but the surface still requires a story per state. I followed the precedent of the Service status page (`scheduled-transition-trigger`) and built each story as a "response reference". It shows the request a caller sends and the answer that comes back, with each part of the answer the surface names carrying a test ID. `DESIGN.md` says plainly that a build does not render these, and it maps each ID to the part of the HTTP answer the adapter should read. A reviewer may prefer a different convention, so this needs a ruling.

The states are the distinct answers the service can give:
- **Upload:** stored, signed out, too large, name too long, invalid read access, no file, and a genuine service fault. The fault state is there so that "the requester's mistake is never a fault" has something to compare against.
- **Description and download:** each has default, refused and not found. Refused covers both a forbidden file and a missing one for anyone but an administrator, as R-8.12's accepted wording says. Not found is the administrator's answer.

**The three shared controls:**
- **Attachment control:** default, empty, new-attachment, invalid, too-large and public-view.
  - New-attachment shows a "Will be saved as: Statement of work.pdf" line, so the restored ending is visible before saving.
  - Invalid shows the error on the attachment itself, as R-8.27 describes.
  - Too-large puts a message naming the 10 MB limit on the file's own row.
  - Public-view is the opportunity's own page, with plain download links and no Remove.
- **Image picker:** default (stored picture), empty, chosen (a preview not yet stored), and rejected.
- **Embedded image:** default, uploading, inserted, failed and published. Published shows the reader's view, because two of this control's observations only exist there.

Every control states the accepted types and the 10 MB limit next to its trigger, before a file is chosen (R-8.17). Each also says in one sentence who can see the file, because a file is never removed.

**Components.** The catalogue leans on the design system's `Button`, `TextField` (read-only for stored attachment names), `Link`, danger `InlineAlert` with `role="alert"`, `ProgressCircle`, `Text` and `Heading`, plus `FileTrigger` from `react-aria-components`, which the earlier domains already use. Three project-owned pieces are listed openly under their own heading in `DESIGN.md`: an attachment list, a picture preview (a plain `<img>`), and the response reference, which exists only in the catalogue. Other domains asked me to reuse `attachment-add-button`, `change-avatar`, `content-body-image-button` and `content-body-field`, and I did. I also asked the content domain's text renderer to tag every image it renders with `content-body-image`. No colour value is written anywhere, and every size comes from a token. The one exception is `max-width: 100%` with `height: auto` on images, so they never overflow the column.

**Gaps, recorded in `DESIGN.md` rather than filled with invented behaviour:**
1. **No declared size:** R-8.17 replaced R-8.3 but says nothing about an upload that doesn't declare its size. The action is bound, but its answer has no state.
2. **No usable name:** R-8.23 still points to the superseded R-8.4 for an upload with no name.
3. **Not authorized vs not found:** R-8.12 is still open for a ruling.
4. **Refused links opened in a browser:** no criterion says whether a browser should see a page instead of the bare refusal.
5. **When Remove is hidden:** no criterion says when a stored attachment can't be removed on an editable form, so Remove is hidden only on the opportunity's public page.
6. **Status codes and wording:** there are no status numbers, and almost all message wording is mine.
7. **Early checks:** checking size and file ending as soon as a file is chosen is a design choice. No criterion requires it.
8. **Conflicts in other domains' stories:** the opportunities stories say the limits appear only after a file is chosen, which contradicts R-8.17. The users stories offer every image type, which R-8.30 refuses. I can't edit those stories.
9. **Image marker and description:** how the internal image marker is spelled isn't specified. The placeholder alternative text inserted with an image ("Describe this image") is also my choice.
10. **Unused inserted images:** an image is stored and public the moment it's chosen, even if the text never keeps it.
11. **Picture display size:** there is no token for it, so pictures show at their stored size, at most 500 pixels.
12. **Resize outcomes:** R-8.21 and R-8.13 leave the person's view of an image that couldn't be resized, and one over both limits, unstated.

Keyboard, screen-reader and focus checks on the choosers are listed in `DESIGN.md` as still to be done by hand before the build is accepted.
