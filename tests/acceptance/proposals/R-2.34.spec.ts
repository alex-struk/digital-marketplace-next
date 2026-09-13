// criterion: @R-2.34 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A proposal can only be disqualified once, so this is the one test in the domain that
// takes a seeded proposal out of contention. It works on the Team With Us opportunity, and
// on the third of its three proposals, so that the Sprint With Us pair is left exactly as
// the closing hook left it for the criteria that only read it (R-2.5, R-2.25, R-2.37).
//
// "At any stage of evaluation" is asserted at the first of those stages, review of the
// questions, which is where the closing hook puts a proposal and the only evaluation stage
// the surface can reach — see the entries for R-2.29 through R-2.33 in not-testable.yaml.
//
// The refusals are read as the proposal not having been disqualified, because the proposal
// view names no error observation for them: a request that was turned away leaves a history
// with no disqualification in it. The last clause of the criterion, that the opportunity is
// re-checked for whether every remaining proposal is now evaluated, is R-2.27 and is not
// asserted here.

const tooLongAReason = "reason ".repeat(715).slice(0, 5001);

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

const where = {
  opportunityId: seed.opportunities.closedTeamWithUs.id,
  proposalId: seed.proposals.teamWithUsThree.id,
};

test("disqualifying a proposal requires a written reason of 1 to 5,000 characters", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.administrator);

  await surface.proposalTwuView.open(where);
  await surface.proposalTwuView.disqualifyProposal({ reason: "" });
  expect((await surface.proposalTwuView.historyTab()).toLowerCase()).not.toContain("disqualif");

  await surface.proposalTwuView.open(where);
  await surface.proposalTwuView.disqualifyProposal({ reason: tooLongAReason });
  expect((await surface.proposalTwuView.historyTab()).toLowerCase()).not.toContain("disqualif");
});

test("a proposal may be disqualified at any stage of evaluation, and the reason is kept in its history", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const reason = "R-2.34 the proponent withdrew from the procurement in writing.";

  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open(where);
  await surface.proposalTwuView.disqualifyProposal({ reason });

  await surface.proposalTwuView.open(where);
  const history = await surface.proposalTwuView.historyTab();
  expect(history.toLowerCase()).toContain("disqualif");
  expect(history).toContain(reason);
});
