---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I finished the test for R-2.18 in `tests/acceptance/proposals/R-2.18.spec.ts`, so this domain now has a test for the one criterion owed."
opened: 2026-09-28T22:01:53.101Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I finished the test for R-2.18 in `tests/acceptance/proposals/R-2.18.spec.ts`, so this domain now has a test for the one criterion owed.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I finished the test for R-2.18 in `tests/acceptance/proposals/R-2.18.spec.ts`, so this domain now has a test for the one criterion owed. `tests/acceptance/not-testable.yaml` has no R-2.18 entry, so there was nothing to remove. None of the tests has been run: the workspace has no app to run against and no installed dependencies, so the type-checker couldn't run either. I checked by hand that every page, action and observation the file calls is declared in `tests/generated/surface.d.ts`.

A test file for R-2.18 was already here from the last approved derivation. Its tests of refusals by the service go through the "team proposal, by request" page (`proposal-team-request`) and still match the contract, so I kept them. They check that:
- A Team With Us team made only of active members is accepted.
- A Team With Us team naming the pending person, the former member or the outside person is refused with "User is not an active member of the organization."
- A Sprint With Us phase naming the outside person gets the same refusal.
- A Team With Us team naming one person twice is refused with "Please select unique team members."
- A Sprint With Us phase naming one person twice gets no such uniqueness refusal.

I rewrote the two tests of what the proposal form offers, because the contract stage's changes made the old version too weak on one form and wrong on the other:
- **Before:** without the active members' names in the seed, the old tests could only check that the three people outside the organization were missing and that the list changed after naming someone.
- **Weak on Team With Us:** those checks passed without showing that the active members are offered.
- **Wrong on Sprint With Us:** the contract now says the pending person is listed, marked pending, so the old check that they were absent would have failed against a correct system.

The rewritten form tests now check, by the account names in the seed:
- **Offered:** Blake, Charlie and Dana Placeholder, the organization's three active members.
- **Never offered:** the person whose membership ended and the person in no organization.
- **After naming someone:** that person is no longer offered, and the other active members still are.
- **Team With Us:** the pending person is never offered.
- **Sprint With Us:** the pending person is listed, and the `pending_team_member` observation is not empty. This follows the criterion's note that a pending member is shown as pending, not hidden.

One judgement call: the contract doesn't say what text `pending_team_member` returns, so the test only checks that the pending marking is there, not that it contains the person's name.

No criterion was recorded as not testable, and I found no surface action or observation missing. A wish for the contract stage: have `pending_team_member` say which person it marks, so the test can tie the marking to the pending person rather than just checking it is there. I changed nothing outside `tests/acceptance/proposals/R-2.18.spec.ts`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-2.18 tests assert what the criterion says, and nothing else? Ruling: return. The service-refusal tests follow the criterion. The Team With Us form test also follows it: by seed account name it checks that the three active members (Blake, Charlie and Dana Placeholder) are offered, that the former member, the outside person and the pending person are not, and that the person already named stops being offered. That matches 'the proposal form offers only the organization's active members, and does not offer a person already named.' The runner's typecheck failed, but with no diagnostics under acceptance/proposals; its two diagnostics are in adapters/new, which this proposal does not answer for. The Sprint With Us form test (R-2.18.spec.ts lines 329-337) asserts two things the criterion does not say: that the team-member choice contains the pending invitee (Quinn Placeholder), and that the pendingTeamMember observation is non-empty before anyone is named. The criterion's statement says the opposite, that the form offers only active members, and the test's own title repeats that while its body asserts a non-member is offered. The criterion's note, that a pending team member is shown as pending on the proposal rather than hidden, is about a person already on the team, not about who the choice lists. These assertions come from the contract's comment on the Sprint With Us team_member_choices observation, which describes the old application's behaviour, and the contract stage itself flagged that difference from the criterion's wording for ratify. A test should not settle that difference by asserting the application's side of it. Removing the two assertions, and asserting nothing about the pending person on the Sprint With Us choice in either direction, would change this ruling to approve. The Sprint With Us 'only active members' clause is recorded as owed by ratify, so it stays open until ratify settles the wording.

**Conditions:**
- In tests/acceptance/proposals/R-2.18.spec.ts, in the Sprint With Us form test, remove the assertion that the team-member choice contains seed.users.teamCandidatePending.name and the assertion that surface.proposalSwuCreate.pendingTeamMember() is non-empty. R-2.18 states the form offers only the organization's active members; its note is about a pending person already named on the proposal being shown as pending, not about the choice listing them. Assert nothing about the pending person on the Sprint With Us choice in either direction, and keep every other assertion in the file as it is.
- missing-test R-2.18: the Sprint With Us proposal form offers only the organization's active members, so a person whose invitation to the organization is unanswered is not offered — owed by ratify: a ruling on the criterion's wording, because the approved contract says the Sprint With Us team-member choice lists pending invitees marked pending, which contradicts the criterion's statement that the form offers only active members, and no test can assert this clause until one of the two changes

### Runner-owned typecheck evidence

Proposal revision: `991cd097d6a22130866a99fd6965cb290c8c006e`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
