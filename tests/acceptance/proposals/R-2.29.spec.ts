// criterion: @R-2.29 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface, Persona } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const MINIMUM_SCORE = 50;

async function publishOpportunity(surface: Surface, title: string) {
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
    minimumScore: MINIMUM_SCORE,
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
    maxBudget: 500000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });
}

async function submitProposal(
  surface: Surface,
  title: string,
  organization: unknown,
  member: unknown,
  hourlyRate: number
) {
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
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

// The anonymous name is the only handle staff have on a proposal before the challenge
// stage, and the numbering follows the order the proposals happen to be read in, so each
// vendor is asked what their own proposal is called.
async function anonymousNameOf(surface: Surface, bidder: Persona, title: string) {
  await surface.signIn(bidder);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  return surface.proposalTwuEdit.anonymousProponentName();
}

// An organization may appear on only one proposal per opportunity and a qualified
// supplier is one that has accepted the program's terms, so the second bidder brings an
// organization of their own, registered and qualified for this test alone.
async function closedOpportunityWithTwoProposals(
  surface: Surface,
  title: string,
  secondOrganization: string
) {
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await submitProposal(surface, title, seed.organizations.qualified, seed.users.organizationOwner, 50);

  await surface.signIn(persona.vendor);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName: secondOrganization,
    streetAddress1: "7 Cedar Lane",
    city: "Kelowna",
    region: "British Columbia",
    mailCode: "V1Y 6N2",
    country: "Canada",
    contactName: "Casey Cedar",
    contactEmail: "casey.cedar@example.test",
  });
  await surface.organizationEdit.open({ organizationName: secondOrganization });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
  await submitProposal(surface, title, { legalName: secondOrganization }, seed.users.vendorOne, 60);

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

async function scoreTheQuestions(
  surface: Surface,
  title: string,
  scores: Array<{ proponent: string; score: number }>
) {
  await surface.signIn(persona.evaluationPanelEvaluator);
  for (const each of scores) {
    await surface.evaluationIndividualListTwu.open({ opportunityTitle: title });
    await surface.evaluationIndividualListTwu.openProponentEvaluation({
      proponent: each.proponent,
    });
    await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 1, score: each.score });
    await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
      order: 1,
      notes: "The reasons for this score.",
    });
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityTitle: title });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();

  await surface.signIn(persona.evaluationPanelChair);
  for (const each of scores) {
    await surface.evaluationConsensusListTwu.open({ opportunityTitle: title });
    await surface.evaluationConsensusListTwu.openProponentConsensus({ proponent: each.proponent });
    await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order: 1, score: each.score });
    await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
      order: 1,
      notes: "The score the panel agreed on.",
    });
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }
  await surface.evaluationConsensusListTwu.open({ opportunityTitle: title });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();
}

test("a proposal that does not meet every question's minimum score is left behind when the questions are scored", async ({
  surface,
}) => {
  const title = "R-2.29 below the question's minimum score";
  await closedOpportunityWithTwoProposals(surface, title, "R-2.29 Below Minimum Ltd.");

  const abovePass = await anonymousNameOf(surface, persona.organizationOwner, title);
  const belowPass = await anonymousNameOf(surface, persona.vendor, title);

  await scoreTheQuestions(surface, title, [
    { proponent: abovePass, score: 80 },
    { proponent: belowPass, score: MINIMUM_SCORE - 30 },
  ]);

  await surface.signIn(persona.vendor);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalTwuEdit.status()).not.toContain("Challenge");
});

test("proposals meeting every question's minimum score are ranked by that score and carried into the next stage", async ({
  surface,
}) => {
  const title = "R-2.29 carried into the challenge";
  await closedOpportunityWithTwoProposals(surface, title, "R-2.29 Carried Forward Ltd.");

  const carried = await anonymousNameOf(surface, persona.organizationOwner, title);
  const leftBehind = await anonymousNameOf(surface, persona.vendor, title);

  await scoreTheQuestions(surface, title, [
    { proponent: carried, score: 80 },
    { proponent: leftBehind, score: MINIMUM_SCORE - 30 },
  ]);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalTwuEdit.status()).toContain("Challenge");

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  expect(await surface.opportunityTwuEdit.challengeTab()).toContain(carried);
  expect(await surface.opportunityTwuEdit.challengeTab()).not.toContain(leftBehind);
});
