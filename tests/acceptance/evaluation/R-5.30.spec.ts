// criterion: @R-5.30 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.30 Sprint With Us opportunity whose consensus is reopened";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function aConsensusTheChairHasSubmitted(surface: Surface): Promise<string> {
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
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateSwu.enterQuestionScore({ question: QUESTION, score: 3 });
  await surface.evaluationConsensusCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed on three." });
  await surface.evaluationConsensusCreateSwu.saveDraft();
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();

  return proponent;
}

test("the chair may reopen and resubmit a consensus as often as they like until it is finalised", async ({ surface }) => {
  const proponent = await aConsensusTheChairHasSubmitted(surface);

  await surface.evaluationConsensusEditSwu.open({ title: TITLE, proponent });
  expect(await surface.evaluationConsensusEditSwu.editableAfterSubmitted()).toBeTruthy();

  await surface.evaluationConsensusEditSwu.enterQuestionScore({ question: QUESTION, score: 5 });
  await surface.evaluationConsensusEditSwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed on five after all." });
  await surface.evaluationConsensusEditSwu.saveChanges();

  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();

  expect(await surface.evaluationConsensusListSwu.consensusStatus()).toMatch(/submitted/i);
});

test("an individual evaluation is fixed once submitted, unlike a consensus", async ({ surface }) => {
  const proponent = await aConsensusTheChairHasSubmitted(surface);
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualEditSwu.open({ title: TITLE, proponent, evaluator: seed.users.staffPanelEvaluator.id });

  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeTruthy();
});
