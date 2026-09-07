// criterion: @R-2.22 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const REFUSAL = "Organization cannot be changed once the proposal has been submitted";

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

// The vendor owns both organizations, so either of them could carry the proposal.
async function qualifyTheSecondOrganization(surface: Surface) {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({
    organizationId: seed.organizations.withPendingInvitation.id,
  });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
}

async function fillProposal(surface: Surface, title: string, organization: unknown) {
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(organization);
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

test("once a proposal has been submitted, the organization it was submitted for cannot be changed", async ({
  surface,
}) => {
  const title = "R-2.22 organization changed while submitted";
  await publishOpportunity(surface, title);
  await qualifyTheSecondOrganization(surface);

  await fillProposal(surface, title, seed.organizations.qualified);
  await surface.proposalTwuCreate.submitProposal();

  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  await surface.proposalTwuEdit.startEditing();
  await expect(
    surface.proposalTwuEdit.saveChanges({
      organization: seed.organizations.withPendingInvitation,
    })
  ).rejects.toThrow(REFUSAL);
});

test("the organization of a withdrawn proposal can be changed again", async ({ surface }) => {
  const title = "R-2.22 organization changed after withdrawal";
  await publishOpportunity(surface, title);
  await qualifyTheSecondOrganization(surface);

  await fillProposal(surface, title, seed.organizations.qualified);
  await surface.proposalTwuCreate.submitProposal();

  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  await surface.proposalTwuEdit.withdrawProposal();
  expect(await surface.proposalTwuEdit.status()).toContain("Withdrawn");

  await surface.proposalTwuEdit.startEditing();
  await surface.proposalTwuEdit.saveChanges({
    organization: seed.organizations.withPendingInvitation,
  });

  expect(await surface.proposalTwuEdit.proposalTab()).toContain(
    seed.organizations.withPendingInvitation.legal_name
  );
});

test("the organization of a draft proposal can be changed", async ({ surface }) => {
  const title = "R-2.22 organization changed while a draft";
  await publishOpportunity(surface, title);
  await qualifyTheSecondOrganization(surface);

  await fillProposal(surface, title, seed.organizations.qualified);
  await surface.proposalTwuCreate.saveDraft({});

  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  await surface.proposalTwuEdit.startEditing();
  await surface.proposalTwuEdit.saveChanges({
    organization: seed.organizations.withPendingInvitation,
  });

  expect(await surface.proposalTwuEdit.proposalTab()).toContain(
    seed.organizations.withPendingInvitation.legal_name
  );
});
