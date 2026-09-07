// criterion: @R-5.3 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.3 Sprint With Us opportunity in individual evaluation";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// The surface offers no action that closes an opportunity, so a test that needs a closed
// one gives it a deadline moments away and then reads the status back until the service
// has noticed the deadline has passed.
async function anOpportunityInIndividualEvaluation(surface: Surface) {
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
}

test("an evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one", async ({ surface }) => {
  await anOpportunityInIndividualEvaluation(surface);

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  const proponent = await surface.evaluationIndividualListSwu.anonymousProponentName();
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();

  await surface.evaluationIndividualCreateSwu.open({ title: TITLE, proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 2 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A second try." });
  await surface.evaluationIndividualCreateSwu.saveDraft();

  expect(await surface.evaluationIndividualCreateSwu.duplicateEvaluationError()).toContain(
    "You already have a team question evaluation for this proposal.",
  );
});
