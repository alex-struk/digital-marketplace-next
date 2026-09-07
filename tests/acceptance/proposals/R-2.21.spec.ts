// criterion: @R-2.21 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const CAPABILITY = seed.users.organizationOwner.capabilities[0];
const WORD_LIMIT = 5;

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function publishOpportunity(surface: Surface, title: string) {
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
    wordLimit: WORD_LIMIT,
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
}

async function startProposal(surface: Surface, title: string) {
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
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

test("a response to an opportunity question is rejected if it is empty", async ({ surface }) => {
  const title = "R-2.21 empty response";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalSwuCreate.answerTeamQuestion({ order: 1, response: "" });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a response to an opportunity question is rejected if it is longer than the word limit that question carries", async ({
  surface,
}) => {
  const title = "R-2.21 response over the word limit";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 1,
    response: Array.from({ length: WORD_LIMIT + 10 }, () => "word").join(" "),
  });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a response to an opportunity question is rejected if it answers a question the opportunity does not ask", async ({
  surface,
}) => {
  const title = "R-2.21 response to a question that was not asked";
  await publishOpportunity(surface, title);
  await startProposal(surface, title);

  await surface.proposalSwuCreate.answerTeamQuestion({ order: 1, response: "In one phase." });
  // The opportunity asks one question; this answers a second one it never asked.
  await surface.proposalSwuCreate.answerTeamQuestion({ order: 2, response: "In one phase." });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toContain(
    "No matching opportunity question."
  );
});
