// criterion: @R-2.30 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface, Persona } from "../../fixtures";

const OPPORTUNITY = "R-2.30 the lowest bid sets the price score";
const SECOND_ORGANIZATION = "R-2.30 Higher Bid Ltd.";
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
// Both proposals name one person at the same allocation over the same contract period,
// so the second bid is exactly twice the first.
const LOWER_RATE = 50;
const HIGHER_RATE = 100;

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
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });

  await surface.signIn(persona.organizationOwner);
  await submitProposal(surface, seed.organizations.qualified, seed.users.organizationOwner, LOWER_RATE);

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
  await submitProposal(surface, { legalName: SECOND_ORGANIZATION }, seed.users.vendorOne, HIGHER_RATE);

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: OPPORTUNITY });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

async function scoreTheQuestions(surface: Surface, proponents: string[]) {
  await surface.signIn(persona.evaluationPanelEvaluator);
  for (const proponent of proponents) {
    await surface.evaluationIndividualListTwu.open({ opportunityTitle: OPPORTUNITY });
    await surface.evaluationIndividualListTwu.openProponentEvaluation({ proponent });
    await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 1, score: 80 });
    await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
      order: 1,
      notes: "The reasons for this score.",
    });
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityTitle: OPPORTUNITY });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();

  await surface.signIn(persona.evaluationPanelChair);
  for (const proponent of proponents) {
    await surface.evaluationConsensusListTwu.open({ opportunityTitle: OPPORTUNITY });
    await surface.evaluationConsensusListTwu.openProponentConsensus({ proponent });
    await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order: 1, score: 80 });
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

test("a proposal's price score is its share of the lowest bid among the proposals still in contention, calculated when the last human-entered score is recorded", async ({
  surface,
}) => {
  await closedOpportunityWithTwoBids(surface);

  const lowestBid = await anonymousNameOf(surface, persona.organizationOwner);
  const highestBid = await anonymousNameOf(surface, persona.vendor);
  await scoreTheQuestions(surface, [lowestBid, highestBid]);

  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: lowestBid });
  await surface.proposalTwuView.scoreChallenge({ score: 90 });

  // Until the last human-entered score is in, no price score has been worked out.
  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: highestBid });
  expect(await surface.proposalTwuView.priceScore()).toBeFalsy();

  await surface.proposalTwuView.scoreChallenge({ score: 90 });

  // The bid is twice the lowest one, so it scores half of the price weight.
  expect(await surface.proposalTwuView.priceScore()).toContain("50");
  expect(await surface.proposalTwuView.historyTab()).toContain("Price");

  await surface.proposalTwuView.open({ opportunityTitle: OPPORTUNITY, proponent: lowestBid });
  expect(await surface.proposalTwuView.priceScore()).toContain("100");
});
