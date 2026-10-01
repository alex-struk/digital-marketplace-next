# 0033 · An attachment is stored when it is chosen, and attached at once to a saved opportunity

- Status: accepted for the build (slice 7, sixth revision)
- Date: 2026-10-01

## Decision

**A file within the limit is stored as soon as it is chosen.** The attachment control
(`app/frontend/src/app/attachments.tsx`) sends a chosen file to `POST /api/files` straight away,
under its own name and with an empty read-access list (R-8.19), and its row then carries a
download link at the file's own address (`attachment-download-link`, `/api/files/<id>?type=blob`).
A file over the limit is still refused where it was chosen and never sent (R-8.17), and a file
whose own name no file may have (R-8.23) waits until the person has given it another.

**On a saved opportunity it is attached at once as well.** On the manage page's Opportunity tab
the control asks the service, as soon as the file is stored, for an `edit` naming only
`attachments` (surface `file-attach-by-identifier`), so the opportunity carries the file whatever
the person does next: publishing from the action bar, leaving the tab, or saving. Removing a new
row detaches it at once in the same way. Removing an attachment that was already there before the
form was opened is still applied when the form is saved, as the control's sentence says. What is
being typed in the rest of the form is kept: the form starts again only when it is saved.

**Renaming is still before saving** (R-8.27). The name field and the "Will be saved as" line are
unchanged. When the form is saved, a new attachment whose resulting name differs from the name it
was stored under is stored again under that name, and that copy is the one the opportunity keeps;
the copy stored under the original name is then attached to nothing, and is readable only by its
uploader (R-8.31 leaves its disposal to the records-retention rule).

On the create page there is no opportunity yet, so a chosen file is stored at once and attached
when the draft is saved, submitted or published.

**The size rule is stated where attachments are read-only too.** An author reading a published
opportunity's Opportunity tab, where only an administrator may change it (R-1.56), sees the
attachments, the stated rule, and that only an administrator can add one at this stage.

## Why

design/DESIGN.md ("When a file is uploaded") had an attachment uploaded only when the host form
was saved. The acceptance surface for the control (`file-attachment-control`) offers adding,
renaming, removing and downloading, and no save; it names `attachment_address` as "how a test
reaches file-download for a file it has just uploaded", and neither the control nor the manage
page names a step that saves the form. With uploads held back until a save, a file chosen there
had no address to read and was attached to nothing, so R-8.19 and R-8.25 read an empty address,
and an opportunity published straight after a file was chosen went out without it.

## What would reverse it

A surface that names saving the Opportunity tab as a step after `add_attachment`, or a ruling
that nothing may be stored before the host form is saved; the service's answers are unchanged
either way.
