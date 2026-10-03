---
gate: G3
question: "Do the revised organizations tests now follow from their criteria and from nothing else?"
recommendation: "I made both changes the reviewer asked for."
opened: 2026-10-03T15:20:03.694Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I made both changes the reviewer asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made both changes the reviewer asked for. Both were in the test "a registration sent by a visitor who is not signed in is refused" in `tests/acceptance/organizations/R-3.2.spec.ts`. I did not run the test suite.

1. **Status code:** I removed the check that `refusalStatus()` equals `'401'`. R-3.2 names no status code. The shared `expectRefusedAsNotPermitted` helper still checks that a refusal carries some status, and that is as far as the criterion goes.
2. **Message wording:** I removed the check that `refusalMessages()` contains "You do not have permission to perform this action.". R-3.2 names no wording. The helper's check that `refusalReason()` mentions permission already covers "refused as not permitted".

That test now relies on `expectRefusedAsNotPermitted` alone, as the tests for public sector staff and for a vendor who never accepted the terms already do. It still confirms that the anonymous visitor persona has no sign-in before it sends the request.

Nothing else in the file changed, and its header stays as it was. Its derived date is already 2026-10-03, which is today, so no rewrite was needed. No other file in `tests/acceptance/organizations/` and no entry in `tests/acceptance/not-testable.yaml` was touched. `persona.vendorWithTermsReset` stays untested, which the reviewer agreed is right because the criterion does not settle that case. Every condition could be acted on, and nothing asked me to change a path outside this stage's boundary.
