// criterion: @R-2.19 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One opportunity shape serves the whole file: a prototype phase wanting frontend work and
// an implementation phase wanting backend work, with a budget for each and a total that is
// their sum. The qualified organization's administrator holds the frontend capability and
// its owner the backend one, so a proposal that names the right person in the right phase
// is complete, and each test spoils exactly one thing about it.
//
// The phase budget is asserted on its own by proposing a cost over one phase's budget while
// the two costs together stay under the opportunity's total. The opportunity's total budget
// cannot be exceeded without also exceeding a phase budget, since a phase budget over the
// total is refused when the opportunity is created, so the total is not asserted separately.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishSprintOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Prototype",
    startDate: inDays(28),
    completionDate: inDays(60),
    maxBudget: 200000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(61),
    completionDate: inDays(90),
    maxBudget: 300000,
    capabilities: ["Backend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
  await surface.opportunitySwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await surface.signOut();
}

async function answerAndReference(surface: Surface): Promise<void> {
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 0,
    response: "We delivered a scheduling service for a health authority over eighteen months.",
  });
  for (const order of [0, 1, 2]) {
    await surface.proposalSwuCreate.addReference({
      order,
      name: `Reference ${order + 1}`,
      company: "Reference Company Ltd.",
      phone: "250-555-0101",
      email: `reference.${order + 1}@example.test`,
    });
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

async function openProposalForm(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalSwuCreate.open({ opportunity });
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
}

test("a Sprint With Us proposal must offer a team for every phase the opportunity requires", async ({
  surface,
}) => {
  const title = "R-2.19 opportunity bid on with a phase left without a team";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 150000 });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 250000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal must offer no phase the opportunity does not require", async ({
  surface,
}) => {
  const title = "R-2.19 opportunity bid on with a phase it never asked for";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Inception",
    member: seed.users.organizationMember,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 150000 });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 250000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal may name no more than one scrum master in each phase", async ({
  surface,
}) => {
  const title = "R-2.19 opportunity bid on with two scrum masters in one phase";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationMember,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationMember,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 150000 });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 250000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal must cover every capability the opportunity requires across its phases", async ({
  surface,
}) => {
  const title = "R-2.19 opportunity bid on with a required capability uncovered";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Prototype",
    member: seed.users.organizationMember,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Prototype",
    member: seed.users.organizationMember,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 150000 });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 250000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.capabilityGapError()).toBeTruthy();
});

test("a Sprint With Us proposal must stay within each phase's budget", async ({ surface }) => {
  const title = "R-2.19 opportunity bid on above one phase's budget";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Prototype",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 250000 });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 200000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.budgetExceededError()).toBeTruthy();
});
