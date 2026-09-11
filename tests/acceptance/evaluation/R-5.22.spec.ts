// criterion: @R-5.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// Every question of the seeded Sprint With Us opportunity is worth five points, which is
// what tests/seed records, so six is above the maximum for any of the four and the
// criterion's own example can be used as it is written. A score of one and two hundred and
// thirty-four thousandths is inside the range and wrong only in carrying three decimal
// places, so it separates that rule from the range rule.
//
// The surface reports a rejected score in one way only — score_out_of_range_error — so the
// too-precise score is read from that same observation. What a test can say is that the
// entry was refused, not which of the two rules the refusal named.
//
// The last clause of the then — that the evaluation cannot be submitted until every question
// carries a score and a comment — is read from the individual list, which is where the one
// submission the surface offers lives. R-5.25 is the criterion about that submission.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposalId = seed.proposals.sprintWithUsOne.id;

test("a score above the question's maximum is rejected", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 6 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });

  expect(await surface.evaluationIndividualCreateSwu.scoreOutOfRangeError()).toBeTruthy();
});

test("a score with three decimal places is rejected", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 1.234 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });

  expect(await surface.evaluationIndividualCreateSwu.scoreOutOfRangeError()).toBeTruthy();
});

test("an empty comment is rejected and the evaluation cannot be submitted", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "" });

  expect(await surface.evaluationIndividualCreateSwu.emptyNotesError()).toBeTruthy();

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  expect(await surface.evaluationIndividualListSwu.submitDisabledUntilComplete()).toBeTruthy();
});
