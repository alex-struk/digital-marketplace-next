| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T01:42:59.361Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind every surface action and observation on `new`, and nothing else? Approve. The diff changes only tests/adapters/new/index.ts and bindings.yaml (plus .sdlc records), nothing under tests/acceptance, and the runner's typecheck passed with no diagnostics under adapters/new. Both new bindings are navigation and locators only. start_proposal (R-2.2) clicks 'Start a proposal' and falls back to 'View your proposal' only when that is the only control offered, the same as the old target's binding at tests/adapters/old/index.ts:3497. Because 'Start' is tried first, the fallback cannot hide an app that offers a second-proposal route, and the disabled-control throw is a navigation failure, not an assertion. attachment_address (R-8.31) reads a proposal screen's 'Download <name>' links, or nothing when there are none, and reports unbound when the screen did not open. The remaining unbound reasons name real gaps on the target: no proposals section on the Code With Us or Sprint With Us management screens, with ?tab=proposals falling back to the Summary (R-1.31, R-2.25); 'Page not found' for the Sprint With Us and Team With Us proposal forms and the proposal view (R-2.7, R-2.9, R-2.11, R-2.24); and the app's own statement that Sprint and Team With Us opportunities take no attachments (R-8.20). Those are gaps in what was built, not binding faults. Separately, the R-2.2 test leaves the refusal-message clause unasserted, with no clause entry, because the surface has no create-request action; that is recorded below as owed by contract. This would change to a return on evidence that the 'View your proposal' fallback fires while the page also offers a real way to start a second proposal.

**Conditions:**
- missing-test R-2.2: a request to create a second proposal is refused with "You already have a proposal for this opportunity." and no second proposal is created — owed by contract: proposal-cwu-create names no action that sends a create request for an opportunity the vendor already holds a proposal on, so no test can put that request to the service and read the refusal

### Runner-owned typecheck evidence

Proposal revision: `0697a9a34b38f0a4650c338eaa8975138869617d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
