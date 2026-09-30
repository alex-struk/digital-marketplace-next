---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the R-8.31 finding in `tests/adapters/old/index.ts`."
opened: 2026-09-30T00:58:04.898Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the R-8.31 finding in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-8.31 finding in `tests/adapters/old/index.ts`. `tests/adapters/old/bindings.yaml` did not need to change. I couldn't compile the adapter: running `tsc` against the tests project wasn't approved in this session, so I checked the edits by reading them instead. I also did not re-run the calibration criterion.

**What the target does.** I opened the seeded published Code With Us opportunity (`seed.opportunities.publishedCodeWithUs`) at `/opportunities/code-with-us/<id>/edit?tab=opportunity`, signed in through the administrator session route. I chose "Edit" from the Actions menu and walked Next to the "Attachments" step. After I added a PDF through "Add Attachment", the step showed it only as a `blob:` link. The top bar offered only "Publish Changes" and "Cancel"; there was no "Save Changes". Pressing "Publish Changes" opened a dialog titled "Publish Changes to Code With Us Opportunity?". Once I confirmed it, the page announced "Opportunity Changes Published" and the links changed to `/api/files/<id>?type=blob`. So the reviewer's diagnosis was right: the old adapter only saved the form on Team With Us opportunities, so on Code With Us the file was never stored.

**What I changed.**
- **`add_attachment` (file-attachment-control):** it no longer checks which program the opportunity belongs to. Whenever the top bar offers "Publish Changes" and the step shows a `blob:` preview of the new file, it saves through the same routine the removal action uses: press the save control, confirm the dialog, wait for the save to finish. If there is no preview, it doesn't save. A refused oversize upload leaves no preview, and publishing then would wipe the refusal message that `upload_refused_for_size` reads next.
- **`attachment_address`:** it no longer uses its own save order, which tried "Save Changes" before "Publish Changes". It now uses the same save routine, which tries "Publish Changes" first. If the step shows only a preview and the top bar has no save control, it throws `unbound:` naming the step and the controls it looked for. If it saved but no `/api/files/` link appears within about ten seconds, it throws with whatever the page is showing. It returns empty only when it reached the Attachments step and there is genuinely no attachment on it, neither a preview nor a stored link.
- **Save routine (`saveAttachmentForm`):** its error message now describes what was just done (adding or removing a file) instead of always saying "removed the attachment".

**Side effects on the running target.** Checking this left a small test PDF stored as an attachment on the seeded published Code With Us opportunity, and published an update to that opportunity. Later runs against the same seed will see that extra attachment. I deleted the local copy of the file afterwards.

No page's route failed to resolve during this check. I didn't touch anything outside `tests/adapters/old/`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the old adapter now binds the attachment actions on a published Code With Us opportunity, as the fourth R-8.31 send asked. It does, and only that: add_attachment drops the Team-With-Us-only guard and saves through saveAttachmentForm (Publish Changes first, confirm dialog, wait) whenever a blob: preview of the new file exists, skipping the save when an oversize refusal left no preview so upload_refused_for_size still reads its message; attachment_address reuses that routine instead of its own Save-Changes-first order and now throws naming the missing control, or the page's messages when no /api/files/ link appears, instead of returning ''. The diff is confined to tests/adapters/old/index.ts and the runner's typecheck on the proposal revision passed with no diagnostics, which covers the author's inability to run tsc. The escalation reason is the rebind loop limit, not a pipeline defect: each of the four sends named a distinct real gap uncovered as the flow was walked further, and this revision answers the last one directly. Tier is STANDARD and no platform article is touched. Noted but not blocking: the doc comment above attachmentAddress still says a save happens when 'Save Changes' is offered, and the author's own check left an extra test PDF on the seeded published Code With Us opportunity. R-8.31 stays unverified until calibrate runs its test. This would change to a return if calibration shows the stored link still does not appear on Code With Us, or that the blob-preview check skips a save after a valid upload.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8a4be3ea12806a5b13d09116abe6f9929e96bcc2`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
