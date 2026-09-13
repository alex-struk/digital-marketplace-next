// criterion: @R-2.9 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every proposal here is offered by the organization-admin persona on behalf of the seeded
// qualified organization, in all three programs, so that one set of records answers both
// halves of the criterion: their author reads the history in the first test, and the owner
// of the organization they belong to reads the same history in the second.
//
// A proposal already has a history by the time it is read — it was created and submitted —
// so the assertion is that the history is there at all for these two readers, which is
// what the criterion claims. What the history says is R-2.35.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

interface Bid {
  opportunityId: string;
  proposalId: string;
}

interface Bids {
  code: Bid;
  sprint: Bid;
  team: Bid;
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

async function publishAllThree(surface: Surface, label: string): Promise<Bids> {
  await surface.signIn(persona.administrator);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    completionDate: inDays(35),
    reward: 5000,
    skills: ["Backend Development"],
    title: `R-2.9 Code With Us opportunity ${label}`,
  });
  const code = await surface.opportunityCwuEdit.opportunityIdentifier();

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
    title: `R-2.9 Sprint With Us opportunity ${label}`,
  });
  const sprint = await surface.opportunitySwuEdit.opportunityIdentifier();

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
    title: `R-2.9 Team With Us opportunity ${label}`,
  });
  const team = await surface.opportunityTwuEdit.opportunityIdentifier();

  await surface.signOut();

  return {
    code: { opportunityId: code, proposalId: "" },
    sprint: { opportunityId: sprint, proposalId: "" },
    team: { opportunityId: team, proposalId: "" },
  };
}

async function submitAllThree(surface: Surface, bids: Bids): Promise<Bids> {
  await surface.signIn(persona.organizationAdmin);

  await surface.proposalCwuCreate.open({ opportunityId: bids.code.opportunityId });
  await surface.proposalCwuCreate.chooseProponentOrganization({
    organization: seed.organizations.qualified,
  });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A Code With Us proposal offered for the organization.",
  });
  const code = await surface.proposalCwuEdit.proposalIdentifier();

  await surface.proposalSwuCreate.open({ opportunityId: bids.sprint.opportunityId });
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
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  const sprint = await surface.proposalSwuEdit.proposalIdentifier();

  await surface.proposalTwuCreate.open({ opportunityId: bids.team.opportunityId });
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
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
  const team = await surface.proposalTwuEdit.proposalIdentifier();

  return {
    code: { ...bids.code, proposalId: code },
    sprint: { ...bids.sprint, proposalId: sprint },
    team: { ...bids.team, proposalId: team },
  };
}

async function expectEveryHistoryReadable(surface: Surface, bids: Bids): Promise<void> {
  await surface.proposalCwuView.open(bids.code);
  expect(await surface.proposalCwuView.historyTab()).toBeTruthy();

  await surface.proposalSwuView.open(bids.sprint);
  expect(await surface.proposalSwuView.historyTab()).toBeTruthy();

  await surface.proposalTwuView.open(bids.team);
  expect(await surface.proposalTwuView.historyTab()).toBeTruthy();
}

test("a vendor may read the history of a proposal they authored, in all three programs", async ({
  surface,
}) => {
  const published = await publishAllThree(surface, "whose author reads the history");
  const bids = await submitAllThree(surface, published);

  await expectEveryHistoryReadable(surface, bids);
});

test("a vendor may read the history of a proposal belonging to an organization they own or administer, in all three programs", async ({
  surface,
}) => {
  const published = await publishAllThree(surface, "whose organization owner reads the history");
  const bids = await submitAllThree(surface, published);
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await expectEveryHistoryReadable(surface, bids);
});
