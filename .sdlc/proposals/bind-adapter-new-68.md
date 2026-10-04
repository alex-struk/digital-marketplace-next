---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rechecked each listed criterion on the running `new` target at http://localhost:4300."
opened: 2026-10-04T01:42:59.361Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rechecked each listed criterion on the running `new` target at http://localhost:4300.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rechecked each listed criterion on the running `new` target at http://localhost:4300. The build has changed since the last run: two things that were missing are now on the page, and the rest are still missing. I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`. Nothing could check the TypeScript, because there is no compiler or `node_modules` in the workspace and running Node needed an approval nobody was there to give. I re-read every edited section by eye instead, but the next calibration run is the first real test of it.

**Now bound:**
- **`opportunity-cwu-view.start_proposal` (R-2.2):** signed in as the first vendor on the seeded published Code With Us opportunity, the page now has a "Start a proposal" link. It leads to the proposal form, which the adapter already handles. The adapter now finds that link by its text. The earlier R-2.2 failure page offered "View your proposal" instead, because that vendor already had a proposal there. The old target's binding follows the matching "View Proposal" link in that case, so the new binding falls back to "View your proposal" the same way. If the control is disabled, it says so at once rather than clicking.
- **`file-attachment-control.attachment_address` on a proposal (R-8.31):** the failure happened on a vendor's Code With Us proposal screen. The reader only knew how to find attachments on an opportunity's form, so it found none. I made a draft proposal on the seeded published opportunity and gave it one small test file. Its screen now shows an "Attachments" part with a "Download <name>" link to `/api/files/<id>?type=blob`. On a proposal screen that opened, the reader now returns those links, or nothing if there are none. If the screen did not open, it reports unbound. That draft proposal and its file are still on the target.

**Still unbound, rechecked this run:**
- **`file-attachment-control.add_attachment` (R-8.20):** the administrator's Sprint With Us and Team With Us forms at `?tab=opportunity` have no Attachments part at all. Both programs' create forms state: "Files cannot be attached to a Sprint/Team With Us opportunity in this version of the service. Code With Us opportunities take attachments." The unbound reason now quotes that.
- **`opportunity-cwu-edit.proposals_tab` and `opportunity-swu-edit.proposals_tab` (R-1.31, R-2.25):** checked as the administrator on the seeded Code With Us opportunity with three proposals and on the seeded open Sprint With Us one.
  - The Code With Us screen offers only Summary, Opportunity, Addenda and History.
  - The Sprint With Us screen adds only Evaluation panel.
  - On both, `?tab=proposals` shows the Summary.
  - A proposal's own view (`.../proposals/:proposalId`) answers "Page not found" to the administrator.
- **`proposal-swu-create.open` and `proposal-twu-create.open` (R-2.7, R-2.9, R-2.11, R-2.24):** I signed in as the first vendor and as the organization owner. Even on the seeded Sprint With Us opportunity still open until November 2, 2026, the opportunity page offers only "Watch" and no way to start a proposal. The create form answers "Page not found", as do the Team With Us form and the seeded Sprint With Us proposal's edit screen.
- **`proposal-cwu-view.open` (R-2.24):** still "Page not found", to the administrator and to the organization owner who wrote the seeded proposal. That owner can open their own proposal's `/edit` screen.

I added these findings to the reason text the adapter reports at run time.

**Every route in `surface.yaml` resolves on the target.** The missing pages above show the app's own "Page not found" screen rather than failing to load.

**Out of scope, but stale:** `/dashboard` is no longer the bare "You are signed in as…" page.
- The administrator sees an "All opportunities" table with a "Create an opportunity" link.
- A vendor sees "My proposals" and "My organizations' proposals".

Several unbound reasons in `bindings.yaml` still describe the old page, notably `proposal-vendor-dashboard.show_org_proposals` and the `evaluation-panel-dashboard` members. I did not rebind them because this run was limited to the criteria listed. They should be revisited.
