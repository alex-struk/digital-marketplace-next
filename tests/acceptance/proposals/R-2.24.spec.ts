// criterion: @R-2.24 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function twoVendorsBid(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  for (const bidder of [persona.vendor, persona.fileUploader]) {
    await surface.signIn(bidder);
    await surface.proposalCwuCreate.open({ opportunityTitle: title });
    await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "How we would do the work.",
      additionalComments: "Nothing further.",
    });
  }
}

test("a vendor sees only the proposals they authored", async ({ surface }) => {
  const title = "R-2.24 two vendors on one opportunity";
  await twoVendorsBid(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();

  const mine = await surface.proposalVendorDashboard.myProposalsTable();
  expect(mine.split(title).length - 1).toBe(1);
});

test("a vendor never sees another vendor's proposal", async ({ surface }) => {
  const title = "R-2.24 another vendor's proposal";
  await twoVendorsBid(surface, title);

  await surface.signIn(persona.vendor);
  await expect(
    surface.proposalCwuView.open({
      opportunityTitle: title,
      authorId: seed.users.fileUploader.id,
    })
  ).rejects.toThrow();
});

test("a vendor additionally sees the proposals of organizations they own or administer, under a separate heading", async ({
  surface,
}) => {
  const title = "R-2.24 an organization's proposal";

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    order: 1,
    serviceArea: SERVICE_AREA,
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    order: 1,
    question: "How would you staff this work?",
    wordLimit: 300,
    minimumScore: 1,
    score: 100,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [persona.evaluationPanelEvaluator, persona.evaluationPanelChair],
    chair: persona.evaluationPanelChair,
  });
  await surface.opportunityTwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    maxBudget: 200000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });

  // Written by an administrator of the organization, not by its owner.
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationAdmin,
    hourlyRate: 55,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);

  await surface.proposalVendorDashboard.showOrgProposals();
  expect(await surface.proposalVendorDashboard.orgProposalsTable()).toContain(title);
});
