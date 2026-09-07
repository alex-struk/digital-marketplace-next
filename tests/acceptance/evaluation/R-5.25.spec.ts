// criterion: @R-5.25 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.25 Sprint With Us opportunity with two questions";
const FIRST_QUESTION = "Describe how your team would run the first sprint.";
const SECOND_QUESTION = "Describe how your team handles a missed deadline.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// Two questions, so that an evaluation can be a draft that answers one of them and is
// therefore incomplete without any entry having been rejected as it was typed.
async function anEvaluatorWithAnIncompleteDraft(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: FIRST_QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: SECOND_QUESTION, maximumScore: 5, minimumScore: 1 });
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
  await surface.proposalSwuCreate.answerTeamQuestion({ question: FIRST_QUESTION, answer: "We start with a discovery sprint." });
  await surface.proposalSwuCreate.answerTeamQuestion({ question: SECOND_QUESTION, answer: "We re-plan together." });
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
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: FIRST_QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: FIRST_QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

test("an evaluator submits all of their existing draft evaluations for an opportunity in a single action, and the whole set is refused unless every evaluation in the set carries an in-range score and a comment for every question of the opportunity", async ({ surface }) => {
  await anEvaluatorWithAnIncompleteDraft(surface);

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  expect(await surface.evaluationIndividualListSwu.incompleteEvaluationError()).toContain(
    "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again.",
  );
});

test("none of the set is submitted when the set is refused", async ({ surface }) => {
  await anEvaluatorWithAnIncompleteDraft(surface);

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  expect(await surface.evaluationIndividualListSwu.evaluationStatus()).toMatch(/draft/i);
  await surface.opportunitySwuView.open({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).not.toMatch(/consensus/i);
});
