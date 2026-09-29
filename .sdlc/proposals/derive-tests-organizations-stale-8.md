---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "I wrote a test for the one criterion I was given, R-3.9 v2."
opened: 2026-09-29T07:07:02.221Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I wrote a test for the one criterion I was given, R-3.9 v2.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I wrote a test for the one criterion I was given, R-3.9 v2. Nothing was not testable, so I made no change to `tests/acceptance/not-testable.yaml`. I did not type-check or run the file: the typecheck command needed approval that nobody was there to give, and this workspace has no adapter to run it against.

**What changed from v1.** A test file for R-3.9 v1 was already there, and I rewrote it in place as `tests/acceptance/organizations/R-3.9.spec.ts` with the v2 headers. The v1 file had a test in which a service administrator accepts the invitation on the invited person's behalf and the membership becomes active. v2 says the invitation becomes active "only when the invited person accepts it," so keeping that test would contradict the criterion, and I removed it. I did not add a test that an administrator is refused either. The criterion's given/when/then names only the owner, and I did not want to assume the service's current behaviour toward administrators on the criterion's behalf.

**The three tests**, one per outcome in the criterion's "then", all starting from the seeded pending invitation (`seed.affiliations.pendingInvitation`, from `seed.users.invitedVendor` to `seed.organizations.withPendingInvitation`):
- **The owner cannot accept on the invited person's behalf.** Signed in as `persona.organizationOwner`, the test sends the acceptance through `affiliationApprovalRequest.acceptMembershipByRequest()` and checks that it is refused and not accepted. It then signs in as the invited person and checks that the invitation still shows as pending on the "My Organizations" page (`organizationUserMembershipsSelf`).
- **The invitation becomes active when the invited person accepts it.** The invited person approves it on their own "My Organizations" page, and the test checks that the organization is listed with no pending badge.
- **An invitation that is not pending cannot be accepted.** The invited person accepts by request (the answer reports `ACTIVE`), then tries again. The test checks that the second attempt is refused with a message matching "not pending" and that the membership stays active.

**Gaps in the surface.** All three outcomes are fully covered, so no partial-coverage entry was needed and I found no missing action or observation. One thing the contract could add: a page or observation showing a membership's status directly. For now, "active" in the second test is read as the organization being listed without a pending badge, which is weaker than reading the status itself.

I touched nothing outside `tests/acceptance/organizations/R-3.9.spec.ts`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-3.9 tests follow from R-3.9 v2 and nothing else? Approve. Each of the criterion's three outcomes has its own test, starting from the seeded pending invitation: (1) the owner's attempt to accept on the invited person's behalf is refused and nothing is accepted, and the invited person still sees the invitation as pending; (2) the invited person's own acceptance leaves the organization listed with no pending badge; (3) a second acceptance of the now-active membership is refused with a message matching 'not pending' and the membership stays active. The v1 test in which an administrator accepts on the invited person's behalf contradicts v2's 'only when the invited person accepts it' and was rightly removed. The writer also rightly added no administrator-refusal test, which the criterion's given/when/then does not ask for. The one literal that looks like an implementation leak, membershipStatus() === 'ACTIVE', is the value the contract surface itself documents for that observation (spec/contract/surface.yaml:1975), so it is contract vocabulary, not evidence the writer read the implementation. The runner's typecheck reports no diagnostics under acceptance/organizations; its failures are in adapters/new/, which this proposal does not answer for. The applied.yaml change drops a triage ruling on R-3.9 v1, which no longer applies now that the criterion is at v2. No not-testable entry is needed, because every clause is asserted. The open missing-test/R-3.9 owed by calibrate stays open until the v2 test runs. What would change this: a typecheck diagnostic in R-3.9.spec.ts, or a contract that no longer gives ACTIVE as the membership status value.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5679e076ce353228c211ebd2b735689424b01eca`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
