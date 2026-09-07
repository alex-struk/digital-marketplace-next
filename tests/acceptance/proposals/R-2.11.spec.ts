// criterion: @R-2.11 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";

async function publishOpportunity(surface: Surface, title: string) {
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
}

async function qualifyForTeamWithUs(surface: Surface, organization: Record<string, string>) {
  await surface.organizationEdit.open(organization);
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
}

// The organization's owner bids first, so the organization is already on a proposal for
// this opportunity before the second vendor tries to name it.
async function opportunityAlreadyBidOnByTheOrganization(surface: Surface, title: string) {
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationOwner,
    hourlyRate: 50,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
}

test("an organization may appear on at most one proposal per opportunity: a new proposal naming an organization that already bid is refused", async ({
  surface,
}) => {
  const title = "R-2.11 second proposal for one organization";
  await opportunityAlreadyBidOnByTheOrganization(surface, title);

  // A different vendor, who administers the same organization, names it again.
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

  expect(await surface.proposalTwuCreate.fieldError()).toContain(
    "Please select a different organization."
  );
});

test("an organization may appear on at most one proposal per opportunity: an existing proposal edited to name an organization that already bid is refused", async ({
  surface,
}) => {
  const title = "R-2.11 proposal edited onto one organization";
  const ownOrganization = "R-2.11 Second Bidder Ltd.";
  await opportunityAlreadyBidOnByTheOrganization(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName: ownOrganization,
    streetAddress1: "5 Wharf Street",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8W 1T3",
    country: "Canada",
    contactName: "Alex Wharf",
    contactEmail: "alex.wharf@example.test",
  });
  await qualifyForTeamWithUs(surface, { organizationName: ownOrganization });

  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization({ legalName: ownOrganization });
  await surface.proposalTwuCreate.saveDraft({});

  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  await surface.proposalTwuEdit.startEditing();
  await expect(
    surface.proposalTwuEdit.saveChanges({ organization: seed.organizations.qualified })
  ).rejects.toThrow();
});
