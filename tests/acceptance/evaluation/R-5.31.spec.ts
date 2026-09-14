// criterion: @R-5.31 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The catcher is emptied immediately before the chair submits the agreed scores, so what is
// found afterwards belongs to that submission and not to the closing of the opportunity or
// to the move into consensus.
//
// The people the criterion says are told are the opportunity's owner, who is the public
// sector employee the seed names as its creator, and both administrators the seed holds.
// Who was told is read by visible recipient, which is the only read mail offers, and
// observables.yaml says a message is addressed to one person with every other recipient a
// blind copy. A notice to all three is therefore found under one of their addresses and not
// the others. The test asserts that the notice arrived addressed to one of the three; that
// it reached every one of them is the blind-copy list, which mail cannot read; it needs a
// mail call over read_one_message.

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

  const ownerAndAdministrators = [
    seed.users.staffOne.email,
    seed.users.administratorOne.email,
    seed.users.administratorTwo.email,
  ];
  await expect
    .poll(
      async () =>
        (await Promise.all(ownerAndAdministrators.map((address) => mail.messagesTo(address)))).flat()
          .length,
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
});
