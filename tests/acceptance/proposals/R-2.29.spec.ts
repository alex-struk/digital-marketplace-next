// criterion: @R-2.29 v1
// provenance: blind, spec@7eb305e85acb5a44b285f09b9800da3c65c6a355, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";

// Each program has a seeded opportunity of its own standing at consensus with every agreed
// score submitted, so finalising the agreed scores is all that is left to do:
//
//   - Sprint With Us, six proponents whose agreed question totals are 20, 18, 16, 14 and 12,
//     and 17 for the sixth, which falls below a question's minimum;
//   - Team With Us, five proponents at 20, 18, 16 and 14, and 17 for the fifth, below a
//     question's minimum.
//
// The panel chair (the administrator) finalises. Whether a proposal was carried into the next
// stage is read off its own history, without depending on the words used for that stage: each
// proposal's history is read before and after finalising, and what finalising added to it is
// compared across proposals. The proposals that should be carried (the four highest in Sprint
// With Us, the three highest in Team With Us) must all have gained a common entry that no
// proposal left behind gained — the move into the next stage — and no proposal left behind may
// carry it. The proponent below the minimum outscores two that are carried on, so its being
// left behind is the minimum at work and not its rank; the one ranked just below the cut being
// left behind is the rank at work.

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

// A history as a list of entries, with times and dates reduced to their shape so that the same
// kind of entry recorded against different proposals reads the same.
function entries(history: string): string[] {
  return history
    .split(/\r?\n/)
    .map((line) => line.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

// What finalising added: the entries after, less the entries that were already there.
function added(before: string[], after: string[]): string[] {
  const remaining = new Map<string, number>();
  for (const line of before) remaining.set(line, (remaining.get(line) ?? 0) + 1);
  const fresh: string[] = [];
  for (const line of after) {
    const left = remaining.get(line) ?? 0;
    if (left > 0) remaining.set(line, left - 1);
    else fresh.push(line);
  }
  return fresh;
}

async function checkCarriedOn(
  readHistory: (proposalId: string) => Promise<string>,
  finalise: () => Promise<void>,
  carried: string[],
  leftBehind: { proposalId: string; why: string }[],
): Promise<void> {
  const everyone = [...carried, ...leftBehind.map((p) => p.proposalId)];
  const before = new Map<string, string[]>();
  for (const proposalId of everyone) before.set(proposalId, entries(await readHistory(proposalId)));

  await finalise();

  // Every proposal carried on records something new once finalising has taken effect.
  const gained = new Map<string, string[]>();
  for (const proposalId of carried) {
    await expect
      .poll(async () => added(before.get(proposalId)!, entries(await readHistory(proposalId))).length, {
        ...settle,
        message: `proposal ${proposalId} recorded no move after finalising`,
      })
      .toBeGreaterThan(0);
    gained.set(proposalId, added(before.get(proposalId)!, entries(await readHistory(proposalId))));
  }
  for (const { proposalId } of leftBehind) {
    gained.set(proposalId, added(before.get(proposalId)!, entries(await readHistory(proposalId))));
  }

  // The move into the next stage: what every carried proposal gained and no proposal left
  // behind did.
  const sharedByCarried = [...new Set(gained.get(carried[0])!)].filter((line) =>
    carried.every((proposalId) => gained.get(proposalId)!.includes(line)),
  );
  const gainedByLeftBehind = new Set(leftBehind.flatMap(({ proposalId }) => gained.get(proposalId)!));
  const intoNextStage = sharedByCarried.filter((line) => !gainedByLeftBehind.has(line));

  expect(
    intoNextStage,
    "the highest-ranked proposals meeting every minimum did not all enter a new stage that the others did not",
  ).not.toEqual([]);

  for (const { proposalId, why } of leftBehind) {
    const moved = intoNextStage.filter((line) => gained.get(proposalId)!.includes(line));
    expect(moved, why).toEqual([]);
  }
}

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuConsensusSixProponents.id;

  async function readHistory(proposalId: string): Promise<string> {
    await surface.proposalSwuView.open({ opportunityId, proposalId });
    return readOrEmpty(() => surface.proposalSwuView.historyTab());
  }

  await surface.signIn(persona.administrator);
  await checkCarriedOn(
    readHistory,
    async () => {
      await surface.evaluationConsensusListSwu.open({ opportunityId });
      await surface.evaluationConsensusListSwu.finalizeConsensusScores();
      await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
    },
    [
      seed.proposals.swuSixOne.id,
      seed.proposals.swuSixTwo.id,
      seed.proposals.swuSixThree.id,
      seed.proposals.swuSixFour.id,
    ],
    [
      { proposalId: seed.proposals.swuSixFive.id, why: "the fifth-ranked proponent was carried on" },
      { proposalId: seed.proposals.swuSixSix.id, why: "the proponent below a minimum was carried on" },
    ],
  );
});

test(`${statement} (Team With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.twuConsensusFiveProponents.id;

  async function readHistory(proposalId: string): Promise<string> {
    await surface.proposalTwuView.open({ opportunityId, proposalId });
    return readOrEmpty(() => surface.proposalTwuView.historyTab());
  }

  await surface.signIn(persona.administrator);
  await checkCarriedOn(
    readHistory,
    async () => {
      await surface.evaluationConsensusListTwu.open({ opportunityId });
      await surface.evaluationConsensusListTwu.finalizeConsensusScores();
      await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();
    },
    [seed.proposals.twuFiveOne.id, seed.proposals.twuFiveTwo.id, seed.proposals.twuFiveThree.id],
    [
      { proposalId: seed.proposals.twuFiveFour.id, why: "the fourth-ranked proponent was carried on" },
      { proposalId: seed.proposals.twuFiveFive.id, why: "the proponent below a minimum was carried on" },
    ],
  );
});
