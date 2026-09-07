// criterion: @R-2.18 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const CAPABILITY = seed.users.organizationOwner.capabilities[0];

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function publishTeamWithUsOpportunity(surface: Surface, title: string, resources: number) {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  for (let order = 1; order <= resources; order++) {
    await surface.opportunityTwuCreate.addResource({
      order,
      serviceArea: SERVICE_AREA,
      targetAllocation: 100,
    });
  }
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

async function qualifyForTeamWithUs(surface: Surface, organization: Record<string, string>) {
  await surface.organizationEdit.open(organization);
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
}

test("every person named on a proposal's team must be an active member of the organization the proposal is submitted for", async ({
  surface,
}) => {
  const title = "R-2.18 team member who is not an active member";
  await publishTeamWithUsOpportunity(surface, title, 1);

  await surface.signIn(persona.organizationOwner);
  await qualifyForTeamWithUs(surface, {
    organizationId: seed.organizations.withPendingInvitation.id,
  });

  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.withPendingInvitation);
  // This person's membership of that organization is still pending.
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.invitedVendor,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.invitedVendor,
    hourlyRate: 50,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toContain(
    "User is not an active member of the organization."
  );
});

test("a Team With Us proposal refuses the same person named twice", async ({ surface }) => {
  const title = "R-2.18 the same person on two resources";
  await publishTeamWithUsOpportunity(surface, title, 2);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  for (const resource of [1, 2]) {
    await surface.proposalTwuCreate.addTeamMemberForResource({
      resource,
      member: seed.users.organizationOwner,
    });
    await surface.proposalTwuCreate.setHourlyRate({
      resource,
      member: seed.users.organizationOwner,
      hourlyRate: 50,
    });
  }
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toContain(
    "Please select unique team members."
  );
});

test("a Sprint With Us phase applies no such uniqueness check", async ({ surface }) => {
  const title = "R-2.18 the same person twice in one phase";

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "implementation",
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    maxBudget: 100000,
    requiredCapabilities: [CAPABILITY],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    order: 1,
    question: "How would you deliver this work?",
    wordLimit: 300,
    minimumScore: 1,
    score: 100,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    members: [persona.evaluationPanelEvaluator, persona.evaluationPanelChair],
    chair: persona.evaluationPanelChair,
  });
  await surface.opportunitySwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    totalMaxBudget: 100000,
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
  });

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityTitle: title });
  await surface.proposalSwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({
    phase: "implementation",
    proposedCost: 90000,
  });
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 1,
    response: "We would deliver it in one implementation phase.",
  });
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();

  await surface.proposalSwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalSwuEdit.status()).toContain("Submitted");
});
