// criterion: @R-2.37 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const CAPABILITY = seed.users.organizationOwner.capabilities[0];
const ORGANIZATION = seed.organizations.qualified.legal_name;

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function closedOpportunityWithOneProposal(surface: Surface, title: string) {
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

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityTitle: title });
  await surface.opportunitySwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open({ opportunityTitle: title });
  return surface.proposalSwuEdit.anonymousProponentName();
}

async function reachTheCodeChallenge(surface: Surface, title: string, proponent: string) {
  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListSwu.open({ opportunityTitle: title });
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 1, score: 80 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 1,
    notes: "The reasons for this score.",
  });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ opportunityTitle: title });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ opportunityTitle: title });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateSwu.enterQuestionScore({ order: 1, score: 80 });
  await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
    order: 1,
    notes: "The score the panel agreed on.",
  });
  await surface.evaluationConsensusCreateSwu.saveDraft();
  await surface.evaluationConsensusListSwu.open({ opportunityTitle: title });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
}

test("anyone entitled to read a proposal can take away a printable copy of it", async ({
  surface,
}) => {
  const title = "R-2.37 the vendor's own printable copy";
  await closedOpportunityWithOneProposal(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuExportOne.open({ opportunityTitle: title });

  const copy = await surface.proposalSwuExportOne.exportedProposal();
  expect(copy).toBeTruthy();
  expect(copy).toContain(ORGANIZATION);
});

test("staff reading a Sprint With Us copy see the anonymous proponent name until the proposal reaches the challenge stage", async ({
  surface,
}) => {
  const title = "R-2.37 the staff copy before the challenge";
  const proponent = await closedOpportunityWithOneProposal(surface, title);

  await surface.signIn(persona.administrator);
  await surface.proposalSwuExportOne.open({ opportunityTitle: title, proponent });

  expect(await surface.proposalSwuExportOne.anonymousProponentName()).toContain(proponent);
  expect(await surface.proposalSwuExportOne.exportedProposal()).not.toContain(ORGANIZATION);
});

test("staff reading a Sprint With Us copy see the organization once the proposal reaches the challenge stage", async ({
  surface,
}) => {
  const title = "R-2.37 the staff copy at the challenge";
  const proponent = await closedOpportunityWithOneProposal(surface, title);
  await reachTheCodeChallenge(surface, title, proponent);

  await surface.signIn(persona.administrator);
  await surface.proposalSwuExportOne.open({ opportunityTitle: title, proponent });

  expect(await surface.proposalSwuExportOne.exportedProposal()).toContain(ORGANIZATION);
});
