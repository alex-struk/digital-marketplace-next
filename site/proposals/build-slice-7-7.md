| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T09:38:45.106Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I couldn't confirm against the running application that R-8.17, R-8.19 and R-8.25 now pass: this session wasn't allowed to start the sandbox (`docker compose` needed approval), so the fix rests on rea…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 7 meet its criteria, given that runner:verify escalated after three failed builds and said the fault may not be the application's? Ruling: return, with the work addressed to bind-adapter rather than build. Runner:verify's account settles it: what I could read shows the application is right and the new target's adapter is not. R-8.19 and R-8.25 both read '' at `expect(existingAttachmentRow()).toContain(file)`, which runs straight after addAttachment. The adapter's addAttachment never stores the file, and its existingAttachmentRow drops every row matching /^new:/ (isNew, tests/adapters/new/index.ts:5677). The build now stores a chosen file at once and shows its /api/files download link, but the row still reads 'New: <name>' (attachments.tsx:347), so the adapter filters out a stored attachment. R-1.22 is unbound because the adapter reported a staff member's actions ('Edit', 'Submit for review', 'Delete') as a missing Publish control, while the screen offers Publish on a draft to an administrator (opportunity-cwu-edit.tsx:137, isUnpublished && mayPublishOpportunity). That is a correct refusal read as unbound. R-1.21 is unbound because the adapter looked for an 'Edit' control on ?tab=opportunity, where the draft form is already editable. R-1.7 reports 'Page not found' on the create page, which for a vendor is the refusal the criterion asks for. R-8.17's '' cannot be pinned down from the result: the size statement 'Any type of file, up to 10 MB each.' matches sizeLimitStatedBeforeChoosing's pattern, and the build's guess that the read-only view caused it does not fit a test that signs in as staff on the create page. Another build would not find any of this. The earlier conditions on the dashboard and on Publish-on-draft are met in the diff. The 7-4#3 recheck is superseded by the bind-adapter request. R-1.51 is never asserted and is not ruled here, since the slice is returned anyway. What would change the ruling: if the remapped adapter still reads these criteria as failing against the same application tree, the fault is the application's and the return goes to build.

**Conditions:**
- addressed-to bind-adapter: fileAttachmentControl on target new must treat an attachment row that carries an /api/files/ download link as stored, whatever its label, or addAttachment must leave the added file stored before it returns. R-8.19 and R-8.25 read '' at existingAttachmentRow() straight after addAttachment, because isNew (/^\s*new:/im) drops the row. The app (app/frontend/src/app/attachments.tsx:347-352) now stores the file when it is chosen and shows its download link on a row still worded 'New: <name>, <size>. …'.
- addressed-to bind-adapter: opportunityCwuEdit.publish on target new reported R-1.22 unbound with the actions 'Edit', 'Submit for review', 'Delete' on a draft. Those are a public sector employee's actions. The app offers Publish to an administrator on a draft or under review (opportunity-cwu-edit.tsx:137). For a non-administrator, an absent Publish control is the refusal R-1.22 asks for and should be reported as one, not as unbound.
- addressed-to bind-adapter: opportunityCwuEdit.editDetails on target new reported R-1.21 unbound because it found no 'Edit' control on /opportunities/code-with-us/<id>/edit?tab=opportunity for a draft (actions 'Submit for review', 'Delete'). On a draft that tab shows the form already editable, so the binding should edit the form in place when there is no Edit control.
- addressed-to bind-adapter: opportunityCwuCreate.saveDraft on target new reported R-1.7 unbound because /opportunities/code-with-us/create answered 'Page not found'. For a vendor or a visitor, that is the refusal R-1.7 asks for, and the binding should report it as a refusal. If the same answer came for the administrator or public sector staff, say which persona saw it.
- addressed-to bind-adapter: R-8.17 read '' at a toBeTruthy assertion on target new, and the result does not say which one. The attachment control states 'Any type of file, up to 10 MB each.', which matches sizeLimitStatedBeforeChoosing's pattern. Either fileUpload.refusedForSize or that reader read empty. Re-run R-8.17 and report which step read '' and what the page showed there.
- condition-met build-slice-7-3#1: /dashboard now lists the person's own opportunities (all of them for an administrator), each with title, status and a link (app/frontend/src/screens/dashboard.tsx). The design has no tabs on this page.
- condition-met build-slice-7-3#2: an administrator is offered Publish on a draft as well as under review (app/frontend/src/screens/opportunity-cwu-edit.tsx:137, isUnpublished(status) && mayPublishOpportunity(account)).
- condition-withdrawn build-slice-7-4#3: the recheck it asked of build points to the target-new adapter, not the application, for R-8.19, R-8.25 and R-8.17, and it is now asked of bind-adapter in this ruling's addressed-to conditions. R-1.10 passes and R-1.21 is an adapter binding gap.
