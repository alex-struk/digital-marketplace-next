// criterion: @R-5.25 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Two tests for the two halves of the criterion. The first holds three drafts of which one
// is short of a score and a comment for the last question, and asks for the whole set; the
// refusal is read from incomplete_evaluation_error, which must carry the sentence the
// criterion quotes, and "none of it submitted" is read from the complete evaluations still
// being editable afterwards, since read_only_after_submitted is what a submitted evaluation
// reports.
//
// The second holds two complete drafts and never opens the third proponent at all, and the
// submission goes through: the two are submitted and the proponent nobody opened is simply
// absent. That is the half of the criterion that distinguishes it from its first version.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const userId = seed.users.staffOne.id;
const questions = [0, 1, 2, 3];
const refusal =
  "This evaluation could not be submitted for review because it is incomplete. " +
  "Please edit, complete and save the appropriate form before trying to submit it again.";

async function draft(surface: Surface, proposalId: string, upTo: number): Promise<void> {
  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions.slice(0, upTo)) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

test("the whole set is refused, none of it submitted, unless every evaluation in it is complete", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await draft(surface, seed.proposals.sprintWithUsOne.id, 4);
  await draft(surface, seed.proposals.sprintWithUsTwo.id, 4);
  await draft(surface, seed.proposals.sprintWithUsThree.id, 3);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  expect(await surface.evaluationIndividualListSwu.incompleteEvaluationError()).toContain(refusal);

  await surface.evaluationIndividualEditSwu.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsOne.id,
    userId,
  });
  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeFalsy();
});

test("a proponent the evaluator never opened is absent from the set rather than blocking it", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await draft(surface, seed.proposals.sprintWithUsOne.id, 4);
  await draft(surface, seed.proposals.sprintWithUsTwo.id, 4);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  expect(await surface.evaluationIndividualListSwu.incompleteEvaluationError()).toBeFalsy();

  await surface.evaluationIndividualEditSwu.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsOne.id,
    userId,
  });
  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeTruthy();
});
