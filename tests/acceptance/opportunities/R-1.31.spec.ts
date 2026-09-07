// criterion: @R-1.31 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// A vendor submits a proposal against the seeded published opportunity, so there is
// something for the author and the administrator to be refused sight of. The count of
// submitted proposals stays readable — that is R-1.30's reporting, not the proposals
// themselves — so the assertion is on the proposals themselves being withheld.
//
// The other side of the criterion, the proposals becoming visible once the opportunity
// has left the published state, is not asserted: an opportunity leaves that state by
// closing at its proposal deadline, and nothing in the surface makes a deadline pass or
// closes an opportunity by hand (see R-1.1).

test("public sector staff cannot see the proposals submitted against an opportunity until it has left the published state", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered against the seeded published opportunity.",
  });
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
});
