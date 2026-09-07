// criterion: @R-2.38 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

const bidders = [
  { who: persona.vendor, proponent: "Robin Fielder" },
  { who: persona.fileUploader, proponent: "Sam Harbour" },
];

function individual(legalName: string) {
  return {
    legalName,
    email: "robin.fielder@example.test",
    street1: "1 Front Street",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V 1V1",
    country: "Canada",
  };
}

// Created by public sector staff and published by an administrator, so the opportunity
// has an author who is not the administrator.
async function closedOpportunityWithTwoProposals(surface: Surface, title: string) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.publish();

  for (const bidder of bidders) {
    await surface.signIn(bidder.who);
    await surface.proposalCwuCreate.open({ opportunityTitle: title });
    await surface.proposalCwuCreate.chooseProponentIndividual(individual(bidder.proponent));
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "How we would do the work.",
      additionalComments: "Nothing further.",
    });
  }

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("a vendor may not take away every proposal of an opportunity in one document", async ({
  surface,
}) => {
  const title = "R-2.38 a vendor asks for every proposal";
  await closedOpportunityWithTwoProposals(surface, title);

  await surface.signIn(persona.vendor);
  await expect(
    surface.proposalCwuExportAll.open({ opportunityTitle: title })
  ).rejects.toThrow();
});

test("public sector staff may take away every proposal of an opportunity in one document", async ({
  surface,
}) => {
  const title = "R-2.38 the author asks for every proposal";
  await closedOpportunityWithTwoProposals(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.proposalCwuExportAll.open({ opportunityTitle: title });

  const document = await surface.proposalCwuExportAll.exportedProposal();
  for (const bidder of bidders) {
    expect(document).toContain(bidder.proponent);
  }
});

test("staff choose whether the document naming every proposal names the proponents", async ({
  surface,
}) => {
  const title = "R-2.38 every proposal, anonymously";
  await closedOpportunityWithTwoProposals(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.proposalCwuExportAll.open({ opportunityTitle: title, anonymous: "true" });

  const document = await surface.proposalCwuExportAll.exportedProposal();
  expect(document).toBeTruthy();
  for (const bidder of bidders) {
    expect(document).not.toContain(bidder.proponent);
  }
});
