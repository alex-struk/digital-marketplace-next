| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T02:56:22.165Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote the test for R-3.9, so all 1 of the 1 criteria I was given now has a test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for R-3.9, so all 1 of the 1 criteria I was given now has a test. I couldn't run the TypeScript compiler here because the command wasn't approved, so the file hasn't been type-checked. I checked by hand that the personas, seed handles and page methods it uses are in `tests/generated/*`.

**R-3.9** now lives in `tests/acceptance/organizations/R-3.9.spec.ts`. It was sent back because the not-pending refusal couldn't be read. The contract has since added `affiliation-approval-request`, with the action `accept_membership_by_request` and the observations `request_accepted`, `membership_status`, `refusal_messages` and `refusal_status`. It's opened by a membership's identifier, and I used `seed.affiliations.pendingInvitation.id` for that. The file has four tests, one for each given/when/then:

- **The owner's attempt is refused.** The organization's owner signs in and sends the acceptance for the invited vendor's pending invitation. The test checks that the service gives refusal messages and does not report the request as accepted. It then signs in as the invited person and checks the invitation still shows as pending in their own list of affiliations.
- **The invited person accepts.** This is done through the accept action on their own affiliations page, the same as before. Afterwards the organization is listed and has no pending badge.
- **An administrator accepts on the person's behalf.** This uses a different seeded invitation, `seed.users.teamCandidatePending`'s invitation to `seed.organizations.qualified`, through the page that shows a given person's affiliations. It is unchanged.
- **An invitation that isn't pending can't be accepted.** The invited person accepts through the new page, and the test checks the status reads `ACTIVE`. The same person tries again. The test checks this second attempt is not accepted, that the refusal message matches "not pending" (the contract quotes the service's wording as "Membership is not pending."), and that the membership is still active. The same person makes both attempts so the refusal can only be about the status, not about permission. The earlier version could only infer this refusal; this one reads it.

The target is reset to its seed before every test, so no test depends on what another did.

**`not-testable.yaml`:** the handback said R-3.9 had an entry there, but it doesn't. The only R-3.9 records in the workspace are two already-closed items in `redo.yaml`. I had nothing to remove, and there's no entry sitting beside the test.

**Not testable:** none.

**Missing from the surface:** nothing for this criterion. One ambiguity for whoever maintains the contract: the note on `affiliation-approval-request` says `:affiliationId` is "a seed.affiliations handle", but the generated type asks for a plain string. I passed the membership's `.id`, the same way other pages take `seed.organizations.<handle>.id`. The note would be clearer if it said the identifier is what's passed.

Nothing asked me to change any of the paths that are here only to be read.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-3.9 tests follow from the organizations criterion and from nothing else? Ruling: approve. Each of R-3.9's three outcomes is asserted, and nothing beyond them. The owner's attempt, sent through affiliation-approval-request on seed.affiliations.pendingInvitation, is checked as refused: refusal messages are present, the request is not accepted, and the invited person still sees the invitation pending. The invited person's own acceptance and an administrator's acceptance on a person's behalf each leave the organization listed without a pending badge. For the clause that was owed, the same invited person accepts, the membership reads ACTIVE, and a second attempt is not accepted, with a refusal matching 'not pending' while the membership stays active. Because the same permitted person makes both attempts, the refusal can only be about status, not permission. Every value asserted (ACTIVE, 'Membership is not pending.') comes from the contract's own note on affiliation-approval-request, not from implementation. The runner's typecheck shows no diagnostics under acceptance/organizations; its two diagnostics are under adapters/new, which this proposal does not answer for. No not-testable entry is needed, since every clause is asserted. missing-test/R-3.9 is not closed by this ruling. It closes when this spec runs at R-3.9 v1, so no condition is attached for it. What would change the ruling: a runner-reported TypeScript error in R-3.9.spec.ts, or a contract change so that membership_status no longer answers ACTIVE for an accepted request.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `f89bfe675a493c970abbc2b242743079bb2c042e`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
