// criterion: @R-5.33 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every agreed score is five out of five, which clears the minimum the seeded fourth
// question carries, so finalising is accepted and the messages the criterion is about are
// the only thing left to read. The catcher is emptied after the agreed scores are submitted
// and before they are finalised, so the messages found afterwards are the finalising ones
// and not the submission ones R-5.31 is about.
//
// The two recipients are the chair, who on the seeded panel is the one administrator the
// target can sign in as, and the opportunity's owner, who is the public sector employee the
// seed names as its creator.
//
// Who was told is read by visible recipient, which is the only read mail offers, and
// observables.yaml says a message is addressed to one person with every other recipient a
// blind copy. A notice to the chair and the owner is therefore found under one of their
// addresses and not necessarily the other. The test asserts that the notice arrived
// addressed to one of the two; that it reached both is the blind-copy list, which mail
// cannot read; it needs a mail call over read_one_message.

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
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 5 });
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

test("when the consensus scores are finalised, the chair and the opportunity's owner are told", async ({
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
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 5 });
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

  await mail.clear();

  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email];
  await expect
    .poll(
      async () =>
        (await Promise.all(chairAndOwner.map((address) => mail.messagesTo(address)))).flat().length,
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
});
