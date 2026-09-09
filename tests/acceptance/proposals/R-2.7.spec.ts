// criterion: @R-2.7 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The two states a proposal may be created in are asserted in all three programs, which is
// the reach of the criterion the surface has: a create screen offers exactly two ways to
// leave it, save as a draft and submit, and each is exercised once per program.
//
// The other half — that any other state is refused — is not asserted. No action on any of
// the three create screens names the state the proposal is to be created in, and no
// observation returns the states creation will accept, so a request naming a third state
// cannot be made and its refusal cannot be read.
//
// Sprint With Us and Team With Us proposals are offered by the organization-admin persona
// on behalf of the seeded qualified organization, because those two programs only accept a
// proposal from a qualified supplier (R-2.16, R-2.17). Code With Us has no such
// requirement, so the plain vendor persona offers that one as an individual.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishCodeWithUs(surface: Surface, title: string): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    completionDate: inDays(35),
    reward: 5000,
    skills: ["Backend Development"],
    title,
  });
}

async function publishSprintWithUs(surface: Surface, title: string): Promise<void> {
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
    ...shared,
    mandatorySkills: ["Frontend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
}

async function publishTeamWithUs(surface: Surface, title: string): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
    order: 0,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
}

async function fillSprintProposal(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalSwuCreate.open({ opportunity });
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
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
}

async function fillTeamProposal(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalTwuCreate.open({ opportunity });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
}

test("a proposal may be created as a draft, in all three programs", async ({ surface }) => {
  const code = "R-2.7 Code With Us opportunity carrying a draft proposal";
  const sprint = "R-2.7 Sprint With Us opportunity carrying a draft proposal";
  const team = "R-2.7 Team With Us opportunity carrying a draft proposal";

  await surface.signIn(persona.administrator);
  await publishCodeWithUs(surface, code);
  await publishSprintWithUs(surface, sprint);
  await publishTeamWithUs(surface, team);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: code });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({ proposalText: "A Code With Us proposal kept as a draft." });
  await surface.proposalCwuEdit.open({ opportunity: code });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("draft");
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await fillSprintProposal(surface, sprint);
  await surface.proposalSwuCreate.saveDraft();
  await surface.proposalSwuEdit.open({ opportunity: sprint });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");

  await fillTeamProposal(surface, team);
  await surface.proposalTwuCreate.saveDraft();
  await surface.proposalTwuEdit.open({ opportunity: team });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("draft");
});

test("a proposal may be created as a submission, in all three programs", async ({ surface }) => {
  const code = "R-2.7 Code With Us opportunity carrying a submitted proposal";
  const sprint = "R-2.7 Sprint With Us opportunity carrying a submitted proposal";
  const team = "R-2.7 Team With Us opportunity carrying a submitted proposal";

  await surface.signIn(persona.administrator);
  await publishCodeWithUs(surface, code);
  await publishSprintWithUs(surface, sprint);
  await publishTeamWithUs(surface, team);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: code });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A Code With Us proposal offered as a submission from the start.",
  });
  await surface.proposalCwuEdit.open({ opportunity: code });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await fillSprintProposal(surface, sprint);
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  await surface.proposalSwuEdit.open({ opportunity: sprint });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("submitted");

  await fillTeamProposal(surface, team);
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
  await surface.proposalTwuEdit.open({ opportunity: team });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("submitted");
});
