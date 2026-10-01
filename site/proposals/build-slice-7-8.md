| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T10:35:37.218Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I left the application as it was: this revision changes nothing under `app/` or `docs/decisions/`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I left the application as it was: this revision changes nothing under `app/` or `docs/decisions/`. The ruling found the application correct and sent all five conditions to bind-adapter, which builds the test adapter for this target. None of them asks this stage to change the application. Changing it anyway would mean the adapter gets fixed against a different application from the one the ruling looked at, and the ruling says that is how to tell whose fault a failure is.

**Check:** `npm --prefix app run check` passes: it typechecks every package under `app/` and runs the unit tests (233 frontend tests in 14 files, and the backend tests). The first run failed with `tsc: not found` because this workspace had no installed dependencies. After `npm ci` it passed. That is a problem with the workspace, not the application, and `package-lock.json` is unchanged.

**Criteria:** Slice 7's 18 criteria are built as the earlier rounds of this slice left them. What each one does in the running application, as the ruling reads it:
- **R-8.19 and R-8.25 (attachments):** a chosen file is stored as soon as it is picked, and its row shows an `/api/files/` download link. The row is still worded "New: \<name\>, \<size\>" (`app/frontend/src/app/attachments.tsx:347`), and the adapter currently discards rows with that wording. I kept the wording because the condition sent to bind-adapter is written against that exact row.
- **R-1.22 (publish):** Publish is offered to an administrator on a draft or an opportunity under review (`opportunity-cwu-edit.tsx:137`). For public sector staff it is missing, which is the refusal the criterion asks for.
- **R-1.21 (edit):** on a draft, the opportunity tab shows the form already editable, so there is no separate Edit control.
- **R-1.7 (create):** a vendor or visitor who opens the create page gets "Page not found", which is the refusal the criterion asks for.
- **R-8.17 (upload size):** the attachment control says "Any type of file, up to 10 MB each." before a file is chosen, and an oversize upload is refused with a message naming the limit. The ruling could not tell which step read empty, and the re-run that would find out belongs to bind-adapter.
- **R-1.51:** the ruling says the tests never assert it and did not rule on it, so nothing here changes it.

**Not done here:** all five bind-adapter conditions — counting an attachment row with a download link as stored, reporting a missing Publish control for non-administrators as a refusal, editing the draft form in place, reporting "Page not found" for a vendor as a refusal, and re-running R-8.17 to say which step read empty. They concern the adapter at `tests/adapters/new/`, which is outside this stage's paths.

If the remapped adapter still reads these criteria as failing against this same application, the ruling says the next return goes to build. That stage would then start from the application exactly as it was submitted for this ruling.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 7 meet its criteria, now that the bind-adapter answers to the 7-7 return have been applied and verify still fails 5 of 18? Ruling: return, addressed to bind-adapter again, not to build. runner:verify's account said the failures may not be the application's, and reading the failures against the code bears that out. The application refuses correctly, yet each failure comes from the new-target adapter. (1) R-1.7 and R-1.22: the application refuses as the criteria ask ('Page not found' for an anonymous visitor at /opportunities/code-with-us/create; no Publish among a staff member's actions 'Edit', 'Submit for review', 'Delete'). The adapter now throws '— refused: …' (tests/adapters/new/index.ts:5688, :5695, and saveDraft), but both tests attempt the action and then read the outcome from an administrator's view, and neither catches. Both tests pass on target old (tests/results/old/latest.json), whose adapter returns quietly when refused. My 7-7 wording 'report it as a refusal' was carried out as a throw these tests cannot absorb. (2) R-8.19 and R-8.25 still read '' at existingAttachmentRow straight after addAttachment. The adapter now counts a row with an /api/files/ link as stored (index.ts:5815-5820). But the application renders that link only once the upload has finished (attachments.tsx:349, attachment.stored), and addAttachment returns after a generic settle() without waiting for it. (3) R-1.21: the application puts the 'This opportunity is incomplete' alert inside the section of whichever tab is open (opportunity-cwu-edit.tsx:237, :329-332). That alert is in-page state, and the opportunityTab text the test read does not contain it. Either submitForReview never pressed the control, or a reader reloaded the page and dropped the alert. R-8.17 now passes. R-1.51 is never asserted and is not ruled here. What would change the ruling: if a bind-adapter revision that returns quietly on refusals, waits for the upload, and keeps the R-1.21 alert on the page still reads these criteria as failing against application tree a21fb0c, the next return goes to build.

**Conditions:**
- addressed-to bind-adapter: on target new, opportunityCwuCreate.saveDraft and opportunityCwuEdit.publish must return without throwing when the person is refused (the create page answers 'Page not found', or no Publish control is offered), so the test's own follow-up observation decides. The refusal can be recorded in a log, not as an error. R-1.7 and R-1.22 fail on target new with the error '— refused: …' thrown from index.ts:5688/:5695 and from saveDraft. Both tests call the action and then read the outcome from an administrator's dashboard or the opportunity's status, without a try/catch, and both pass on target old, whose adapter does not throw there.
- addressed-to bind-adapter: fileAttachmentControl.addAttachment (and opportunityCwuCreate.addAttachment) on target new must not return until the added file's row carries its 'Download <name>' link to /api/files/ or shows the '<name> is too large to attach' / 'could not be attached' alert. The app renders that link only after the upload completes (app/frontend/src/app/attachments.tsx:349, attachment.stored). R-8.19 and R-8.25 still read '' at existingAttachmentRow() immediately after addAttachment, although isStored now accepts a linked 'New:' row (index.ts:5815-5820), because addAttachment returns after a generic settle().
- addressed-to bind-adapter: R-1.21 on target new read opportunityTab() without the word 'incomplete' after opportunityCwuEdit.submitForReview on a draft whose location was emptied. The app shows the alert 'This opportunity is incomplete' inside the open tab's section (opportunity-cwu-edit.tsx:237, :329-332). It is in-page state, and a page.goto or reload loses it. Check that submitForReview actually presses 'Submit for review' and leaves the page as it is, and that opportunityTab reads the current page without reloading when it is already on ?tab=opportunity. Report which of the two was the cause.
