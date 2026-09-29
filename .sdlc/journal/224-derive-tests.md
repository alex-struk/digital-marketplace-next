---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T02:18:01.688Z"
cost: 0.7986331999999999
turns: 15
session: "6a4ed361-5990-4ea6-adf9-ddc43b89455a"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote the test for R-3.9, the one criterion in this run. It has four tests in `tests/acceptance/organizations/R-3.9.spec.ts`, one for each outcome the criterion states. I added nothing to `not-testable.yaml`. I could not type-check the file, because `tests/node_modules` is not installed in this workspace.

**What went wrong before, and the fix.** In the old test, every scenario used the same seeded invitation: the one for `seed.users.invitedVendor` to `seed.organizations.withPendingInvitation`. The tests in a file run in order. So by the time the administrator's scenario ran, the invited person's scenario had already accepted that invitation and it was no longer pending. Now each scenario starts from its own membership, in a state it knows:

- **Invited person accepts:** the invited person signs in and accepts their pending invitation to `withPendingInvitation` on their own organizations page. The test then reads that the organization is listed and no longer marked pending.
- **Administrator accepts on their behalf:** this uses the seed's other pending invitation, `seed.users.teamCandidatePending` to `seed.organizations.qualified`, which no other scenario touches. The administrator opens that person's memberships page by `seed.users.teamCandidatePending.id` and accepts. The test reads the organization as listed and not pending.
- **Owner's attempt is refused:** the owner tries `organizationEdit.approvePendingMember` on the invited person's invitation. The test then reads, as the invited person, that it is still pending. This scenario accepts nothing, so it cannot use up an invitation a later scenario needs. It is also listed first.
- **A membership that is not pending cannot be accepted:** this no longer accepts an invitation first and then tries again. It uses a membership the seed already makes active: `persona.organizationMember` in `seed.organizations.qualified`. The attempt to accept must not go through and no acceptance confirmation may appear. Afterwards the membership is still listed and still not pending.

**What the tests assert.** They check only the states the criterion names (pending, active, refused) and use no screen or step it does not ask for. For "nobody else can accept it", the test tries only the organization's owner, because that is the person the criterion's own "when" names.

**One weak spot.** For the owner and for the not-pending membership, the only sign of refusal the surface offers is that the approve control is not there. The membership's state afterwards is what actually shows the refusal. Neither `organization-edit` nor either organization-memberships page has an observation giving the service's reason for refusing an acceptance, such as "not pending" or "not permitted". If the contract adds one, these two tests could assert the refusal directly instead of inferring it from the missing control and the unchanged state. Nothing was missing that stopped a test being written.

I did not change anything outside `tests/acceptance`, and nothing asked me to.