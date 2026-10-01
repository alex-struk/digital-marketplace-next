---
stage: "build"
title: "build slice 7"
at: "2026-10-01T09:38:45.022Z"
cost: 3.2963244000000005
turns: 69
session: "0923ab32-11b7-41ed-988d-864203e8dbd1"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've reworked the attachment control so a chosen file is stored straight away and its download address shows at once. I couldn't confirm against the running application that R-8.17, R-8.19 and R-8.25 now pass: this session wasn't allowed to start the sandbox (`docker compose` needed approval), so the fix rests on reading the contract, not on watching the failure. `npm --prefix app run check` passes: typecheck plus 16 migration tests, 394 backend tests and 233 frontend tests.

**What I think caused the empty reads.** The acceptance surface for the attachment control lists adding, renaming, removing and downloading a file, but no way to save the form. It also says the download link's address is how a test reaches "a file it has just uploaded". The previous build only uploaded files when the host form was saved. So right after a test added a file there was no download link to read, which fits R-8.19 and R-8.25 reading `""`. The file was also attached to nothing, so publishing straight away from the action bar would have published without it.

**What changed:**
- **Choosing a file.** A file within the limit is now uploaded straight away, under its own name and with no read access recorded on the file (R-8.19). Its row then shows a download link at `/api/files/<id>?type=blob`. Files over the limit are still refused where they were chosen and never sent (R-8.17).
- **On a saved opportunity.** On the manage page's Opportunity tab, the file is also attached to the opportunity at once, through an edit that names only the attachments. Whatever the person does next (publish, leave the tab, save), the opportunity carries the file and it becomes readable when the opportunity is published (R-8.25). Removing a newly added row detaches it at once. Removing an attachment that was there before is still applied on save. Text being typed elsewhere in the form is kept, because the form now resets only on a real save.
- **On the create page.** There's no opportunity yet, so the file is uploaded at once and attached when the draft is saved, submitted or published.
- **Renaming (R-8.27).** Still works before saving: on save, a renamed file is uploaded again under the new name and that copy is the one kept. The copy under the original name is left attached to nothing and readable only by whoever uploaded it.
- **Read-only view.** Where the Opportunity tab is read-only (an author on a published opportunity), it now states the size limit and that only an administrator can add an attachment at this stage. I can't tell which account the R-8.17 test uses. If it's the author on the seeded published opportunity, the old page had no size-limit text there at all.

This goes against `design/DESIGN.md`, which says an attachment is uploaded when the form is saved. The reasoning is in `docs/decisions/0033-an-attachment-is-stored-when-it-is-chosen.md`. Main files: `app/frontend/src/app/attachments.tsx`, `opportunity-cwu-form.tsx`, `opportunity-cwu-edit.tsx`, and a new `attachToCwuOpportunity` in `api/opportunities.ts`. The service itself is unchanged.

**Unit tests added or rewritten** (`app/frontend/tests/code-with-us-opportunities.test.tsx`):
- On the create form, a file is stored at once with its link and attached on save.
- A renamed file is uploaded again under its new name on save.
- A name over 255 characters is stored only under its original name.
- On the manage page, a file is attached at once without losing what's being typed.
- Removing a new row detaches it at once.
- A refused attachment says why.
- The read-only view states the limit and offers no add button.

**The three conditions from earlier rulings:**
- **`build-slice-7-3#1` (dashboard table): already met.** `/dashboard` lists the person's own opportunities, or all of them for an administrator, with title, status and a link to each. The design has no tabs on this page.
- **`build-slice-7-3#2` (Publish on a draft): already met.** An administrator on a draft is offered Edit, Publish and Delete, and an existing unit test covers it.
- **`build-slice-7-4#3` (recheck against the rebound adapter): partly met.** I rechecked by reading only, since I couldn't run the stack or see the adapter. The latest ruling no longer fails R-1.10 or R-1.21. For R-8.19 and R-8.25 the cause I found is the one above. For R-8.17 the cause is a guess: the page already showed the size limit and the oversize refusal on an editable form, so the empty read most likely came from the read-only view now fixed above. If it still fails, the next stage needs a run against the live stack.

Nothing outside `app/` and `docs/decisions/` was changed. The next slice should know that uploads now happen when a file is chosen, and that a renamed upload leaves the first copy detached; slices 9, 10 and 14 reuse this control.