// criterion: @R-5.16 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.16 Sprint With Us opportunity whose panel keeps changing";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function aDraftWithAPanel(surface: Surface) {
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
}

async function carryItIntoIndividualEvaluation(surface: Surface): Promise<string> {
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
  await surface.signOut();
  return proponent;
}

test("the evaluation panel may be set while an opportunity is a draft", async ({ surface }) => {
  await aDraftWithAPanel(surface);

  await surface.evaluationPanelSwu.open({ title: TITLE });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  await surface.evaluationPanelSwu.open({ title: TITLE });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toContain(seed.users.administratorOne.email);
});

test("the evaluation panel may be changed while an opportunity is in individual question evaluation", async ({ surface }) => {
  await aDraftWithAPanel(surface);
  await carryItIntoIndividualEvaluation(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ title: TITLE });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  await surface.evaluationPanelSwu.open({ title: TITLE });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toContain(seed.users.administratorOne.email);
  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();
});

test("the evaluation panel is fixed from the consensus stage onwards", async ({ surface }) => {
  await aDraftWithAPanel(surface);
  const proponent = await carryItIntoIndividualEvaluation(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuView.open({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).toMatch(/consensus/i);

  await surface.evaluationPanelSwu.open({ title: TITLE });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.administratorOne });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeTruthy();
  await surface.evaluationPanelSwu.open({ title: TITLE });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).not.toContain(seed.users.administratorOne.email);
});
