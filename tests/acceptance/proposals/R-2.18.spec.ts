// criterion: @R-2.18 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The person named who is not a member is the plain vendor, who belongs only to the
// unqualified organization it owns. The proposal is otherwise offered by the qualified
// organization's own administrator, so nothing but the named team member is out of place.
//
// The Team With Us opportunity carries two resources, one for each of the two service areas
// the qualified organization provides, so that the same person can be named twice without
// naming them against the same resource — which is the shape the criterion's refusal is
// about.
//
// The criterion's note, that a pending team member is shown as pending on the proposal
// rather than hidden, is left to the observation that names it (pending_team_member on the
// Sprint With Us create screen) and is not asserted here: the only seeded organization with
// a pending member is a qualified supplier for neither program, so a proposal naming it
// would be refused for its qualification before its team was ever weighed.

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
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
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
    mandatorySkills: ["Frontend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await surface.signOut();
}

async function publishTeamOpportunityWithTwoResources(
  surface: Surface,
  title: string,
): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
    order: 0,
  });
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Agile Coach",
    targetAllocation: 100,
    order: 1,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resources have delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
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

test("every person named on a proposal's team must be an active member of the organization the proposal is submitted for", async ({
  surface,
}) => {
  const title = "R-2.18 opportunity bid on with an outsider on the team";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.vendorOne,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect((await surface.proposalSwuCreate.fieldError()).toLowerCase()).toContain(
    "not an active member of the organization",
  );
});

test("a Team With Us proposal refuses the same person named twice", async ({ surface }) => {
  const title = "R-2.18 opportunity bid on with one person named against two resources";
  await publishTeamOpportunityWithTwoResources(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTwuCreate.open({ opportunity: title });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Agile Coach",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Agile Coach", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our team has delivered the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  expect((await surface.proposalTwuCreate.fieldError()).toLowerCase()).toContain(
    "unique team members",
  );
});

test("a Sprint With Us phase applies no uniqueness check to the people named on it", async ({
  surface,
}) => {
  const title = "R-2.18 opportunity bid on with one person named twice in a phase";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeFalsy();
  await surface.proposalSwuEdit.open({ opportunity: title });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("submitted");
});
