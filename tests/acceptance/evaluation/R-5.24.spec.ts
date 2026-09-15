// criterion: @R-5.24 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The evaluator is users.staffOne, who sits on the seeded Sprint With Us panel as an
// evaluator and is reached through persona.publicSectorStaff; the evaluation changed is that
// person's own, since the edit surface is addressed by the panel member's own account.
//
// Submission is only ever the whole set for the opportunity, and is withheld until every
// proponent carries a complete evaluation, so the submitted test scores all three seeded
// proponents on all four questions before submitting. That the submission took effect is
// established before any change is tried: the list must be offering nothing incomplete, and
// its evaluation status must have moved on from what it read while the three were drafts.
//
// The change is then refused if it cannot be made — the fields or the save are withheld,
// and bounded actions fail rather than wait — or if the page reports the evaluation as read
// only; "the submitted scores stand" is read as the evaluation still reading as submitted
// when it is opened again. No observation returns an individual score before consensus, so
// the numbers themselves cannot be compared.
//
// The clause about the opportunity's stage — a draft no longer changeable once consensus has
// begun — is not asserted on its own: consensus begins only when every evaluator has
// submitted every proponent, and then the evaluator has no draft left to change.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const userId = seed.users.staffOne.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];
const settle = { timeout: 15000 };

async function completeDraft(surface: Surface, proposalId: string, score: number): Promise<void> {
  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
      order,
      notes: "A complete reading of this answer.",
    });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

async function readOrNothing(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

test("An evaluator may change their own evaluation while it is still a draft and the opportunity is still in individual question evaluation", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await completeDraft(surface, proposals[0], 3);

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId: proposals[0], userId });
  expect(await readOrNothing(() => surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted())).toBeFalsy();
  await surface.evaluationIndividualEditSwu.enterQuestionScore({ order: 0, score: 5 });
  await surface.evaluationIndividualEditSwu.enterQuestionNotes({
    order: 0,
    notes: "On a second reading the answer is stronger than it first seemed.",
  });
  await surface.evaluationIndividualEditSwu.saveChanges();

  expect(await readOrNothing(() => surface.evaluationIndividualEditSwu.scoreOutOfRangeError())).toBeFalsy();
  expect(await readOrNothing(() => surface.evaluationIndividualEditSwu.emptyNotesError())).toBeFalsy();
});

test("Once submitted an evaluation cannot be changed at all", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  for (const proposalId of proposals) {
    await completeDraft(surface, proposalId, 4);
  }

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  const whileDrafts = await surface.evaluationIndividualListSwu.evaluationStatus();
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  expect(await readOrNothing(() => surface.evaluationIndividualListSwu.incompleteEvaluationError())).toBeFalsy();
  await expect
    .poll(async () => {
      await surface.evaluationIndividualListSwu.open({ opportunityId });
      return surface.evaluationIndividualListSwu.evaluationStatus();
    }, settle)
    .not.toBe(whileDrafts);

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId: proposals[0], userId });
  const submitted = await surface.evaluationIndividualEditSwu.evaluationStatus();

  let changeWithheld = false;
  try {
    await surface.evaluationIndividualEditSwu.enterQuestionScore({ order: 0, score: 1 });
    await surface.evaluationIndividualEditSwu.enterQuestionNotes({
      order: 0,
      notes: "An attempt to lower a score already submitted.",
    });
    await surface.evaluationIndividualEditSwu.saveChanges();
  } catch {
    changeWithheld = true;
  }
  const reportedReadOnly = Boolean(
    await readOrNothing(() => surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()),
  );
  expect(changeWithheld || reportedReadOnly).toBe(true);

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId: proposals[0], userId });
  expect(await surface.evaluationIndividualEditSwu.evaluationStatus()).toBe(submitted);
  expect(await surface.evaluationIndividualEditSwu.readOnlyAfterSubmitted()).toBeTruthy();
});
