---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T21:49:46.287Z"
cost: 1.5091852000000003
turns: 30
session: "796fb4c4-7c9c-49c0-8ca8-9bb63b6e6de8"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I wrote tests for both criteria that were handed back, R-2.14 and R-2.18, and removed both of their entries from `tests/acceptance/not-testable.yaml`. Neither has a partial-clause entry any more; each now has only a test. I could not type-check or run them: the workspace has no installed dependencies and no app. So they are checked against the generated types by reading only, and none of them has passed yet.

**R-2.14, `tests/acceptance/proposals/R-2.14.spec.ts`.** I rewrote the whole file around the new `proposalCwuRequest` page. That page sends the proponent to the service exactly as given, so there is no longer any need to read a form that holds back its submit button as a refusal. The file has 13 tests, and each makes a single attempt against the seeded open Code With Us opportunity. This keeps the two closed redo items on this criterion satisfied: there is one attempt per test, and an accepted request never collides with an earlier one.
- **Blank fields:** leaving out the legal name, email, street address, city, province, postal code or country is refused. The test checks that `refusalByField` names that field.
- **Malformed fields:** a malformed email or phone number is refused against that field.
- **Complete individual:** an individual with every field filled in is accepted.
- **Organization tests:**
  - An identifier that names no organization (`seed.unassigned_identifiers.organizationNeverCreated`) is refused. I assert only the refusal, not which field it is reported against, because the contract warns that the old service reports it against the individual's fields.
  - An archived organization, submitted by its own owner, is refused.
  - `persona.vendor` naming `seed.organizations.qualified`, an active organization the vendor does not belong to, is accepted. This covers the "membership is not verified" clause.

Two guesses in R-2.14 could be wrong:
- The field-name matching allows several spellings (for example `/legal\s*name/i`), because the contract describes the field labels only in prose.
- The input keys (`street1`, `region`, `mailCode`, `organizationId`, `proposalText`, `additionalComments`) are my guesses. The contract gives these inputs only in prose, and the generated types say `unknown`.

**R-2.18, `tests/acceptance/proposals/R-2.18.spec.ts`.** I rewrote this file too. Each test publishes its own opportunity, because both programs' seeded opportunities have closed. The Team With Us opportunity asks for two resources (Full Stack Developer and Agile Coach), so the same person can be named twice by naming them for both. The file has 9 tests, all run as the organization admin submitting for `organizations.qualified`:
- **Control:** a Team With Us team made only of active members is accepted.
- **Non-members, Team With Us:** a team naming the pending invitee, the former member or the person in no organization is refused with "User is not an active member of the organization." That is one test per person.
- **Non-member, Sprint With Us:** a phase naming the person in no organization is refused with the same message.
- **Named twice, Team With Us:** refused with "Please select unique team members."
- **Named twice, Sprint With Us:** the reply does not contain the uniqueness message. The contract notes this request may instead fail when the service tries to store it, so I assert only that no uniqueness refusal is given.
- **Form choices, both programs:** `teamMemberChoices` offers somebody, never offers any of the three outsiders by name, and changes once a person has been named.

I dropped the old draft-then-remove-member path through `proposal-twu-edit`. The request page reaches the same refusal directly and can also read its wording.

The input shapes for `proposalTeamRequest.submitTeamProposal` (`team`, `phases`, `answers`, `references`, `hourlyRate`, `proposedCost`, `scrumMaster`) are my reading of the contract's prose. The adapter may use different names.

**What is still missing from the contract, for whoever works on it next** (neither blocks a test today):
- **Active members' names.** The seed does not carry the names of the organization's active members. So the form-choice tests cannot check that each active member *is* offered, or that the specific person just named disappears from the choices. They can only check that the choice list changes. Adding `name` to `seed.users.organizationOwner`, `organizationAdmin` and `organizationMember` would let them.
- **Input shapes.** Neither request page has typed input fields. Declaring the field names in `spec/contract/surface.yaml` would remove the guesses listed above.

I did not change anything outside `tests/acceptance`.

## Fix turn

I fixed the one failing check and changed nothing else.

The check flagged line 25 of `tests/acceptance/proposals/R-2.14.spec.ts` for touching the page object. Nothing there actually reaches the page object: the check matched the text `page.` at the end of the sample proposal text `"A proposal offered through the request page."`. I reworded that string to `"A proposal offered through a direct request."`. The value is only filler for the proposal-text field, so no test's meaning changes, and the file still goes through `surface.proposalCwuRequest` alone. A search of the proposals folder found no other `page.` in `R-2.14.spec.ts`.

One thing to know: `tests/acceptance/proposals/R-2.18.spec.ts` line 22 has a comment that also contains `page.` ("…on each create page. The seed…"). The check did not name that file, so I left it alone as instructed. If the check scans comments too, it may refuse that line on a later run, and rewording the comment would fix it.