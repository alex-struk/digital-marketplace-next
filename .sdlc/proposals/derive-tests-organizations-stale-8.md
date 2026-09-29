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
