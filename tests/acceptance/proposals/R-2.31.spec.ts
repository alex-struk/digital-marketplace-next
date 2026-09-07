// criterion: @R-2.31 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface, Persona } from "../../fixtures";

const OPPORTUNITY = "R-2.31 the weighted sum of the stage scores";
const SECOND_ORGANIZATION = "R-2.31 Runner Up Ltd.";
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const QUESTIONS_WEIGHT = 40;
const CHALLENGE_WEIGHT = 40;
const PRICE_WEIGHT = 20;

async function submitProposal(
  surface: Surface,
  organization: unknown,
  member: unknown,
  hourlyRate: number
) {
  await surface.proposalTwuCreate.open({ opportunityTitle: OPPORTUNITY });
  await surface.proposalTwuCreate.chooseOrganization(organization);
  await surface.proposalTwuCreate.addTeamMemberForResource({ resource: 1, member });
  await surface.proposalTwuCreate.setHourlyRate({ resource: 1, member, hourlyRate });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
}

async function anonymousNameOf(surface: Surface, bidder: Persona) {
  await surface.signIn(bidder);
  await surface.proposalTwuEdit.open({ opportunityTitle: OPPORTUNITY });
  return surface.proposalTwuEdit.anonymousProponentName();
}

async function closedOpportunityWithTwoBids(surface: Surface) {
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
    title: OPPORTUNITY,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    maxBudget: 5000000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: QUESTIONS_WEIGHT,
    challengeWeight: CHALLENGE_WEIGHT,
    priceWeight: PRICE_WEIGHT,
  });

  await surface.signIn(persona.organizationOwner);
  await submitProposal(surface, seed.organizations.qualified, seed.users.organizationOwner, 50);

  await surface.signIn(persona.vendor);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName: SECOND_ORGANIZATION,
    streetAddress1: "7 Cedar Lane",
    city: "Kelowna",
    region: "British Columbia",
    mailCode: "V1Y 6N2",
    country: "Canada",
    contactName: "Casey Cedar",
    contactEmail: "casey.cedar@example.test",
  });
  await surface.organizationEdit.open({ organizationName: SECOND_ORGANIZATION });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
  await submitProposal(surface, { legalName: SECOND_ORGANIZATION }, seed.users.vendorOne, 100);

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

async function scoreTheQuestions(surface: Surface, scores: Array<{ proponent: string; score: number }>) {
  await surface.signIn(persona.evaluationPanelEvaluator);
  for (const each of scores) {
    await surface.evaluationIndividualListTwu.open({ opportunityTitle: OPPORTUNITY });
    await surface.evaluationIndividualListTwu.openProponentEvaluation({ proponent: each.proponent });
    await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 1, score: each.score });
    await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
      order: 1,
      notes: "The reasons for this score.",
    });
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityTitle: OPPORTUNITY });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();

  await surface.signIn(persona.evaluationPanelChair);
  for (const each of scores) {
    await surface.evaluationConsensusListTwu.open({ opportunityTitle: OPPORTUNITY });
    await surface.evaluationConsensusListTwu.openProponentConsensus({ proponent: each.proponent });
    await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order: 1, score: each.score });
    await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
      order: 1,
      notes: "The score the panel agreed on.",
    });
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }
  await surface.evaluationConsensusListTwu.open({ opportunityTitle: OPPORTUNITY });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();
}

test("a proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated", async ({
  surface,
}) => {
  await closedOpportunityWithTwoBids(surface);

  const leader = await anonymousNameOf(surface, persona.organizationOwner);
  const runnerUp = await anonymousNameOf(surface, persona.vendor);
  await scoreTheQuestions(surface, [
    { proponent: leader, score: 80 },
    { proponent: runnerUp, score: 70 },
  ]);

  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: leader });
  await surface.proposalTwuView.scoreChallenge({ score: 90 });

  // One of the two still has no challenge score, so neither is ranked yet.
  expect(await surface.proposalTwuView.totalScore()).toBeFalsy();

  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: runnerUp });
  await surface.proposalTwuView.scoreChallenge({ score: 60 });

  // Questions 80, challenge 90 and the lowest bid's price score of 100, in the weights
  // the opportunity carries.
  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: leader });
  expect(await surface.proposalTwuView.totalScore()).toContain("88");

  // Questions 70, challenge 60 and a price score of 50, in the same weights.
  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: runnerUp });
  expect(await surface.proposalTwuView.totalScore()).toContain("62");

  // Now that both are fully evaluated they are ranked against each other, highest total
  // first.
  await surface.opportunityTwuEdit.open({ opportunityTitle: OPPORTUNITY });
  const ranked = await surface.opportunityTwuEdit.proposalsTab();
  expect(ranked.indexOf(leader)).toBeLessThan(ranked.indexOf(runnerUp));
  expect(ranked.indexOf(leader)).toBeGreaterThanOrEqual(0);
});
