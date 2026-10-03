| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T15:20:03.694Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I made both changes the reviewer asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made both changes the reviewer asked for. Both were in the test "a registration sent by a visitor who is not signed in is refused" in `tests/acceptance/organizations/R-3.2.spec.ts`. I did not run the test suite.

1. **Status code:** I removed the check that `refusalStatus()` equals `'401'`. R-3.2 names no status code. The shared `expectRefusedAsNotPermitted` helper still checks that a refusal carries some status, and that is as far as the criterion goes.
2. **Message wording:** I removed the check that `refusalMessages()` contains "You do not have permission to perform this action.". R-3.2 names no wording. The helper's check that `refusalReason()` mentions permission already covers "refused as not permitted".

That test now relies on `expectRefusedAsNotPermitted` alone, as the tests for public sector staff and for a vendor who never accepted the terms already do. It still confirms that the anonymous visitor persona has no sign-in before it sends the request.

Nothing else in the file changed, and its header stays as it was. Its derived date is already 2026-10-03, which is today, so no rewrite was needed. No other file in `tests/acceptance/organizations/` and no entry in `tests/acceptance/not-testable.yaml` was touched. `persona.vendorWithTermsReset` stays untested, which the reviewer agreed is right because the criterion does not settle that case. Every condition could be acted on, and nothing asked me to change a path outside this stage's boundary.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised organizations tests follow from their criteria and nothing else? Ruling: approve. The only change is the signed-out visitor test in tests/acceptance/organizations/R-3.2.spec.ts. Both assertions the previous ruling asked to remove are gone: refusalStatus() equal to '401', and refusalMessages() containing the exact permission wording. The test now relies only on expectRefusedAsNotPermitted. That helper checks that the request was not accepted, that the refusal carries some status, that the reason mentions permission, and that no organization identifier was returned. Each of these follows from R-3.2's 'refused as not permitted' and from its rule that only a vendor who has accepted the terms may register. The persona precondition, that the visitor has no sign-in, is a setup check and claims nothing about the application. The test asserts the 'anyone else is refused' clause for a visitor who is not signed in, so it can close missing-test/R-3.2 once it runs. That record closes on a result row, not on a ruling, so it is left open. No not-testable entry, protected path or other file in the domain was touched, and the runner's typecheck passed. This would change to a return if any test asserted a status code, message wording or other detail R-3.2 does not state, or if the shared helper were narrowed to one.

**Conditions:**
- condition-met derive-tests-organizations-stale-12#1: the assertion that refusalStatus() is '401' was removed from 'a registration sent by a visitor who is not signed in is refused' in tests/acceptance/organizations/R-3.2.spec.ts; the test now relies on expectRefusedAsNotPermitted, whose status check only requires a non-empty status.
- condition-met derive-tests-organizations-stale-12#2: the assertion that refusalMessages() contains 'You do not have permission to perform this action.' was removed from the same test; 'refused as not permitted' is asserted by the /permission/i match on refusalReason() inside expectRefusedAsNotPermitted.

### Runner-owned typecheck evidence

Proposal revision: `4b7f748b1834ac3270f6a971b524f54c1b085368`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
