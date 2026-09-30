---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T00:58:04.869Z"
cost: 1.0892788
turns: 35
session: "d5c8a19c-d5fc-4006-be2a-209d293948f5"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the R-8.31 finding in `tests/adapters/old/index.ts`. `tests/adapters/old/bindings.yaml` did not need to change. I couldn't compile the adapter: running `tsc` against the tests project wasn't approved in this session, so I checked the edits by reading them instead. I also did not re-run the calibration criterion.

**What the target does.** I opened the seeded published Code With Us opportunity (`seed.opportunities.publishedCodeWithUs`) at `/opportunities/code-with-us/<id>/edit?tab=opportunity`, signed in through the administrator session route. I chose "Edit" from the Actions menu and walked Next to the "Attachments" step. After I added a PDF through "Add Attachment", the step showed it only as a `blob:` link. The top bar offered only "Publish Changes" and "Cancel"; there was no "Save Changes". Pressing "Publish Changes" opened a dialog titled "Publish Changes to Code With Us Opportunity?". Once I confirmed it, the page announced "Opportunity Changes Published" and the links changed to `/api/files/<id>?type=blob`. So the reviewer's diagnosis was right: the old adapter only saved the form on Team With Us opportunities, so on Code With Us the file was never stored.

**What I changed.**
- **`add_attachment` (file-attachment-control):** it no longer checks which program the opportunity belongs to. Whenever the top bar offers "Publish Changes" and the step shows a `blob:` preview of the new file, it saves through the same routine the removal action uses: press the save control, confirm the dialog, wait for the save to finish. If there is no preview, it doesn't save. A refused oversize upload leaves no preview, and publishing then would wipe the refusal message that `upload_refused_for_size` reads next.
- **`attachment_address`:** it no longer uses its own save order, which tried "Save Changes" before "Publish Changes". It now uses the same save routine, which tries "Publish Changes" first. If the step shows only a preview and the top bar has no save control, it throws `unbound:` naming the step and the controls it looked for. If it saved but no `/api/files/` link appears within about ten seconds, it throws with whatever the page is showing. It returns empty only when it reached the Attachments step and there is genuinely no attachment on it, neither a preview nor a stored link.
- **Save routine (`saveAttachmentForm`):** its error message now describes what was just done (adding or removing a file) instead of always saying "removed the attachment".

**Side effects on the running target.** Checking this left a small test PDF stored as an attachment on the seeded published Code With Us opportunity, and published an update to that opportunity. Later runs against the same seed will see that extra attachment. I deleted the local copy of the file afterwards.

No page's route failed to resolve during this check. I didn't touch anything outside `tests/adapters/old/`, and nothing asked me to.