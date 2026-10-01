---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I re-walked the four areas the ruling named (the Code With Us create form, the Code With Us manage screen, the attachment control and the signed-in dashboard) on the target as it runs now."
opened: 2026-10-01T08:51:48.105Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I re-walked the four areas the ruling named (the Code With Us create form, the Code With Us manage screen, the attachment control and the signed-in dashboard) on the target as it runs now.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I re-walked the four areas the ruling named (the Code With Us create form, the Code With Us manage screen, the attachment control and the signed-in dashboard) on the target as it runs now. Only the dashboard had changed. Two dashboard actions are now bound; the Sprint With Us and Team With Us create forms still answer "Page not found" and stay unbound. I could not run the adapter itself, because the workspace has no `node_modules`. I checked each step it relies on by hand in the browser, and my edits change only comments, reason strings and bindings entries.

**What I walked.** I signed in through the sandbox identity provider as the administrator, as a public sector employee, and as a staff account with no opportunities.

**What changed: the dashboard.** It now shows a "Create an opportunity" link to `/opportunities/create`.
- To the administrator it also shows "All opportunities": a table with Title, Program, Status, Last updated and Created by, where each title links to that opportunity's manage screen.
- A staff member with no opportunities sees "My opportunities" and "You have not created any opportunities yet."

The adapter's existing dashboard code already matches this, so `create_opportunity` and `open_opportunity` are now bound. The five dashboard readers were already bound and needed nothing.

**What did not change.** These already matched the adapter, so I left them as they were:
- **Code With Us create form:** as a staff member it offers "Save draft" and "Submit for review"; as the administrator, "Save draft" and "Publish". Saving a draft lands on the new opportunity's manage screen.
- **Code With Us manage screen:**
  - On a draft, the administrator is offered Edit, Publish and Delete; a staff member, Edit, Submit for review and Delete.
  - Publish asks "Publish this opportunity?" with a "Publish opportunity" button. An incomplete draft stays on the screen with "This opportunity is incomplete".
  - The sections are Summary, Opportunity, Addenda (only once published) and History. The Opportunity form carries the four dates.
- **Attachment control:** "Add attachment" opens a file chooser. A new file appears as "New: …" with a "Name for …" box and "Will be saved as: …". After "Save changes", the stored file shows a read-only "Attachment name", a "Download <name>" link to `/api/files/<id>?type=blob`, and "Remove <name>".

The members recorded as unbound on these screens stay unbound, because on this build the controls still are not there:
- cancel, add addendum and add note;
- the proposals section (`?tab=proposals` still shows the summary);
- the views, watchers and proposals counts.

The reasons the ruling quoted ("Code With Us create … Page not found", the administrator offered "Submit for review") are not in the current bindings or adapter; only the "a greeting and nothing else" wording was. I don't know when the other two were removed.

**Sprint With Us and Team With Us create (R-1.48, R-1.9).** I walked to these again as the administrator: dashboard, then "Create an opportunity", then "Create a Sprint With Us opportunity" or "Create a Team With Us opportunity". Both links land on "Page not found" at `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create`. A public sector employee gets the same, and the administrator's table lists only Code With Us opportunities. These routes from `surface.yaml` do not resolve on this target, so both pages stay unbound. I added this walk to their reasons.

**Edits made:**
- In `tests/adapters/new/index.ts`, I corrected the shared reason text and the header comment that described the dashboard as "a greeting and nothing else", added a comment on the dashboard section, and added the new walk to the Sprint With Us and Team With Us reasons.
- In `tests/adapters/new/bindings.yaml`, I marked the two dashboard actions bound and corrected the header and dashboard comments.

**Left alone.** The unbound reasons for `notification-email-reference` still say "the administrator's dashboard (a greeting only)". That wording is now out of date, but those members are outside what the ruling named, so I left them unchanged.

**Test data.** While binding I created one draft Code With Us opportunity, "Rebind check 7-4", and attached `renamed.pdf` to it. Both are still on the target.

Nothing under `spec/`, `tests/seed`, `tests/generated` or the harness files was touched. No request is deferred.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-new-27 bind every surface action and observation on the new target, and nothing else? Approved. The diff edits only tests/adapters/new; nothing under tests/acceptance changed, and the runner's typecheck on the proposal revision passed with no diagnostics under adapters/new. The two newly bound dashboard actions are locator and navigation code only (index.ts: createOpportunity presses a link named 'Create an opportunity'; openOpportunity clicks the link whose href carries the seeded id or whose text equals the title, and throws unbound otherwise). Neither asserts anything. They match the walked dashboard: a 'Create an opportunity' link to /opportunities/create, plus an opportunities table whose titles link to each opportunity's management screen. The Sprint With Us and Team With Us create pages, which R-1.48 ('in all three programs') and R-1.9 reach through their tests, stay unbound. Their reasons are real and name what is missing from the surface: the chooser at /opportunities/create links to /opportunities/sprint-with-us/create and /opportunities/team-with-us/create, and both answer 'Page not found' to the administrator and to a public sector employee. That is the application not serving a screen, not the adapter overreaching. The open plan revision request from build-slice-7-4 already covers moving R-1.9 out of slice 7. The failed egress check flags only files this diff does not touch. Two comments still describe the earlier build: index.ts around line 3416 says the Code With Us form answers 'Page not found', and the notification-email-reference reasons say the dashboard is 'a greeting only'. Neither changes binding behaviour; the email-reference wording is outside the scope of the build-slice-7-4 request, and the line-3416 comment should be corrected on the next binding run. The owed build-slice-7-3#1, build-slice-7-3#2 and build-slice-7-4#3 are not settled here: they ask build for application behaviour and for a recheck after a verify run on the rebound adapter. The walk is not that verify result, so they stay open for the next build ruling. The ruling would change to a return if a verify run showed the new dashboard bindings failing to reach the table or the links, or if either sprint-with-us/team-with-us create route turned out to resolve on this target.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `1d4194409d18c7d737d4858668aaa57817772b44`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
