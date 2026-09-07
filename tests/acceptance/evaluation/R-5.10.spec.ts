// criterion: @R-5.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const SWU_TITLE = "R-5.10 Sprint With Us opportunity nobody clears";
const TWU_TITLE = "R-5.10 Team With Us opportunity nobody clears";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// Both helpers below agree a score of zero against a question whose minimum is one, so
// the finalising refusal is the one about having nobody to screen in.
async function swuWhereNoProponentClearsTheMinimum(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: SWU_TITLE, proposalDeadline: momentsFromNow() });
  await surface.opportunitySwuEdit.open({ title: SWU_TITLE });
  await surface.opportunitySwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: SWU_TITLE });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.opportunitySwuView.open({ title: SWU_TITLE });
  await surface.opportunitySwuView.startProposal();
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setScrumMaster({ member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "implementation", cost: 50000 });
  await surface.proposalSwuCreate.answerTeamQuestion({ question: QUESTION, answer: "A thin answer." });
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ title: SWU_TITLE });
      return surface.opportunitySwuView.status();
    }, { timeout: 20_000 })
    .toMatch(/evaluation/i);
  await surface.evaluationIndividualListSwu.open({ title: SWU_TITLE });
  const proponent = await surface.evaluationIndividualListSwu.anonymousProponentName();
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 0 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "Below the minimum." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ title: SWU_TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ title: SWU_TITLE });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateSwu.enterQuestionScore({ question: QUESTION, score: 0 });
  await surface.evaluationConsensusCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed it misses the minimum." });
  await surface.evaluationConsensusCreateSwu.saveDraft();
  await surface.evaluationConsensusListSwu.open({ title: SWU_TITLE });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.signOut();
}

async function twuWhereNoProponentClearsTheMinimum(surface: Surface) {
  const serviceArea = seed.organizations.qualified.service_areas[0];

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseTeamWithUs();
  await surface.opportunityTwuCreate.addResource({ serviceArea });
  await surface.opportunityTwuCreate.addResourceQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunityTwuCreate.saveDraft({ title: TWU_TITLE, proposalDeadline: momentsFromNow() });
  await surface.opportunityTwuEdit.open({ title: TWU_TITLE });
  await surface.opportunityTwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ title: TWU_TITLE });
  await surface.opportunityTwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.opportunityTwuView.open({ title: TWU_TITLE });
  await surface.opportunityTwuView.startProposal();
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({ serviceArea, member: seed.users.organizationMember });
  await surface.proposalTwuCreate.setHourlyRate({ serviceArea, rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({ question: QUESTION, answer: "A thin answer." });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await expect
    .poll(async () => {
      await surface.opportunityTwuView.open({ title: TWU_TITLE });
      return surface.opportunityTwuView.status();
    }, { timeout: 20_000 })
    .toMatch(/evaluation/i);
  await surface.evaluationIndividualListTwu.open({ title: TWU_TITLE });
  const proponent = await surface.evaluationIndividualListTwu.anonymousProponentName();
  await surface.evaluationIndividualListTwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateTwu.enterQuestionScore({ question: QUESTION, score: 0 });
  await surface.evaluationIndividualCreateTwu.enterQuestionNotes({ question: QUESTION, notes: "Below the minimum." });
  await surface.evaluationIndividualCreateTwu.saveDraft();
  await surface.evaluationIndividualListTwu.open({ title: TWU_TITLE });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListTwu.open({ title: TWU_TITLE });
  await surface.evaluationConsensusListTwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateTwu.enterQuestionScore({ question: QUESTION, score: 0 });
  await surface.evaluationConsensusCreateTwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed it misses the minimum." });
  await surface.evaluationConsensusCreateTwu.saveDraft();
  await surface.evaluationConsensusListTwu.open({ title: TWU_TITLE });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.signOut();
}

test("the refusal shown when no proponent clears every question's minimum score names the Code Challenge for Sprint With Us", async ({ surface }) => {
  await swuWhereNoProponentClearsTheMinimum(surface);

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListSwu.open({ title: SWU_TITLE });
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  expect(await surface.evaluationConsensusListSwu.noScreenableProponentError()).toContain("Code Challenge");
});

test("the refusal shown when no proponent clears every question's minimum score names the Challenge for Team With Us", async ({ surface }) => {
  await twuWhereNoProponentClearsTheMinimum(surface);

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListTwu.open({ title: TWU_TITLE });
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  const refusal = await surface.evaluationConsensusListTwu.noScreenableProponentError();
  expect(refusal).toContain("Challenge");
  expect(refusal).not.toContain("Code Challenge");
});
