// criterion: @R-5.23 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The evaluator is users.staffOne (persona.publicSectorStaff), an evaluator on the seeded closed
// Sprint With Us opportunity, whose four questions are each scored out of five. The browser
// form checks each field as it is typed, so the draft the criterion describes — one score of
// six and one empty comment — is saved through evaluation-individual-request-swu, which sends
// the scores and comments exactly as given.
//
// "Saved as entered" is read back from the service: the stored scores carry the six, and the
// evaluation reads as it did straight after saving. The other two proponents are given complete,
// in-range evaluations through the form first, so that when the whole set is submitted the only
// thing wrong with it is the draft saved here. The submission is refused if the list withholds
// it or reports an incomplete evaluation, or if the service reports a refusal at submission;
// the draft must also still read as it did before.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const evaluator = seed.users.staffOne;
const draft = seed.proposals.sprintWithUsOne.id;
const others = [seed.proposals.sprintWithUsTwo.id, seed.proposals.sprintWithUsThree.id];
const questions = [0, 1, 2, 3];
const settle = { timeout: 15000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function completeThroughTheForm(surface: Surface, proposalId: string): Promise<void> {
  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order, notes: "A complete reading of this answer." });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();
}

test("Scores and comments are checked when an evaluation is submitted, not when it is saved as a draft", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  for (const proposalId of others) await completeThroughTheForm(surface, proposalId);

  const request = surface.evaluationIndividualRequestSwu;
  await request.open({ proposalId: draft, userId: evaluator.id });
  await request.saveDraftAsEntered({
    questions: [
      { order: 0, score: 6, notes: "Scored above the question's maximum." },
      { order: 1, score: 3, notes: "" },
      { order: 2, score: 3, notes: "A fair answer." },
      { order: 3, score: 3, notes: "A fair answer." },
    ],
  });

  await request.open({ proposalId: draft, userId: evaluator.id });
  await expect.poll(() => readOrEmpty(() => request.storedScores()), settle).toMatch(/\b6(\.0+)?\b/);
  const asSaved = await readOrEmpty(() => request.evaluationStatus());
  expect(asSaved).toBeTruthy();
  expect(await readOrEmpty(() => request.refusedAtSubmission())).toBeFalsy();

  let withheld = false;
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  try {
    await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  } catch {
    withheld = true;
  }
  const reportedIncomplete = Boolean(
    await readOrEmpty(() => surface.evaluationIndividualListSwu.incompleteEvaluationError()),
  );

  await request.open({ proposalId: draft, userId: evaluator.id });
  const refusedByService = Boolean(await readOrEmpty(() => request.refusedAtSubmission()));
  expect(withheld || reportedIncomplete || refusedByService).toBe(true);
  expect(await readOrEmpty(() => request.evaluationStatus())).toBe(asSaved);
});
