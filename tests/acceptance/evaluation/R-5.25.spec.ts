// criterion: @R-5.25 v3
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given as stated: the evaluator — users.staffOne, on the seeded Sprint With Us panel,
// reached through persona.publicSectorStaff — holds complete drafts for two of the three
// seeded proponents and has not started the third. Two tests follow the two claims of the
// first sentence, and a third shows submission is offered once every proponent is complete,
// so that "not offered" above it is read against a submission that can be.
//
// "Nothing is submitted" is read as the list's evaluation status being what it was before
// the attempt, and the complete evaluations still not reporting themselves read only. The
// attempt itself is made: a withheld control fails its bounded action rather than waiting.
//
// The second sentence — the service's own refusal of a set containing an incomplete
// evaluation, with the quoted message, submitting none of it — is not reached here. Every
// submission the surface offers goes through the list's submit control, which the first
// sentence says is withheld whenever the set is incomplete, so an incomplete set never gets
// as far as the service and incomplete_evaluation_error has nothing to report. That half
// needs an action on evaluation-individual-list that sends the set for consensus without
// the form's withholding, as file-upload does for requests no form would send.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const userId = seed.users.staffOne.id;
const questions = [0, 1, 2, 3];
const settle = { timeout: 15000 };

const statement =
  "An evaluator can submit their scores for consensus only once they hold a complete evaluation, an in-range score and a comment for every question, for every proponent of the opportunity; until then submission is not offered and nothing is submitted.";

async function completeDraft(surface: Surface, proposalId: string): Promise<void> {
  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

async function twoOfThreeComplete(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);
  await completeDraft(surface, seed.proposals.sprintWithUsOne.id);
  await completeDraft(surface, seed.proposals.sprintWithUsTwo.id);
}

async function readOrNothing(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

test(`${statement} (with complete evaluations for two of three proponents, submission is not offered)`, async ({
  surface,
}) => {
  await twoOfThreeComplete(surface);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await expect
    .poll(() => readOrNothing(() => surface.evaluationIndividualListSwu.submitDisabledUntilComplete()), settle)
    .toBeTruthy();
});

test(`${statement} (with complete evaluations for two of three proponents, nothing is submitted)`, async ({
  surface,
}) => {
  await twoOfThreeComplete(surface);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  const before = await surface.evaluationIndividualListSwu.evaluationStatus();
  try {
    await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  } catch {
    // Not offered, which is what the criterion says; what matters is what was recorded.
  }

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  expect(await surface.evaluationIndividualListSwu.evaluationStatus()).toBe(before);

  for (const proposalId of [seed.proposals.sprintWithUsOne.id, seed.proposals.sprintWithUsTwo.id]) {
    await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId, userId });
    expect(await readOrNothing(() => surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted())).toBeFalsy();
  }
});

test(`${statement} (once every proponent is complete, submission is offered and goes through)`, async ({
  surface,
}) => {
  await twoOfThreeComplete(surface);
  await completeDraft(surface, seed.proposals.sprintWithUsThree.id);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await expect
    .poll(() => readOrNothing(() => surface.evaluationIndividualListSwu.submitDisabledUntilComplete()), settle)
    .toBeFalsy();
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  expect(await readOrNothing(() => surface.evaluationIndividualListSwu.incompleteEvaluationError())).toBeFalsy();

  await surface.evaluationIndividualEditSwu.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsOne.id,
    userId,
  });
  await expect
    .poll(() => readOrNothing(() => surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()), settle)
    .toBeTruthy();
});
