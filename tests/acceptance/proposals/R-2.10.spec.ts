// criterion: @R-2.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const MAX_BUDGET = 100000;
// One person at full allocation over the contract period at this rate comes to several
// times the opportunity's maximum budget.
const RATE_ABOVE_BUDGET = 500;
const RATE_WITHIN_BUDGET = 50;

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
    maxBudget: MAX_BUDGET,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });
}

async function fillProposal(surface: Surface, title: string, hourlyRate: number) {
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationOwner,
    hourlyRate,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
}

test("a Team With Us proposal is refused when its hourly rates at each resource's target allocation over the contract period come to more than the opportunity's maximum budget: on the create path", async ({
  surface,
}) => {
  const title = "R-2.10 over budget on create";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await fillProposal(surface, title, RATE_ABOVE_BUDGET);
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});

test("a Team With Us proposal is refused when its hourly rates at each resource's target allocation over the contract period come to more than the opportunity's maximum budget: on the edit path", async ({
  surface,
}) => {
  const title = "R-2.10 over budget on edit";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await fillProposal(surface, title, RATE_WITHIN_BUDGET);
  await surface.proposalTwuCreate.submitProposal();

  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalTwuEdit.status()).toContain("Submitted");

  await surface.proposalTwuEdit.startEditing();
  await expect(
    surface.proposalTwuEdit.saveChanges({
      team: [
        {
          resource: 1,
          member: seed.users.organizationOwner,
          hourlyRate: RATE_ABOVE_BUDGET,
        },
      ],
    })
  ).rejects.toThrow();
});
