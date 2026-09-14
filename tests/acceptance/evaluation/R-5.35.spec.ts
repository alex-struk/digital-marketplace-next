// criterion: @R-5.35 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The evaluator starts at the first row of the individual list rather than at a proponent
// named by the seed, because the order the criterion is about is the anonymous order the
// application writes when it closes the opportunity, and nothing outside the application
// knows which proposal that puts first. open_proponent_evaluation is the service's own link
// from the list to one proponent's form, so the row's place in the list is all a test needs.
//
// The order is read as a string and compared by where each name falls in it: the list
// reports the anonymous names of its rows, and a name that appears later in that report is
// a proponent that comes later in the list. That is what "in anonymous-proponent order"
// amounts to from outside.
//
// "Saving as they move" is read as the list's account of what has been evaluated changing
// after the move, since the create surface reports the proponent and the answers rather
// than the scores already recorded against them.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const questions = [0, 1, 2, 3];

test("an evaluator's scores are saved when they move to the next proponent", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  const before = await surface.evaluationIndividualListSwu.evaluationStatus();

  await surface.evaluationIndividualListSwu.openProponentEvaluation({ order: 0 });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveAndGoToNextProponent();

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  expect(await surface.evaluationIndividualListSwu.evaluationStatus()).not.toBe(before);
});

test("an evaluator works through the proponents in anonymous-proponent order", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  const listedInOrder = await surface.evaluationIndividualListSwu.anonymousProponentName();

  await surface.evaluationIndividualListSwu.openProponentEvaluation({ order: 0 });
  const first = await surface.evaluationIndividualCreateSwu.anonymousProponentName();
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveAndGoToNextProponent();
  const second = await surface.evaluationIndividualCreateSwu.anonymousProponentName();

  expect(listedInOrder).toContain(first);
  expect(listedInOrder.indexOf(second)).toBeGreaterThan(listedInOrder.indexOf(first));
});
