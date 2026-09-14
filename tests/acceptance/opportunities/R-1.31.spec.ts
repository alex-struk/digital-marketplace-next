// criterion: @R-1.31 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// A vendor submits a proposal against the seeded published opportunity, so there is
// something for the author and the administrator to be refused sight of. The count of
// submitted proposals stays readable — that is R-1.30's reporting, not the proposals
// themselves — so the assertion is on the proposals themselves being withheld.
//
// The other side of the criterion is read off a seeded opportunity the closing hook has
// moved out of published: the same author who is refused the proposals of a published
// opportunity is offered them once it has reached an evaluation stage.

test("public sector staff cannot see the proposals submitted against an opportunity while it is published", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.publishedCodeWithUs.id;

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered against the seeded published opportunity.",
  });
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
});

test("public sector staff can see the proposals once the opportunity has left the published state", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({
    opportunityId: seed.opportunities.closedSprintWithUs.id,
  });
  expect(await surface.opportunitySwuEdit.proposalsTab()).toBeTruthy();
});
