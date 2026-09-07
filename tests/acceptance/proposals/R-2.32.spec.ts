// criterion: @R-2.32 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];

async function fullyEvaluatedProposal(surface: Surface, title: string) {
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
    maxBudget: 5000000,
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

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  const proponent = await surface.proposalTwuEdit.anonymousProponentName();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListTwu.open({ opportunityTitle: title });
  await surface.evaluationIndividualListTwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 1, score: 80 });
  await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
    order: 1,
    notes: "The reasons for this score.",
  });
  await surface.evaluationIndividualCreateTwu.saveDraft();
  await surface.evaluationIndividualListTwu.open({ opportunityTitle: title });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListTwu.open({ opportunityTitle: title });
  await surface.evaluationConsensusListTwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order: 1, score: 80 });
  await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
    order: 1,
    notes: "The score the panel agreed on.",
  });
  await surface.evaluationConsensusCreateTwu.saveDraft();
  await surface.evaluationConsensusListTwu.open({ opportunityTitle: title });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open({ opportunityTitle: title, proponent });
  await surface.proposalTwuView.scoreChallenge({ score: 90 });

  return proponent;
}

test("a vendor does not see the scores and rank of their own proposal before the opportunity has been awarded", async ({
  surface,
}) => {
  const title = "R-2.32 scores before the award";
  await fullyEvaluatedProposal(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });

  expect(await surface.proposalTwuEdit.totalScore()).toBeFalsy();
  expect(await surface.proposalTwuEdit.rank()).toBeFalsy();
});

test("a vendor sees the scores and rank of their own proposal once the opportunity has been awarded", async ({
  surface,
}) => {
  const title = "R-2.32 scores after the award";
  const proponent = await fullyEvaluatedProposal(surface, title);

  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open({ opportunityTitle: title, proponent });
  await surface.proposalTwuView.awardProposal();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });

  expect(await surface.proposalTwuEdit.totalScore()).toBeTruthy();
  expect(await surface.proposalTwuEdit.rank()).toBeTruthy();
});
