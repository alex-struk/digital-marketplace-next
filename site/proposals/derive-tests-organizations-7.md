| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T22:10:29.782Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I made the one change the returned ruling asked for, in the R-3.9 test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the returned ruling asked for, in the R-3.9 test. I couldn't typecheck it here because both attempts to run the compiler were blocked at the permission prompt.

**Condition 1 (R-3.9, "an invitation that is not pending cannot be accepted").** Before this change, the test swallowed any error from the second acceptance and then only checked that the membership was still active. That check would pass just the same if the service wrongly accepted a second time. The test now asserts the refusal itself, using the reviewer's first option: the accept action is not offered once the membership is no longer pending. It records whether the second `approveInvitation` call went through or was rejected, and asserts that it was rejected. It also checks that `acceptConfirmation()` shows nothing after the attempt, and it still checks at the end that the membership is active and belongs to the invited person. No exact message is assumed. Because the surface does reach the refusal, I added no `not-testable.yaml` entry for this clause.

One caveat about how the refusal is observed. The contract describes `acceptConfirmation()` as the dialog you land on after following the accept link in an invitation email. So its absence on its own is weak evidence. What actually separates a refusal from a wrong second acceptance is the rejected action. If a later implementation offers the accept action and refuses on the server with an error message, this test would fail even though the criterion holds. If that happens, the right fix is for the contract to add an observation for a refused-acceptance message on the self-memberships page. None exists today.

The two header lines are unchanged. The "derived" date was already 2026-09-28, today's date, so there was nothing to rewrite. The owner-attempt test in the same file still uses the `attempt` helper and is untouched, as are the other two tests. I changed no other file under `tests/acceptance/organizations/` and no entry in `tests/acceptance/not-testable.yaml`.

**Not verified.** I read the new code against `surface.d.ts`, and the calls it makes exist there with the right signatures. But until the runner's typecheck runs, it is not confirmed that `acceptance/organizations/` still has no diagnostics.

There were no conditions I could not act on, and nothing asked me to change a path outside this stage's boundary.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the revised organizations tests follow from their criteria and nothing else, and does the R-3.9 revision settle derive-tests-organizations-6#3? Ruling: approve. The test 'an invitation that is not pending cannot be accepted' now asserts the refusal itself: the second approveInvitation from the invited person's own memberships page must be rejected (the accept action is not offered for a membership that is no longer pending), no acceptance confirmation may be shown, and the membership must still be active and still the invited person's. That is the first option the earlier ruling offered, and it assumes no exact message. The other R-3.9 tests (owner refused, invited person accepts, administrator accepts on their behalf) each follow from a clause of the criterion. R-3.31 asserts that the owner's message identifies the invited person as having approved or joined, and that the member's message names the organization and says they joined, which matches the criterion's 'then' without assuming exact wording. No selector, route, status code or table name leaks in; every call goes through the contract surface. The runner's typecheck reports no diagnostics under acceptance/organizations/; the two it reports are in adapters/new/, which this proposal does not answer for. Residual weakness, accepted: a rejected adapter call cannot tell 'not offered' apart from a failure for another reason, and the final active-membership check only partly covers that. If a later build offers the action and refuses it with a message, the fix is a contract observation for that message, not a change to this test. What would change the ruling: a typecheck diagnostic under acceptance/organizations/, or evidence that the self-memberships page offers the accept action for an active membership.

**Conditions:**
- condition-met derive-tests-organizations-6#3: tests/acceptance/organizations/R-3.9.spec.ts, test 'an invitation that is not pending cannot be accepted', now requires the second organizationUserMembershipsSelf.approveInvitation to be rejected (the accept action is not offered for the now-active membership) and requires acceptConfirmation() to show nothing, before re-checking that the membership is active and still the invited person's; no exact message is assumed

### Runner-owned typecheck evidence

Proposal revision: `c9456f316be03433b3bc029a5b9967046d472be3`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
