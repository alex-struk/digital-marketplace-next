// criterion: @R-5.32 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.32 Sprint With Us opportunity being finalised";
const QUESTION = "Describe how your team would run the first sprint.";
const AGREED_SCORE = 4;

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// One proponent, agreed at four out of five against a question whose minimum is one, so
// the proponent clears every minimum and is there to be screened in.
async function anOpportunityWithItsConsensusSubmitted(surface: Surface): Promise<string> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: TITLE, proposalDeadline: momentsFromNow() });
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.opportunitySwuView.open({ title: TITLE });
  await surface.opportunitySwuView.startProposal();
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setScrumMaster({ member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "implementation", cost: 50000 });
  await surface.proposalSwuCreate.answerTeamQuestion({ question: QUESTION, answer: "We start with a discovery sprint." });
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ title: TITLE });
      return surface.opportunitySwuView.status();
    }, { timeout: 20_000 })
    .toMatch(/evaluation/i);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  const proponent = await surface.evaluationIndividualListSwu.anonymousProponentName();
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: AGREED_SCORE });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateSwu.enterQuestionScore({ question: QUESTION, score: AGREED_SCORE });
  await surface.evaluationConsensusCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed on four." });
  await surface.evaluationConsensusCreateSwu.saveDraft();
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.signOut();

  return proponent;
}

test("finalising the consensus records the agreed scores against each proponent", async ({ surface }) => {
  const proponent = await anOpportunityWithItsConsensusSubmitted(surface);

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  await surface.proposalSwuView.open({ title: TITLE, proponent });
  expect(await surface.proposalSwuView.questionsScore()).toContain(String(AGREED_SCORE));
  expect(await surface.proposalSwuView.historyTab()).toBeTruthy();
});

test("finalising screens in the highest-scoring proponents that met every minimum score and moves the opportunity to its next stage", async ({ surface }) => {
  const proponent = await anOpportunityWithItsConsensusSubmitted(surface);

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  await surface.opportunitySwuView.open({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).toMatch(/code challenge/i);

  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.codeChallengeTab()).toContain(proponent);
});
