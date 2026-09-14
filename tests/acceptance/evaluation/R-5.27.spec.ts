// criterion: @R-5.27 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded Sprint With Us opportunity carries two evaluators, three proponents and four
// questions, which is the shape the criterion describes. Both evaluators score every
// proponent and submit, and the second submission is the one that completes the count; the
// catcher is emptied just before it so that everything found afterwards belongs to it.
//
// The two evaluators are the two public sector accounts the seeded panel names: the
// ordinary staff sign-in, who is also the opportunity's owner, and the administrator, who
// is also the chair. That doubling is the target's and not the rule's, and it means the two
// people the criterion says are told are the same two who did the scoring.
//
// The move itself is read from the opportunity's status naming consensus. The counting rule
// the criterion states — one score per question per proponent per evaluator, taken against
// the most recent version's panel — cannot be varied from outside: a test can complete the
// count or leave it short, and leaving it short is R-5.25's subject.
//
// Who was told is read by visible recipient, which is the only read mail offers, and
// observables.yaml says a message is addressed to one person with every other recipient a
// blind copy. A notice to the chair and the owner is therefore found under one of their
// addresses and not necessarily the other. The test asserts that the notice arrived
// addressed to one of the two; that it reached both is the blind-copy list, which mail
// cannot read; it needs a mail call over read_one_message.

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
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
}

test("an opportunity moves to consensus once every evaluator has submitted, and the chair and the owner are told", async ({
  surface,
  mail,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  await mail.clear();
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await surface.opportunitySwuView.open({ opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("consensus");

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email];
  await expect
    .poll(
      async () =>
        (await Promise.all(chairAndOwner.map((address) => mail.messagesTo(address)))).flat().length,
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
});
