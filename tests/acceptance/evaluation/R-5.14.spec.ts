// criterion: @R-5.14 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The person who finalises here is the opportunity's owner: the seed names the ordinary
// public sector employee as the creator of the seeded Sprint With Us opportunity, and that
// same person is not an administrator. The administrator half of the criterion is the
// behaviour that already stood, and it cannot be shown on the same opportunity anyway,
// because finalising happens once and ends the stage.
//
// Being offered the action is read as being able to take it: the confirmation the service
// puts in front of finalising is the first thing an offered action produces, and the stage
// the opportunity lands in afterwards is the service accepting it. A browser that withheld
// the action would leave the owner with nothing to take and no confirmation to read.
//
// Every agreed score is five out of five, which clears the minimum the fourth question
// carries, so nothing but the identity of the person finalising is in question here.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
}

test("the action that finalises consensus scores is offered to the opportunity's owner", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateSwu.saveDraft();
  }

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();

  expect(await surface.evaluationConsensusListSwu.finalizeConfirmationModal()).toBeTruthy();

  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  await surface.opportunitySwuView.open({ opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("challenge");
});
