---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I checked each one on the running target, but I couldn't compile or run the suite: the type checker needs a command approval this session doesn't have, and the workspace has no `node_modules`."
opened: 2026-10-01T10:54:02.559Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I checked each one on the running target, but I couldn't compile or run the suite: the type checker needs a command approval this session doesn't have, and the workspace has no `node_modules`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've made all three changes in `tests/adapters/new/index.ts`. I checked each one on the running target, but I couldn't compile or run the suite: the type checker needs a command approval this session doesn't have, and the workspace has no `node_modules`. The test runs on target new will be the real check. `bindings.yaml` is unchanged, because no member moved between bound and unbound. Nothing outside `tests/adapters/new/` was touched.

**Condition 1 (refusals in `saveDraft` and `publish`).** These actions no longer throw when the person is refused.
- **What changed:** this covers the create form's Save draft, Submit for review and Publish when the form answers "Page not found", and `opportunityCwuEdit.publish` when the screen is refused or offers no "Publish". The refusal is now added to a list kept in the adapter and printed with `console.info`, and the action returns. The test's own follow-up reading then decides the outcome, as it does on target old.
- **What still throws:** the existing "unbound" for a person who may create but finds the form missing, and the "control is disabled" error.

**Condition 2 (`addAttachment`).** `addAttachmentFile` no longer returns after a general wait for the page to settle.
- **What I saw on the target:** a new file's row reads "Uploading…" for under 100 ms. Then it gets its "Download <name>" link to `/api/files/<id>`. A file over 10 MB gets the alert "<name> is too large to attach" straight away. The create form behaves the same way.
- **What changed:** the action now waits, up to 30 seconds, until the row for that file name carries the link or a "too large to attach" / "could not be attached" alert. If neither appears, it throws an error naming the file and what its row shows. This covers both `fileAttachmentControl.addAttachment` and `opportunityCwuCreate.addAttachment`.
- **Small supporting change:** `offerFile` now returns the name it offered the file under.

**Condition 3 (R-1.21, the missing "incomplete" alert).** I tested this on a live draft with an empty location, signed in as the public sector employee.
- **`submitForReview`:** it was not the cause. It does press "Submit for review", there is no confirmation step, and the page stays where it is.
- **`opportunityTab`:** it does not reload when already on `?tab=opportunity`. It only navigates when on a different section.
- **The cause:** the alert "This opportunity is incomplete" is drawn inside whichever section is open. Pressed from Summary, the alert sat in the Summary section. Moving to the Opportunity section lost it, whether by loading the address or by clicking the section link. Summary is the default section, where `open()` and a fresh save land. So the cause is the section the button was pressed from, combined with the tab switch in `opportunityTab`. Pressed from `?tab=opportunity`, the alert appears in the Opportunity section and is still there 6 seconds later.
- **What changed:** `submitForReview` now goes to the Opportunity section before pressing, then leaves the page alone.
- **Uncertain:** I can't see the R-1.21 test. That this is its path is inferred from the target's behaviour, not confirmed. A test that reads `summary_tab` after submitting would now lose the alert instead.

**R-1.48 and R-1.9 (Sprint With Us and Team With Us create screens).** These stay unbound with their existing reasons.
- Signed in as the public sector employee, the "Create a Sprint With Us opportunity" and "Create a Team With Us opportunity" links on `/opportunities/create` both lead to "Page not found".
- So do `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` opened directly, and the short forms `/opportunities/swu/create` and `/opportunities/twu/create`.
- Neither route resolves on this target.

To probe, I created a throwaway Code With Us draft as the public sector employee and deleted it afterwards. The only other leftover is one unsaved file uploaded on the create form, which I never saved.

No condition is deferred.
