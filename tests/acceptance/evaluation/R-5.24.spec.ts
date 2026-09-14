// criterion: @R-5.24 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The evaluator is the public sector employee the seeded panel names as an evaluator, and
// the evaluation being changed is that person's own: the edit surface is addressed by the
// panel member's own account, which the seed carries.
//
// Submitting is the whole set for the opportunity, which is the only submission the surface
// offers, so the second test drafts one proponent's scores, submits, and then asks for that
// evaluation again. read_only_after_submitted is the observation written for exactly this.
//
// The clause about the opportunity's stage — that a draft can no longer be changed once the
// opportunity has moved to consensus — is not asserted separately. The opportunity moves to
// consensus only when every evaluator has submitted, and an evaluator who has submitted has
// nothing left in draft, so the two halves cannot be told apart from outside.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposalId = seed.proposals.sprintWithUsOne.id;
const userId = seed.users.staffOne.id;
const questions = [0, 1, 2, 3];

test("an evaluator may change their own evaluation while it is still a draft", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 3 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A first reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId, userId });
  await surface.evaluationIndividualEditSwu.enterQuestionScore({ order: 0, score: 5 });
  await surface.evaluationIndividualEditSwu.enterQuestionNotes({
    order: 0,
    notes: "On a second reading the answer is stronger than it first seemed.",
  });
  await surface.evaluationIndividualEditSwu.saveChanges();

  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeFalsy();
  expect(await surface.evaluationIndividualEditSwu.scoreOutOfRangeError()).toBeFalsy();
});

test("once submitted an evaluation cannot be changed at all", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId, userId });
  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeTruthy();
});
