// criterion: @R-2.20 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];

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
    maxBudget: 500000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });
}

async function startProposal(surface: Surface, title: string) {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the people named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
}

test("a Team With Us proposal must name at least one team member", async ({ surface }) => {
  const title = "R-2.20 no team members";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us proposal must name each team member with an hourly rate of at least one dollar", async ({
  surface,
}) => {
  const title = "R-2.20 hourly rate below one dollar";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationOwner,
    hourlyRate: 0,
  });
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us proposal must name each team member against a resource that exists", async ({
  surface,
}) => {
  const title = "R-2.20 a resource that does not exist";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: { unknown: true },
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: { unknown: true },
    member: seed.users.organizationOwner,
    hourlyRate: 50,
  });
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us proposal is accepted even when a resource it names belongs to another opportunity", async ({
  surface,
}) => {
  const bidOn = "R-2.20 the opportunity being bid on";
  const elsewhere = "R-2.20 the other opportunity";
  await publishOpportunity(surface, elsewhere);
  await publishOpportunity(surface, bidOn);
  await startProposal(surface, bidOn);

  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationOwner,
    hourlyRate: 50,
  });
  // A second person named against a resource of an opportunity this proposal is not for.
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: { opportunityTitle: elsewhere, order: 1 },
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: { opportunityTitle: elsewhere, order: 1 },
    member: seed.users.organizationAdmin,
    hourlyRate: 55,
  });
  await surface.proposalTwuCreate.submitProposal();

  await surface.proposalTwuEdit.open({ opportunityTitle: bidOn });
  expect(await surface.proposalTwuEdit.status()).toContain("Submitted");
});
