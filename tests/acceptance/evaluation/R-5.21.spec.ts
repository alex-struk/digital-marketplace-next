// criterion: @R-5.21 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.21 Sprint With Us opportunity in individual question evaluation";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// The panel names one evaluator and a separate chair; the owner is on neither.
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

test("a person marked as an evaluator on the panel may record an individual evaluation while the opportunity is in individual question evaluation", async ({ surface }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  expect(await surface.evaluationIndividualListSwu.evaluationStatus()).toMatch(/draft/i);
});

test("the chair who is not an evaluator may not record an individual evaluation", async ({ surface }) => {
  await anOpportunityInIndividualEvaluation(surface);

  await surface.signIn(persona.evaluationPanelChair);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });

  expect(await surface.evaluationIndividualListSwu.proponentRow()).toBeFalsy();
});

test("the opportunity's owner who is not on the panel may not record an individual evaluation", async ({ surface }) => {
  await anOpportunityInIndividualEvaluation(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });

  expect(await surface.evaluationIndividualListSwu.proponentRow()).toBeFalsy();
});
