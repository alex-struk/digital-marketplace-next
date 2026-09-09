// criterion: @R-2.21 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity carries one question with a word limit of thirty, small enough that the
// over-limit answer is plainly over it however words are counted.
//
// The third case the criterion names — a response numbered against a question the
// opportunity does not ask — is not asserted. answer_team_question answers one of the
// questions the opportunity carries, and the opportunity here carries exactly one, so a
// response against a question that is not there cannot be put into the request.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

const overTheLimit = "delivery ".repeat(60).trim();

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
    wordLimit: 30,
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

async function fillProposalExceptTheAnswer(surface: Surface, opportunity: string): Promise<void> {
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

test("a response to an opportunity question is rejected if it is empty", async ({ surface }) => {
  const title = "R-2.21 opportunity whose question is answered with nothing";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await fillProposalExceptTheAnswer(surface, title);
  await surface.proposalSwuCreate.answerTeamQuestion({ order: 0, response: "" });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a response to an opportunity question is rejected if it is longer than the word limit that question carries", async ({
  surface,
}) => {
  const title = "R-2.21 opportunity whose question is answered past its word limit";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await fillProposalExceptTheAnswer(surface, title);
  await surface.proposalSwuCreate.answerTeamQuestion({ order: 0, response: overTheLimit });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});
