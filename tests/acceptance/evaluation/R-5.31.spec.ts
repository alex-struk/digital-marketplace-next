// criterion: @R-5.31 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The catcher is emptied immediately before the chair submits the agreed scores, so what is
// found afterwards belongs to that submission and not to the closing of the opportunity or
// to the move into consensus.
//
// Two recipients are read: the opportunity's owner, who is the public sector employee the
// seed names as its creator, and the one administrator the target can sign in as. The
// second administrator in the seed is not read, because an announcement to a group is
// addressed to one person and blind-copies the rest, and a search by visible recipient
// cannot see a blind copy.

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

test("when the chair submits the consensus, the opportunity's owner and every administrator are told", async ({
  surface,
  mail,
}) => {
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

  await mail.clear();

  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.staffOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.administratorOne.email)).length, {
      timeout: 10000,
    })
    .toBeGreaterThan(0);
});
