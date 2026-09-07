// criterion: @R-2.9 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const CAPABILITY = seed.users.organizationOwner.capabilities[0];
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

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function submittedCodeWithUsProposal(surface: Surface, title: string) {
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

  await surface.signIn(persona.organizationOwner);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });
}

async function submittedSprintWithUsProposal(surface: Surface, title: string) {
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
}

async function submittedTeamWithUsProposal(surface: Surface, title: string) {
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

test("a vendor may read the history of a Code With Us proposal they authored", async ({
  surface,
}) => {
  const title = "R-2.9 Code With Us history";
  await submittedCodeWithUsProposal(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalCwuView.open({ opportunityTitle: title });

  expect(await surface.proposalCwuView.historyTab()).toContain("Submitted");
});

test("a vendor may read the history of a Sprint With Us proposal they authored", async ({
  surface,
}) => {
  const title = "R-2.9 Sprint With Us history";
  await submittedSprintWithUsProposal(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuView.open({ opportunityTitle: title });

  expect(await surface.proposalSwuView.historyTab()).toContain("Submitted");
});

test("a vendor may read the history of a Team With Us proposal they authored", async ({
  surface,
}) => {
  const title = "R-2.9 Team With Us history";
  await submittedTeamWithUsProposal(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuView.open({ opportunityTitle: title });

  expect(await surface.proposalTwuView.historyTab()).toContain("Submitted");
});

test("a vendor may read the history of a proposal belonging to an organization they administer", async ({
  surface,
}) => {
  const title = "R-2.9 organization history";
  await submittedTeamWithUsProposal(surface, title);

  // The proposal was written by the organization's owner; this vendor only administers
  // the organization it was submitted for.
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTwuView.open({
    opportunityTitle: title,
    organizationId: seed.organizations.qualified.id,
  });

  expect(await surface.proposalTwuView.historyTab()).toContain("Submitted");
});
