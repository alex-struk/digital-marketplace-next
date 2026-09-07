// criterion: @R-5.28 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.28 Sprint With Us opportunity whose scores are being read";
const QUESTION = "Describe how your team would run the first sprint.";
const NOTES = "The plan is specific and the risks are named.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function anOpportunityInIndividualEvaluation(surface: Surface): Promise<string> {
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
  await surface.signOut();
  return proponent;
}

async function theEvaluatorScores(surface: Surface, proponent: string) {
  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: NOTES });
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

test("before an opportunity reaches consensus, no one but the evaluator who wrote them can read an evaluator's individual scores", async ({ surface }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);
  await theEvaluatorScores(surface, proponent);

  await surface.evaluationIndividualListSwu.open({ title: TITLE });

  expect(await surface.evaluationIndividualListSwu.ownEvaluationsOnly()).toBeTruthy();
});

test("once an opportunity reaches consensus, every member of its panel can read every evaluator's individual scores and comments for a proponent", async ({ surface }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);
  await theEvaluatorScores(surface, proponent);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });

  expect(await surface.evaluationConsensusCreateSwu.panelMemberScore()).toContain("4");
  expect(await surface.evaluationConsensusCreateSwu.panelMemberNotes()).toContain(NOTES);
});

test("a consensus may be read by an administrator at any stage", async ({ surface }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);
  await theEvaluatorScores(surface, proponent);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });
  await surface.evaluationConsensusListSwu.openProponentConsensus({ proponent });
  await surface.evaluationConsensusCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationConsensusCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "The panel agreed on four." });
  await surface.evaluationConsensusCreateSwu.saveDraft();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListSwu.open({ title: TITLE });

  expect(await surface.evaluationConsensusListSwu.proponentRow()).toContain(proponent);
  expect(await surface.evaluationConsensusListSwu.consensusStatus()).toBeTruthy();
});
