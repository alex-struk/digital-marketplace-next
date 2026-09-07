// criterion: @R-2.4 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const DEADLINE = "2030-06-01T23:59:00Z";

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function publishOpportunity(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: DEADLINE,
    remoteOk: true,
  });
}

test("only a draft proposal can be deleted: deleting a draft removes it permanently", async ({
  surface,
}) => {
  const opportunity = "R-2.4 draft deleted";
  await publishOpportunity(surface, opportunity);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: opportunity });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.saveDraft({ proposalText: "A bid we will think better of." });

  await surface.proposalCwuEdit.open({ opportunityTitle: opportunity });
  expect(await surface.proposalCwuEdit.status()).toContain("Draft");
  await surface.proposalCwuEdit.deleteProposal();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(opportunity);

  await expect(surface.proposalCwuEdit.open({ opportunityTitle: opportunity })).rejects.toThrow();
});

test("only a draft proposal can be deleted: deleting a submitted proposal is refused", async ({
  surface,
}) => {
  const opportunity = "R-2.4 submitted not deleted";
  await publishOpportunity(surface, opportunity);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: opportunity });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  await surface.proposalCwuEdit.open({ opportunityTitle: opportunity });
  expect(await surface.proposalCwuEdit.status()).toContain("Submitted");
  await expect(surface.proposalCwuEdit.deleteProposal()).rejects.toThrow();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).toContain(opportunity);
});
