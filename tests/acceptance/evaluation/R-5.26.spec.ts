// criterion: @R-5.26 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The evaluator is users.staffOne (persona.publicSectorStaff), an evaluator on the seeded closed
// Sprint With Us opportunity. Their one complete draft is made through the form: an in-range
// score and a comment for each of the four questions of the first seeded proponent, saved as a
// draft. That it is a draft is read back from the service before anything is sent.
//
// The request to submit that evaluation by itself is made through
// evaluation-individual-request-swu, since no screen sends it. It must be answered as
// unrecognised, and the evaluation must still read as it did before.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposalId = seed.proposals.sprintWithUsOne.id;
const evaluator = seed.users.staffOne;
const settle = { timeout: 15000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("A request to submit one evaluation on its own is refused; submission is only accepted as the whole set for the opportunity", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  for (const order of [0, 1, 2, 3]) {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order, notes: "A complete reading of this answer." });
  }
  await surface.evaluationIndividualCreateSwu.saveDraft();

  const request = surface.evaluationIndividualRequestSwu;
  await request.open({ proposalId, userId: evaluator.id });
  await expect.poll(() => readOrEmpty(() => request.evaluationStatus()), settle).toBeTruthy();
  const asDraft = await request.evaluationStatus();

  try {
    await request.submitThisEvaluationAlone();
  } catch {
    // Read below whether the service answered it as unrecognised.
  }
  await expect.poll(() => readOrEmpty(() => request.refusedAsUnrecognised()), settle).toBeTruthy();

  await request.open({ proposalId, userId: evaluator.id });
  expect(await readOrEmpty(() => request.evaluationStatus())).toBe(asDraft);
});
