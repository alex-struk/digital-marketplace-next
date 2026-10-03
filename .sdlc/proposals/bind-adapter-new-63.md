---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I couldn't run the typecheck: no dependencies are installed in the workspace, I wasn't permitted to install a toolchain in the scratchpad, and I wasn't permitted to run a Node parse check either."
opened: 2026-10-03T17:28:42.605Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't run the typecheck: no dependencies are installed in the workspace, I wasn't permitted to install a toolchain in the scratchpad, and I wasn't permitted to run a Node parse check either.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've updated the adapter at `tests/adapters/new/` to meet all three conditions in the ruling. I couldn't run the typecheck: no dependencies are installed in the workspace, I wasn't permitted to install a toolchain in the scratchpad, and I wasn't permitted to run a Node parse check either. The changes were reviewed by eye only, so the runner's typecheck still needs to pass.

**What the live target shows now.** I walked http://localhost:4300 signed in through the identity provider as the organization owner, the service administrator, the invited vendor and an organization member.
- **Team members:** the section is fully drawn: the team table, its row actions, "Add team members" and "Team capabilities".
- **Changelog:** now drawn too. With no changes it shows one sentence; once a change is made it shows a table of Date, Change, Member and Made by.
- **Qualifications:** both qualification sections still say only "This section is not available yet." on both seeded organizations.
- **Terms pages:** the owner still gets "Page not found" at the Sprint With Us terms address.
- **Memberships:** on the Organizations section a pending row offers "Accept the invitation from <org>" and "Decline the invitation from <org>", and a member's row offers "Leave <org>". Each opens a confirmation dialog.
- **Invitation email:** it links to `?tab=organizations&invitation=<id>&answer=accept` (or `decline`), which opens that section with the matching dialog already open.

**Newly bound.**
- **`add_team_members`:** the dialog fills its "Email address" boxes and presses "Send invitations". A membership type of "member" is accepted, because that is the only kind the dialog invites. Any other kind throws unbound, naming the key.
- **`approve_pending_member`:** only the service administrator sees "Approve <name>" on a pending row, and it takes effect at once with no confirmation. The owner sees only "Remove", which is reported as the row's answer, not as unbound.
- **`changelog_entry`:** the existing table reader works now that the section is drawn.
- **`approve_invitation`, `reject_invitation`, `leave_organization`** (on both membership pages): each presses the row's button by its name and confirms with "Join organization", "Decline invitation" or "Leave organization". If the matching dialog is already open, because the person arrived from the email, it confirms there. A dialog of the other kind is cancelled first.

**Still unbound, with corrected reasons.**
- **`invalid_membership_type_error`:** the new reason is what the walk found. The dialog has only email boxes, "Add another email address", "Cancel" and "Send invitations", and says each person "joins the team as a member". There is no membership type to choose, so no refusal of another kind can appear on the screen.
- **Qualification and terms entries:** every remaining "not available yet" reason is about a qualification section or the two terms pages. I re-walked them on this build and they are still true. The bindings comments and the adapter's shared description of the build no longer say the team or changelog sections are unavailable.

**The administrator-rights dialog.** When `toggle_member_admin_status` leaves "Give <name> administrator rights?" open because `accept_org_admin_terms` wasn't taken, the adapter now records that. Every other member of the page except `open` and the two that answer the dialog presses its "Cancel" first. Cancelling gives nobody the rights, the same as leaving it unanswered.

**The four removal-request members.** `end_membership_by_request`, `request_accepted`, `refusal_messages` and `refusal_status` were already bound in both files when I opened them, matching the contract's spelling and the generated type. I left them as they were.

**Earlier calibration failures.** The quoted messages for R-3.11, R-3.12, R-3.15, R-3.33 and R-3.14 came from other builds, on ports 4400 and 4500. Their wording ("no terms box", sections "not available yet") isn't produced by the current code, and the name matching and dialog opening they needed are already in place. I didn't re-run them.

**I changed the target's data while walking it.** It should be reseeded before calibration:
- **Changelog on ...301:** I gave and then withdrew administrator rights for Dana Placeholder to see the changelog, so it now has two entries. Dana is a Member again.
- **The seeded pending invitation on ...304:** as the administrator, pressing "Approve" made Indigo Placeholder a member at once. I removed them and re-invited the same address, so they are Pending again but under a new membership identifier. Anything that uses the seed's identifier for that invitation won't find it until the data is reseeded.
- **Unregistered-address invitation:** I also sent one invitation to `nobody.binding.check@example.test` to confirm the alert for an address nobody has registered.

No page's route failed to load at all on this target. I didn't touch anything outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new adapter bind every surface action and observation on the new target, and nothing else? Approve. The diff touches only tests/adapters/new/, nothing under tests/acceptance changed, no protected path is involved, and the runner's typecheck passed with no diagnostics under adapters/new/. The newly bound team, changelog and membership-answer members use locators and navigation only: buttons found by name, dialogs confirmed, the New owner listbox, table columns read. None of them decides a pass. The bound affiliation-removal-request page exists in spec/contract/surface.yaml, added by contract-v39. The remaining unbound reasons name what the surface actually lacks: an invitation dialog with no membership type, and qualification sections and terms pages that are still unavailable. Calibration should watch two things. teamRowsNamed adds each row's address and persona, looked up from the seed and the affiliations API, after the on-screen name. And orgInRow and toggleMemberAdminStatus throw a plain error where a row offers no control, which a test expecting a refusal will see as an error rather than a refusal. The walk changed the target's data (organization ...301's changelog and the pending invitation on ...304), so it needs reseeding before calibration. The ruling would change if a binding were found to assert, or the diff reached outside tests/adapters. The build-slice-12 conditions belong to build and stay open.

**Conditions:**
- condition-met bind-adapter-new-62#1: add_team_members and approve_pending_member are now bound against ?tab=team in tests/adapters/new/bindings.yaml (organization-edit) and index.ts (addTeamMembers, approvePendingMember via orgInRow). invalid_membership_type_error keeps an unbound reason that is true of this build: the Add team members dialog offers only email boxes and no membership type.
- condition-met bind-adapter-new-62#2: every reason in bindings.yaml that said the team section or changelog was not available yet, or that invitation controls were missing, was re-walked. Team rows, badges, capabilities and changelog_entry are bound. approve_invitation, reject_invitation, leave_organization, accept_confirmation and decline_confirmation are bound on both organization-user-memberships and organization-user-memberships-self. The qualification and terms entries were re-walked and are still unavailable, and their reasons say so.
- condition-met bind-adapter-new-62#3: index.ts records orgAdminTermsLeftOpen when toggleMemberAdminStatus leaves the administrator-rights dialog open. Every other organizationEdit member except open, toggleMemberAdminStatus and acceptOrgAdminTerms is wrapped to call dismissAdminTerms, which presses Cancel first.

### Runner-owned typecheck evidence

Proposal revision: `82b8ed424646d570f47d95be6313514ca444565e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
