| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T02:18:01.717Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote the test for R-3.9, the one criterion in this run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for R-3.9, the one criterion in this run. It has four tests in `tests/acceptance/organizations/R-3.9.spec.ts`, one for each outcome the criterion states. I added nothing to `not-testable.yaml`. I could not type-check the file, because `tests/node_modules` is not installed in this workspace.

**What went wrong before, and the fix.** In the old test, every scenario used the same seeded invitation: the one for `seed.users.invitedVendor` to `seed.organizations.withPendingInvitation`. The tests in a file run in order. So by the time the administrator's scenario ran, the invited person's scenario had already accepted that invitation and it was no longer pending. Now each scenario starts from its own membership, in a state it knows:

- **Invited person accepts:** the invited person signs in and accepts their pending invitation to `withPendingInvitation` on their own organizations page. The test then reads that the organization is listed and no longer marked pending.
- **Administrator accepts on their behalf:** this uses the seed's other pending invitation, `seed.users.teamCandidatePending` to `seed.organizations.qualified`, which no other scenario touches. The administrator opens that person's memberships page by `seed.users.teamCandidatePending.id` and accepts. The test reads the organization as listed and not pending.
- **Owner's attempt is refused:** the owner tries `organizationEdit.approvePendingMember` on the invited person's invitation. The test then reads, as the invited person, that it is still pending. This scenario accepts nothing, so it cannot use up an invitation a later scenario needs. It is also listed first.
- **A membership that is not pending cannot be accepted:** this no longer accepts an invitation first and then tries again. It uses a membership the seed already makes active: `persona.organizationMember` in `seed.organizations.qualified`. The attempt to accept must not go through and no acceptance confirmation may appear. Afterwards the membership is still listed and still not pending.

**What the tests assert.** They check only the states the criterion names (pending, active, refused) and use no screen or step it does not ask for. For "nobody else can accept it", the test tries only the organization's owner, because that is the person the criterion's own "when" names.

**One weak spot.** For the owner and for the not-pending membership, the only sign of refusal the surface offers is that the approve control is not there. The membership's state afterwards is what actually shows the refusal. Neither `organization-edit` nor either organization-memberships page has an observation giving the service's reason for refusing an acceptance, such as "not pending" or "not permitted". If the contract adds one, these two tests could assert the refusal directly instead of inferring it from the missing control and the unchanged state. Nothing was missing that stopped a test being written.

I did not change anything outside `tests/acceptance`, and nothing asked me to.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-3.9 tests follow from the organizations criterion and nothing else? Approve. The four tests match the criterion's four outcomes: the invited person's acceptance makes the membership active; an administrator's acceptance on the invited person's behalf makes it active; the owner's attempt (the actor the criterion's own 'when' names) is refused, shown by the invitation still being pending afterwards; and a membership that is not pending cannot be accepted, with no acceptance confirmed and the membership unchanged. The assertions check only the states the criterion names and use no screen or step it does not ask for. The seed provides both starting points the rewrite relies on (seed.organizations.qualified has organizationMember active and teamCandidatePending pending), and the fixtures reset the target to the seed before every test, so the fault this run was reopened for (one scenario using up another's invitation) cannot recur. The runner's typecheck found no errors under acceptance/organizations/; its two errors are in adapters/new/, which this proposal does not answer for. One clause is not asserted: the criterion says the further attempt is refused 'as not pending', and no organization-edit or organization-memberships observation reports the service's reason for refusing an acceptance, so the writer could not assert it. It is recorded as owed by contract. Would change: a test asserting something the criterion does not state, or a reason-for-refusal observation existing on the surface and going unused.

**Conditions:**
- missing-test R-3.9: a further attempt to accept the now-active membership is refused as not pending — owed by contract: an observation on organization-user-memberships-self (and organization-user-memberships) reporting the service's reason when an acceptance is refused, so a test can read that the refusal was because the membership is not pending

### Runner-owned typecheck evidence

Proposal revision: `78b361234f0d89ff71a631dbc976d61f6e613a4c`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
