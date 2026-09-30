---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-30T02:57:07.144Z"
cost: 1.033253
turns: 24
session: "2df3d698-abfc-45a0-8813-011c22882b75"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I wrote a test for the one criterion, R-2.18 v4. Nothing went into `not-testable.yaml`, because the surface reaches every clause. The tests have not been run, and they have not been type-checked either: the workspace has no `node_modules`, so there is no TypeScript compiler here.

**Starting point.** `tests/acceptance/proposals/R-2.18.spec.ts` already existed, written for v3. v3 said the form offers only active members, so neither refusal could be reached through the form. v4 changes that for Sprint With Us: its form also lists people whose invitation is still pending, marks them pending, and lets a proposal naming one be saved as a draft but not submitted. I kept the v3 tests that still hold, changed the header to v4 at spec@58f7a2a6 derived 2026-09-30, and replaced the statement every test title quotes with the v4 wording.

**Unchanged from v3:**
- Through the proposal request page, a Team With Us team of active members is accepted.
- A Team With Us team is refused with "User is not an active member of the organization." when it names a pending person, a former member or someone outside the organization.
- A Team With Us team naming the same person twice is refused with "Please select unique team members."
- A Sprint With Us phase naming the same person twice gets no uniqueness refusal.
- The Team With Us form offers only active members. It never offers the pending person, and it stops offering someone once they are on the team.

**New or rewritten for v4:**
- **Sprint With Us refusal by the service:** this now runs for the pending person as well as for someone outside the organization, both expecting the not-an-active-member message.
- **Sprint With Us form:** the choice must list the pending person beside the three active members, and must not list the former member or the outsider. Once the pending person is added, `proposalSwuCreate.pendingTeamMember()` must show their name, and the choice must stop offering both them and anyone else already named.
- **Draft, then submission:** a Sprint With Us proposal naming the organization's owner as scrum master plus the pending person, otherwise complete, is saved with `saveDraft()`. It must get an identifier and read as a draft. Then `proposalSwuEdit.submitProposal()` is tried, the proposal's page is reopened, and its status must still read draft, not submitted.

**Limits:**
- **Refusal on submission from the edit page:** the contract says the create page withholds submit while a pending person is named, and says nothing about the edit page. So the test treats "refused on submission" as "the proposal stays a draft". It does not require `submissionRefusal()` to show anything, because the button may simply not be offered.
- **The service's own message for this case:** the service's refusal message is checked separately, through the request page, which only ever sends a proposal as a submission.

**What the contract could add:** `proposalSwuEdit` has no observation of the team a saved proposal names. The draft test therefore shows the save went through, but cannot show the pending person is still on the draft afterwards. A team-members observation on `proposal-swu-edit` would close that gap.

I changed no path outside `tests/acceptance`.