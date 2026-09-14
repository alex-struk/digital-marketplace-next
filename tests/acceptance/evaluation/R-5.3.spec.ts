// criterion: @R-5.3 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The starting point is the seeded Sprint With Us opportunity, whose proposal deadline is
// already thirty days gone. Requesting the transition trigger first makes the application
// close it, which is what puts it into individual question evaluation with three proponents
// to score; the test then acts as the panel's evaluator, who on the seeded panel is the
// same public sector employee the ordinary staff sign-in mints.
//
// The second attempt is a second run at the create form for the proponent already scored,
// which is the only way the surface offers to start an evaluation. The refusal is read from
// duplicate_evaluation_error, the observation written for this rule; the sentence it must
// carry is not asserted, because the criterion quotes the service's own wording for the
// Sprint With Us case and the same observation serves both programs.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposalId = seed.proposals.sprintWithUsOne.id;
const questions = [0, 1, 2, 3];

test("an evaluator holds at most one evaluation per proponent, and a second attempt is refused", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "The proponent answered this question in full.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 3 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A second reading of the same answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();

  expect(await surface.evaluationIndividualCreateSwu.duplicateEvaluationError()).toBeTruthy();
});
