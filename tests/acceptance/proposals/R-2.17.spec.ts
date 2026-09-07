// criterion: @R-2.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PROVIDED_SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const WITHDRAWN_SERVICE_AREA = seed.organizations.qualified.service_areas[1];

async function publishOpportunity(surface: Surface, title: string, serviceArea: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    order: 1,
    serviceArea,
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

async function fillProposal(surface: Surface, title: string) {
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
}

test("a Team With Us proposal may only be submitted on behalf of an organization that provides every service area the opportunity's resources call for", async ({
  surface,
}) => {
  const title = "R-2.17 service area the organization does not provide";
  await publishOpportunity(surface, title, WITHDRAWN_SERVICE_AREA);

  // The organization stops providing the service area the opportunity calls for.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ organizationId: seed.organizations.qualified.id });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [PROVIDED_SERVICE_AREA] });

  await fillProposal(surface, title);
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.serviceAreaError()).toContain(
    "The selected organization does not satisfy this opportunity's service areas."
  );

  // Put the service area back, so the seeded organization is as the seed describes it.
  await surface.organizationEdit.open({ organizationId: seed.organizations.qualified.id });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({
    serviceAreas: [PROVIDED_SERVICE_AREA, WITHDRAWN_SERVICE_AREA],
  });
});

test("a Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for the program", async ({
  surface,
}) => {
  const title = "R-2.17 organization that is not a qualified supplier";
  await publishOpportunity(surface, title, PROVIDED_SERVICE_AREA);

  // This organization has accepted no Team With Us terms and provides no service areas.
  await surface.signIn(persona.vendor);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.unqualified);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.vendorOne,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.vendorOne,
    hourlyRate: 50,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.unqualifiedOrganizationNotice()).toBeTruthy();
});
