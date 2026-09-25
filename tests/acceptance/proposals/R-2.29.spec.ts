// criterion: @R-2.29 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each program has a seeded opportunity of its own standing at consensus with every agreed
// score submitted, so finalising the agreed scores is all that is left to do:
//
//   - Sprint With Us, six proponents whose agreed question totals are 20, 18, 16, 14 and 12,
//     and 17 for the sixth, which falls below the fourth question's minimum;
//   - Team With Us, five proponents at 20, 18, 16 and 14, and 17 for the fifth, below the same
//     minimum.
//
// The panel chair (the administrator) finalises. Which proposals were carried on is read off
// each proposal's own history, which records the stage it moves into: the four highest in
// Sprint With Us and the three highest in Team With Us must reach the challenge, and every
// other must not. The proponent below the minimum outscores two that are carried on, so its
// being left behind is the minimum at work and not its rank; the one ranked just below the cut
// being left behind is the rank at work.

const statement =
  "After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.";

const settle = { timeout: 30000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuConsensusSixProponents.id;
  const carried = [
    seed.proposals.swuSixOne.id,
    seed.proposals.swuSixTwo.id,
    seed.proposals.swuSixThree.id,
    seed.proposals.swuSixFour.id,
  ];
  const belowTheCut = seed.proposals.swuSixFive.id;
  const belowTheMinimum = seed.proposals.swuSixSix.id;

  async function history(proposalId: string): Promise<string> {
    await surface.proposalSwuView.open({ opportunityId, proposalId });
    return (await readOrEmpty(() => surface.proposalSwuView.historyTab())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  for (const proposalId of carried) {
    await expect.poll(() => history(proposalId), settle).toMatch(/code challenge/);
  }
  expect(await history(belowTheCut), "the fifth-ranked proponent was carried on").not.toMatch(/challenge/);
  expect(await history(belowTheMinimum), "the proponent below a minimum was carried on").not.toMatch(
    /challenge/,
  );
});

test(`${statement} (Team With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.twuConsensusFiveProponents.id;
  const carried = [seed.proposals.twuFiveOne.id, seed.proposals.twuFiveTwo.id, seed.proposals.twuFiveThree.id];
  const belowTheCut = seed.proposals.twuFiveFour.id;
  const belowTheMinimum = seed.proposals.twuFiveFive.id;

  async function history(proposalId: string): Promise<string> {
    await surface.proposalTwuView.open({ opportunityId, proposalId });
    return (await readOrEmpty(() => surface.proposalTwuView.historyTab())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  for (const proposalId of carried) {
    await expect.poll(() => history(proposalId), settle).toMatch(/challenge/);
  }
  expect(await history(belowTheCut), "the fourth-ranked proponent was carried on").not.toMatch(/challenge/);
  expect(await history(belowTheMinimum), "the proponent below a minimum was carried on").not.toMatch(
    /challenge/,
  );
});
