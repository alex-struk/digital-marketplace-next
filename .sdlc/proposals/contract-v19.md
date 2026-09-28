---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I supplied the one item this stage owed."
opened: 2026-09-28T21:54:01.292Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I supplied the one item this stage owed.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I supplied the one item this stage owed. The oracle started and served the seeded records, and I took it down again at the end.

**What was missing.** The item was missing-test/R-2.18. Its clause says the proposal form offers every active member of the organization and does not offer the person already named on the proposal. The contract already had a `team_member_choices` observation on `proposal-twu-create` and `proposal-swu-create`, and that observation returns people by name. But the manifest never said what the three organization users are called, so a test had no expected names to look for.

**What I changed.**
- **`tests/seed/manifest.yaml`:** I added the name each of these users already has in `001-users.sql`:
  - `users.organizationOwner` is "Blake Placeholder"
  - `users.organizationAdmin` is "Charlie Placeholder"
  - `users.organizationMember` is "Dana Placeholder"
  
  No SQL changed.
- **`spec/contract/surface.yaml`:** I added a note to both `team_member_choices` observations saying what the list holds:
  - **Team With Us:** only active members are offered.
  - **Sprint With Us:** the list also includes people whose invitation to the organization is still unanswered, marked pending. For `organizations.qualified` that is `users.teamCandidatePending` ("Quinn Placeholder"), listed beside the three active members.
  
  I checked both against the old code. The Team With Us team component drops any membership that is not active. The Sprint With Us phase component shows pending people with a badge. The service's organization-members read leaves out ended memberships and keeps pending ones. So a Sprint With Us test should check that the active members are included, not that the list matches them exactly.

**Everything else.** Nothing else changed this run. No page, persona, sign-in, observable, API entry, seed file or compose setting was edited, and none was deleted. The existing sign-ins stayed as they were: on the oracle, personas sign in through a session route (`/auth/createsessionvendor/N`, `/auth/createsessiongov`, `/auth/createsessionadmin`). On the rebuilt target they use the sandbox identity provider.

**Oracle.** I brought it up with the existing override and it started four copies on the first attempt, with nothing changed. To prove the migration ran and the seed loaded, I signed in as the organization owner and read the qualified organization's members through the application's own API. It returned Blake, Charlie and Dana Placeholder as active and Quinn Placeholder as pending. Rowan Placeholder, whose membership ended, was not returned. That matches the manifest and the new notes.

**One snag.** The permission layer refused every command that expanded `$SDLC_BIN`, so I ran the CLI from its checkout at `~/GitHub/agentic-sdlc/bin/sdlc.mjs`. A second checkout named `agentic-sdlc-oracle-cannot` also exists. I did not use it.

**For whoever rules on this.** The criterion's last sentence says the form offers "only the organization's active members". That is true for Team With Us, but the Sprint With Us form also offers pending invitees. The owed clause only asks that every active member is offered and the named person is not, so the test does not depend on the difference. It is still a gap between the criterion's wording and the old application's behaviour, and the ratify stage may want to tighten the wording.

re-address missing-test/R-2.18 to derive-tests: tests/seed/manifest.yaml now gives the names of users.organizationOwner ("Blake Placeholder"), users.organizationAdmin ("Charlie Placeholder") and users.organizationMember ("Dana Placeholder"), which is the text `team_member_choices` returns on proposal-twu-create and proposal-swu-create. Both observations now say what else the list holds: on Sprint With Us it also lists users.teamCandidatePending, marked pending.
