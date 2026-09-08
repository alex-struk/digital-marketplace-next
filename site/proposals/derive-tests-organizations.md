| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-07T13:06:07.176Z |
| holder | agent:reviewer |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** **What I did.** I derived Playwright acceptance tests for all 35 accepted criteria in the organizations domain, working only from `spec/domains/organizations.md`, `spec/contract/*` and the generated `…

I wrote 32 spec files (61 tests) and three not-testable entries. Journal follows.

---

## Journal

**What I did.** I derived Playwright acceptance tests for all 35 accepted criteria in the organizations domain, working only from `spec/domains/organizations.md`, `spec/contract/*` and the generated `tests/generated/{surface.d.ts,personas.ts,seed.ts}`. Thirty-two criteria got a file under `tests/acceptance/organizations/`, 61 tests in all; three went into `tests/acceptance/not-testable.yaml`.

**Where I split a criterion into several tests.** I settled on one `test()` per distinct actor-and-action pair the criterion names, with a compound "then" asserted inside the one test that produced it. So R-3.3 is five tests (each of the five people opening the record), R-3.14 four, R-3.9 and R-3.12 three; but R-3.6's archive is one test per outcome-surface rather than one per assertion, because re-running the whole setup would say nothing new.

**A decision worth flagging: tests that build their own organizations.** `tests/seed/manifest.yaml` says the SQL is applied once, before any test, and `playwright.config.ts` runs one worker with no reset. That means a destructive test poisons everything after it. Archiving, transferring ownership, and ending a membership therefore register a fresh organization through `organizationCreate.createOrganization` and work on that, rather than on a seeded one — R-3.6, R-3.10, R-3.13, R-3.24, R-3.25 and R-3.34 all do this. R-3.12 grants administrator rights on the seeded qualified organization and withdraws them again at the end of the test, so the seed is left as described. Non-destructive criteria (the refusals, the list, the qualification reads) use the seeded records directly.

**Assumptions a later stage should check.** Actions take `input?: unknown`, so nothing in the contract says what shape an input has. I passed named objects in the criteria's own vocabulary — `{ emails: [...] }` to `addTeamMembers`, `{ member: seed.users.x }` to `removeTeamMember`/`toggleMemberAdminStatus`/`approvePendingMember`, `{ newOwner: ... }` to `changeOwner`, `{ organization: <legal name> }` to `approveInvitation`/`rejectInvitation`/`leaveOrganization`, `{ legalName: ... }` to `organizationList.openOrganization`, and a full profile object (`legalName`, `streetAddress`, `addressLineTwo`, `city`, `region`, `mailCode`, `country`, `contactName`, `contactTitle`, `contactEmail`, `contactPhone`, `website`) to `createOrganization`/`saveChanges`. Every adapter must agree on those key names. I did not pass a `tab` parameter to `open`; I read tab-scoped observations directly and left reaching the tab to the adapter.

Observations return an opaque string, so presence is asserted as truthy, absence as falsy, and content with `toContain` against a seed value. Two tests instead compare the same observation before and after an action (`swuRequirementTwoMembers` in R-3.7 and R-3.10) — that is the only handle the surface gives on an organization's team size, since `organizationUserMemberships.teamMemberCount` is a whole-table string and the owner in the seed owns several organizations.

**Three criteria I could not test, and why.** R-3.17 (invitation membership type) — `addTeamMembers` is about email addresses and no page offers a membership type, so no test can send an invalid one. R-3.20 (asking for the organizations one may act for is refused) — nothing distinguishes a refusal from an empty answer; note that R-3.16, its predecessor, *is* testable because its claim is the empty answer itself, and I said so in the file. R-3.35 (the accept and decline links in an invitation email) — the `Mail` fixture exposes subject, snippet, recipient and id only, so no test can read a body or follow a link.

**Surface actions and observations I needed and did not find.** These are the gaps a next contract could close:

- A refusal observation anywhere in the domain. `organization-create`, `organization-edit` and `organization-list` have no `refused_when_not_permitted` or `not_found`. R-3.2, R-3.3, R-3.14, R-3.16 and R-3.18 all had to observe a refusal indirectly, as the absence of its effect. (`user-profile` has `not_found_page`; the organization surface has no equivalent, though R-3.3's own note says the front end shows one.)
- `organization-edit`: no observation of whether the **Edit** and **Archive** controls are offered, so R-3.18's headline claim — that an organization administrator sees the profile read-only — is untested; only the two service-side refusals are. The same gap costs R-3.28 its clause about the owner not being offered the service-area editor, and R-3.13 its clause about the owner not being offered the ownership transfer.
- `organization-edit`: no observation of the archiving record (the date and the person who archived), so R-3.6's last clause is untested; and no way to see the set of organizations a proposal offers, so its "cannot be used on proposals" clause is untested too. `proposal-swu-create`/`proposal-twu-create` have `choose_organization` but no observation of what was offered.
- `organization-edit`: no per-member observation of administrator rights — there is `owner_badge` and `pending_badge` but no admin badge. R-3.12 proves the grant by having the member open the record afterwards, which is indirect.
- `organization-swu-terms`/`organization-twu-terms`: no `field_error`, so R-3.27's second half (a repeat acceptance is refused) is only observed as "the recorded date did not change".
- `organization-user-memberships`: no `field_error`, so R-3.9's third when is observed through the owner's surface instead of the invited person's.
- Mail: no body or link observation. R-3.29 can only assert that a message arrived naming the organization, not that it offers accept and decline.

**Two places where the seed does not reach the criterion.** R-3.25's given asks for two active members who between them hold every capability; no two seeded vendors do (each holds three of nine), so the file tests the qualified case on the seeded organization and the wholly-unqualified case on a fresh one, and does not reach the "terms unmet, everything else met" case the criterion describes. And the seed records no display names for people, only emails — so R-3.33 can assert that "Admin Rights Removed" stands above "Admin Rights Given" but not that each entry names the member and the person who made the change, and R-3.10 cannot assert that a departed member's row is gone by name. A `name` on each seeded user would close both.

**One assertion I am least sure of.** R-3.28 asserts on the service-area codes as the seed spells them (`FULL_STACK_DEVELOPER`, `AGILE_COACH`). If `service_area_checkbox` reports human-readable labels rather than those codes, that test will fail for a naming reason rather than a behavioural one; the seed is the only non-invented source for those values, so I used it.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Most of the 32 files follow from their criteria and all three not-testable reasons are real, but five tests assert something other than what their criterion says or carry a check that cannot fail: swuRequirementTwoMembers is read as a varying value in R-3.7/R-3.10 and as bare presence in R-3.25, and both readings cannot hold; R-3.10 drops the team-list clause for a reason R-3.30 and R-3.32 disprove; R-3.25 and R-3.26 never reach the mixed met/unmet state their criteria describe and cannot distinguish met from unmet; R-3.22's not.toContain(streetAddress) against organizationName can never fail; and R-3.12 proves an admin-rights grant with R-3.3's record-access rule when changelogEntry observes it directly.

**Conditions:**
- Settle what swuRequirementTwoMembers yields and use it one way across R-3.7, R-3.10 and R-3.25 — as a presence string it makes R-3.10's not.toBe unpassable, as a team-size value it makes R-3.25's toBeTruthy vacuous.
- R-3.10: assert the departed member is gone from teamMemberRow by email, as R-3.30 and R-3.32 already do, rather than resting the whole clause on a qualification-requirement observation.
- R-3.25 and R-3.26: reach the criterion's mixed state (requirements met, terms unmet, organization marked not qualified) with an assertion that separates a requirement shown as met from one shown as unmet, or file the shortfall in not-testable.yaml naming the missing observation instead of recording the criterion as covered.
- R-3.22 test 1: remove or replace the not.toContain(streetAddress) check against organizationName — it cannot fail, so the 'organization is not created' clause has no check behind it.
- R-3.12 test 1: observe the grant of administrator rights through changelogEntry ('Admin Rights Given'), or record the missing admin-rights observation as a gap, rather than asserting R-3.3's record-access rule.
