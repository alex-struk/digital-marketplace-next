| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T01:54:27.496Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote the R-2.2 test so it now covers all three things the criterion says.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the R-2.2 test so it now covers all three things the criterion says. One criterion was in scope and it got a test. Nothing was recorded as not testable, and nothing in the surface was missing. The new file has not been type-checked or run: there is no `node_modules` in this workspace and no app to run against.

**What changed.** The earlier file, `tests/acceptance/proposals/R-2.2.spec.ts`, had a test for two of the clauses: a vendor who starts a second proposal is taken to the one they already hold, and no second proposal is created. It left out the middle clause, that a request to create a second proposal is refused with a message. The contract has since added a way to send that request on `proposal-cwu-request`, so the file now holds two tests, one for each way of trying:

- **Starting a second proposal from the opportunity page.** An administrator publishes a fresh Code With Us opportunity that is still open. The vendor saves a draft proposal against it through `proposalCwuCreate`, then uses `opportunityCwuView.startProposal()`. The test checks that the screen they land on, `proposalCwuEdit`, shows the draft's identifier and text. It then checks that `proposalVendorDashboard.myProposalsTable()` lists the opportunity exactly once.
- **Sending a create request directly.** The same setup, then a second request through `proposalCwuRequest.submitWithIndividualProponent` with an individual proponent and a Draft status, as the contract instructs. The test waits for `refusalStatus`, checks that `requestAccepted` is empty, and checks that `refusalMessages` contains "You already have a proposal for this opportunity." It then checks that the dashboard still lists the opportunity once.

Each test is titled with the criterion's own words for the outcome it checks. In both, the first proposal is a draft on purpose, because the criterion says a proposal in any state blocks a second one. The header now carries spec@658792c3… and the date 2026-10-04.

**One mismatch in the contract.** The comment on `submit_with_individual_proponent` says the request is "Sent as a submission, not a draft", but the note above the same entry, and the hand-off message, say the second request should carry a Draft status. I pass `status: "Draft"` in the input. If the adapter ignores it, the request goes out as Submitted, which should still reach the same refusal, because the opportunity is still open. Even so, the `contract` stage should make the action's comment say whether a status can be passed.

**Bookkeeping.** `tests/acceptance/not-testable.yaml` had no entry for R-2.2, so there was nothing to remove and I left the file alone. I edited nothing outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether the rewritten R-2.2 test follows from R-2.2 v2 and from nothing else. Approve. The criterion has three clauses: (1) a vendor who starts a second proposal is taken to the one they already hold; (2) a request to create a second one is refused with "You already have a proposal for this opportunity."; (3) no second proposal is created. The first test covers clause 1. It starts a proposal through the opportunity page and checks that the screen it lands on shows the identifier and text of the proposal already held. The second test covers clause 2. It sends a create request through proposal-cwu-request and checks that the request was refused, was not accepted, and that the refusal messages contain the criterion's exact sentence. Both tests cover clause 3 by checking that the vendor's dashboard lists the opportunity once. The contract names that dashboard as the place to read it. In both tests the proposal already held is a draft. That follows the criterion's 'in any state' rather than adding anything new. Every other choice in the setup is one the contract's proposal-cwu-request note tells the writer to make: a newly published opportunity that is still open, an individual proponent so the organization check does not refuse the request first, and a Draft status so the status check does not refuse it first. The tests assert no status code, no field-level placement and no other message. They use no selector, route or storage name, only contract surface names. Every assertion is something 'refused with a message' or 'no second proposal is created' states. The runner's typecheck passed with no diagnostics under acceptance/proposals. Nothing was recorded as not-testable, and no clause is left without a test, so nothing new is owed. The open missing-test/R-2.2 entry closes when this test runs, which a ruling cannot record ahead of time. The writer flagged a mismatch in the contract. The action's comment says 'Sent as a submission, not a draft' and its input list has no status, but the note above it says to send a Draft status. This does not change the outcome: if the adapter drops the status, the request goes out as a submission against an opportunity that is still open, and the contract says it then reaches the same refusal. A note about it on an approval would bind nobody, and returning this test so the contract can be fixed would leave the criterion unverified for no gain. What would change the ruling: a first run where the second request is refused for its status or its opportunity rather than for the duplicate. That would show the status ambiguity matters, and the fix would then belong to the contract stage.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `93e3023e0beafdc3b5112d5e35c8e90d197696b9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/proposals/`, which this proposal answers for.

    No diagnostics.
