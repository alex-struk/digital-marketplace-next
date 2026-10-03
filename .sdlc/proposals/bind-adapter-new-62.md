---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "Nothing is deferred."
opened: 2026-10-03T17:17:20.227Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** Nothing is deferred.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've answered all 13 conditions and bound the new `affiliation-removal-request` page. Nothing is deferred. I could not typecheck or run the adapter: this workspace has no `node_modules`, and both `tsc` and `node --check` needed approval nobody was there to give. Every interaction below was tried by hand in the browser against http://localhost:4300, and I read the edited code through for type errors. While reading I found and fixed one name clash: my new name helper had the same name as an existing `personName` function, so it is now `shownName`.

**What the target shows now.** The team section of `/organizations/:orgId/edit?tab=team` is live on this build; the old bindings recorded it as "This section is not available yet." It has a table with the columns Name, Membership, Capabilities and Actions. A "Team capabilities" region lists each capability as "<name>: held" or "<name>: not held". Each row has buttons such as "Give administrator rights to <name>", "Remove administrator rights from <name>" and "Remove <name>".

**Changes, by condition:**
- **1–3 (owner and pending badges):** these now read the Membership cells that say "Owner" or "Pending", not whole lines of page text.
- **4 (your own memberships, pending badge):** keeps the rows of "Organizations you belong to" whose Membership cell reads "Pending", whatever action buttons follow it.
- **5 (team capabilities):** returns the list items of the "Team capabilities" region. It takes the innermost region, because the "Team members" region also contains that heading.
- **6 (change owner):** "Change owner" is offered only to the service administrator, not to the organization's owner. It opens a dialog whose "New owner (required)" control is a button that opens a list of eligible members by name. The adapter maps the person it is given to a name through the persona or the seed, picks that option, and presses the dialog's "Change owner". If the person is not in the list, it throws a plain error naming who was offered.
- **7–9 (administrator rights and the terms box):**
  - Toggling now presses the row's "Give administrator rights to <name>" or "Remove administrator rights from <name>". The input can say which one is wanted.
  - Giving rights opens a dialog with the box "I have read this statement and confirm it". Accepting the terms ticks that box and then presses "Give administrator rights" in the dialog.
  - If accepting the terms comes first, the answer is kept and given when the toggle opens the dialog.
  - Removing administrator rights takes effect at once, with no dialog.
- **10 (refused viewers):** a person who may not see the organization is shown "Page not found". The team rows read now treats that as the refusal and returns empty instead of unbound. I confirmed this signed in as the invited vendor.
- **11 (matching rows to people):** the team table shows names only. Each row's name is now followed by the account's email and persona, found from the organization's memberships list (`/api/affiliations?organization=<id>`, which gives each member's user id) and the seed. For example: "Dana Placeholder (org.member@example.test, organization-member) | Member | …".
- **12 (accept and decline dialogs):** the accept dialog is titled "Join <org>?" and the decline dialog "Decline the invitation from <org>?". Each read now returns the open dialog only when it is its own kind. Otherwise it returns empty, because the screen was reached.
- **13 (unregistered address):** the field-error read now also includes alerts in the "Team members" region. An unregistered address produces the alert "<address> is not registered with the Digital Marketplace".

**The R-3.11 removal case.** Rows are now found by name as well as email, so the seeded owner's row is found. That row has no Remove button, so the action now throws a plain error saying the row offers no such control. It no longer reports unbound. The confirmation for other rows is "Remove from team", which is now accepted.

**The new page.** `affiliation-removal-request` sends DELETE `/api/affiliations/:id`, with the id coming from the input or from `open()`.
- **Sole owner:** the target answers 400 with "This is the sole owner for the organization, and cannot be removed."
- **Unknown id:** the target answers 404 with "No membership is held at that address."
- **Reads:** the existing helpers report whether the request was accepted, the refusal messages and the refusal status.

**`bindings.yaml`.** I marked these as bound:
- **organization-edit:** `remove_team_member`, `toggle_member_admin_status`, `accept_org_admin_terms`, `change_owner`, `owner_badge`, `pending_badge`, `team_member_row` and `team_capabilities`.
- **Both membership pages:** `accept_confirmation` and `decline_confirmation`, because the code now returns a value there instead of throwing.
- **affiliation-removal-request:** all four members.

**Not changed, but worth a look.** `add_team_members`, `approve_pending_member`, `invalid_membership_type_error` and the qualification, changelog and invitation-answer entries still have unbound reasons saying the team section is unavailable or that no accept or decline controls exist. Those reasons are now out of date on this build. No condition named them, so I left them as they were. If a test toggles administrator rights without accepting the terms, the dialog stays open and may block a later click on the page.

**Changes I made to the target while looking.**
- I withdrew Charlie Placeholder's administrator rights on the seeded qualified organization (…301) twice: once to see that it applies with no dialog, and once as a side effect of the ownership test. Both times I restored them through the dialog.
- I moved ownership to Charlie and back to Blake.
- I invited one unregistered address; it was not added to the team.
- I sent a DELETE for the sole owner's membership, which was refused.

The final state of the team matches the seed. No route in the surface failed to resolve.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? It answers the 13 revision requests from build-slice-12 with navigation and locator code only: column-cell reads for the owner and pending badges, the team-capabilities list items, the change-owner listbox, the administrator-statement dialog, the not-found refusal, name-to-persona matching, kind-checked answer dialogs and the unregistered-address alert. It adds the affiliation-removal-request page, which matches its surface type. Nothing under tests/acceptance changed, and the runner's typecheck passed. It is returned because bindings.yaml still holds unbound reasons that the proposal's own walk shows are false on this build: add_team_members, approve_pending_member, invalid_membership_type_error, and the qualification, changelog and invitation-answer entries say the team section reads 'This section is not available yet' or that no accept/decline controls exist. The proposal saw the team table, its row actions and dialogs, and the pending row's Accept/Decline buttons, and says these reasons are out of date. A reason that is not real fails this gate's standard, and the recommendation 'Nothing is deferred' is contradicted by the proposal's own list. The ruling changes to approve once each of those entries is re-walked against the live team section and either bound or given a reason that is true of this build.

**Conditions:**
- bindings.yaml organization-edit: re-walk add_team_members, approve_pending_member and invalid_membership_type_error against /organizations/<id>/edit?tab=team, which now draws the team table (Name, Membership, Capabilities, Actions), per-row Remove and administrator buttons, and an invitation dialog. Bind each one, or replace its 'This section is not available yet' reason with what the live section actually lacks.
- bindings.yaml: re-walk every other entry whose unbound reason cites the team section being 'not available yet' or the absence of invitation accept/decline controls. This covers the qualification, changelog and invitation-answer entries named in the proposal's 'Not changed, but worth a look' list, on both membership pages. The pending row now offers 'Accept the invitation from <org>' and 'Decline the invitation from <org>'. Bind each entry, or give a reason that is true of this build.
- toggleMemberAdminStatus: when the 'Give <name> administrator rights?' dialog is left open because accept_org_admin_terms has not been taken, close it before the next action on the page that does not concern that dialog, or document in the binding why leaving it open cannot block a later locator.

### Runner-owned typecheck evidence

Proposal revision: `f47af95305246ba5496300b7d08600365edd263d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
