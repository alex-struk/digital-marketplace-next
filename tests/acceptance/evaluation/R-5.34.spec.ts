// criterion: @R-5.34 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.34 Sprint With Us opportunity being evaluated";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

async function anOpportunityBeingEvaluated(surface: Surface) {
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
  await surface.signOut();
}

test("only an evaluator sees the evaluation instructions and the individual evaluation list", async ({ surface }) => {
  await anOpportunityBeingEvaluated(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationInstructionsSwu.open({ title: TITLE });
  expect(await surface.evaluationInstructionsSwu.instructionsBody()).toBeTruthy();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  expect(await surface.evaluationIndividualListSwu.proponentRow()).toBeTruthy();
  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.evaluationPanelTab()).toBeFalsy();
});

test("only the chair or the opportunity's owner or an administrator sees the consensus list", async ({ surface }) => {
  await anOpportunityBeingEvaluated(surface);

  await surface.signIn(persona.evaluationPanelChair);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.consensusTab()).toBeTruthy();
  expect(await surface.evaluationInstructionsSwu.visibleToEvaluatorsOnly()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.consensusTab()).toBeTruthy();
});

test("only the owner or an administrator sees the panel itself", async ({ surface }) => {
  await anOpportunityBeingEvaluated(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.evaluationPanelTab()).toBeTruthy();
  expect(await surface.opportunitySwuEdit.consensusTab()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelChair);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  expect(await surface.opportunitySwuEdit.evaluationPanelTab()).toBeFalsy();
});

test("an unrelated public sector employee is offered none of them", async ({ surface }) => {
  await anOpportunityBeingEvaluated(surface);

  await surface.signIn(persona.publicSectorStaffOther);
  await surface.opportunitySwuEdit.open({ title: TITLE });

  expect(await surface.opportunitySwuEdit.evaluationPanelTab()).toBeFalsy();
  expect(await surface.opportunitySwuEdit.consensusTab()).toBeFalsy();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  expect(await surface.evaluationIndividualListSwu.proponentRow()).toBeFalsy();
});
