---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-04T01:54:27.457Z"
cost: 0.5111844
turns: 12
session: "7930ba54-6905-4ee9-ab37-a40c20a92205"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I rewrote the R-2.2 test so it now covers all three things the criterion says. One criterion was in scope and it got a test. Nothing was recorded as not testable, and nothing in the surface was missing. The new file has not been type-checked or run: there is no `node_modules` in this workspace and no app to run against.

**What changed.** The earlier file, `tests/acceptance/proposals/R-2.2.spec.ts`, had a test for two of the clauses: a vendor who starts a second proposal is taken to the one they already hold, and no second proposal is created. It left out the middle clause, that a request to create a second proposal is refused with a message. The contract has since added a way to send that request on `proposal-cwu-request`, so the file now holds two tests, one for each way of trying:

- **Starting a second proposal from the opportunity page.** An administrator publishes a fresh Code With Us opportunity that is still open. The vendor saves a draft proposal against it through `proposalCwuCreate`, then uses `opportunityCwuView.startProposal()`. The test checks that the screen they land on, `proposalCwuEdit`, shows the draft's identifier and text. It then checks that `proposalVendorDashboard.myProposalsTable()` lists the opportunity exactly once.
- **Sending a create request directly.** The same setup, then a second request through `proposalCwuRequest.submitWithIndividualProponent` with an individual proponent and a Draft status, as the contract instructs. The test waits for `refusalStatus`, checks that `requestAccepted` is empty, and checks that `refusalMessages` contains "You already have a proposal for this opportunity." It then checks that the dashboard still lists the opportunity once.

Each test is titled with the criterion's own words for the outcome it checks. In both, the first proposal is a draft on purpose, because the criterion says a proposal in any state blocks a second one. The header now carries spec@658792c3… and the date 2026-10-04.

**One mismatch in the contract.** The comment on `submit_with_individual_proponent` says the request is "Sent as a submission, not a draft", but the note above the same entry, and the hand-off message, say the second request should carry a Draft status. I pass `status: "Draft"` in the input. If the adapter ignores it, the request goes out as Submitted, which should still reach the same refusal, because the opportunity is still open. Even so, the `contract` stage should make the action's comment say whether a status can be passed.

**Bookkeeping.** `tests/acceptance/not-testable.yaml` had no entry for R-2.2, so there was nothing to remove and I left the file alone. I edited nothing outside `tests/acceptance`.