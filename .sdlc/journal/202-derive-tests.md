---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T22:01:53.030Z"
cost: 0.708952
turns: 22
session: "f4eca697-bf8e-4d8a-935e-335bfd17da22"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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