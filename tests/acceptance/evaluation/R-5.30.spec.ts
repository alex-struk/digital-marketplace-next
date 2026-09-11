// criterion: @R-5.30 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One test, because the given — a consensus the chair has already submitted on an
// opportunity still in consensus — is built by a walk that spends the seeded Team With Us
// opportunity, and the criterion states a single given, when and then.
//
// editable_after_submitted is read on the consensus the chair has already submitted, the
// score is changed, and the agreed scores are submitted a second time. The comparison the
// criterion draws with an individual evaluation is left to R-5.24, which is the criterion
// about that.
//
// "until it is finalised" is not asserted from the other side: finalising ends the
// consensus stage and moves the opportunity on, so a test that finalised here would be
// testing R-5.32 rather than this.

const opportunityId = seed.opportunities.closedTeamWithUs.id;
const proposals = [
  seed.proposals.teamWithUsOne.id,
  seed.proposals.teamWithUsTwo.id,
  seed.proposals.teamWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityId });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
}

test("the chair may reopen and resubmit a consensus until it is finalised", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }

  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();

  await surface.evaluationConsensusEditTwu.open({
    opportunityId,
    proposalId: seed.proposals.teamWithUsOne.id,
    userId: seed.users.administratorOne.id,
  });
  expect(await surface.evaluationConsensusEditTwu.editableAfterSubmitted()).toBeTruthy();

  await surface.evaluationConsensusEditTwu.enterQuestionScore({ order: 0, score: 5 });
  await surface.evaluationConsensusEditTwu.enterQuestionNotes({
    order: 0,
    notes: "The panel talked again and agreed a higher score for this answer.",
  });
  await surface.evaluationConsensusEditTwu.saveChanges();

  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();

  await surface.evaluationConsensusEditTwu.open({
    opportunityId,
    proposalId: seed.proposals.teamWithUsOne.id,
    userId: seed.users.administratorOne.id,
  });
  expect(await surface.evaluationConsensusEditTwu.editableAfterSubmitted()).toBeTruthy();
});
