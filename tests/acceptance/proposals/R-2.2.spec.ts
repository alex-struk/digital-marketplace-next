// criterion: @R-2.2 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const OPPORTUNITY = "R-2.2 Code With Us opportunity";
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

test("a vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one", async ({
  surface,
}) => {
  await publishOpportunity(surface, OPPORTUNITY);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.saveDraft({ proposalText: "Our first bid." });

  await surface.proposalCwuCreate.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.saveDraft({ proposalText: "Our second bid." });

  expect(await surface.proposalCwuCreate.fieldError()).toContain(
    "You already have a proposal for this opportunity."
  );

  // the vendor is left holding the one proposal they already had
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  const mine = await surface.proposalVendorDashboard.myProposalsTable();
  expect(mine.split(OPPORTUNITY).length - 1).toBe(1);
});
