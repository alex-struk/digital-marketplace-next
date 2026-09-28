// criterion: @R-5.32 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each program has a seeded opportunity standing at consensus with every agreed score
// submitted, so finalising is all that is left to do:
//
//   - Sprint With Us, six proponents whose agreed question totals are 20, 18, 16, 14 and 12,
//     and 17 for the sixth, which falls below the fourth question's minimum — five met every
//     minimum, and at most four may be screened in;
//   - Team With Us, five proponents at 20, 18, 16 and 14, and 17 for the fifth, below the
//     minimum — four met every minimum, and at most three may be screened in.
//
// The chair, who is the administrator, finalises from the consensus list.
//
// Screening is read from each proposal's own history, which is where a proposal's move into
// a stage is recorded, and never from the vendor's own view of their proposal, which does not
// name the stage. Each proposal's history is read before and after finalising and what
// finalising added is compared across proposals, without depending on the words used for the
// stage: the proposals that should be screened in must all have gained a common entry that
// no proposal left behind gained, and no proposal left behind may carry it. The proponent
// below the minimum outscores ones that are screened in, so its being left behind is the
// minimum at work; the lowest one that met every minimum being left behind is the ceiling at
// work.
//
// The agreed scores being recorded against each proponent is read as the questions score each
// proposal carries once finalised, and those scores must stand in the order of the agreed
// totals. That the history records them question by question is not asserted: no observation
// reads a proposal's history entry by entry with its scores. The entry for this criterion in
// not-testable.yaml keeps that clause owed.
//
// The move to the next stage is read as the opportunity's status changing, and naming the
// challenge — the code challenge for Sprint With Us and the challenge for Team With Us.

const statement =
  "Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.";

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

function firstNumber(text: string): number {
  const match = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

interface Program {
  name: string;
  opportunityId: string;
  // Every proponent, highest agreed total first, with the one below a minimum where its total
  // places it.
  byAgreedTotal: string[];
  screenedIn: string[];
  leftBehind: { proposalId: string; why: string }[];
  readHistory: (surface: Surface, proposalId: string) => Promise<string>;
  readQuestionsScore: (surface: Surface, proposalId: string) => Promise<string>;
  readOpportunityStatus: (surface: Surface) => Promise<string>;
  finalise: (surface: Surface) => Promise<void>;
}

const swu = seed.opportunities.swuConsensusSixProponents.id;
const twu = seed.opportunities.twuConsensusFiveProponents.id;

const programs: Program[] = [
  {
    name: "Sprint With Us",
    opportunityId: swu,
    byAgreedTotal: [
      seed.proposals.swuSixOne.id,
      seed.proposals.swuSixTwo.id,
      seed.proposals.swuSixSix.id,
      seed.proposals.swuSixThree.id,
      seed.proposals.swuSixFour.id,
      seed.proposals.swuSixFive.id,
    ],
    screenedIn: [
      seed.proposals.swuSixOne.id,
      seed.proposals.swuSixTwo.id,
      seed.proposals.swuSixThree.id,
      seed.proposals.swuSixFour.id,
    ],
    leftBehind: [
      { proposalId: seed.proposals.swuSixFive.id, why: "a fifth proponent was screened in" },
      { proposalId: seed.proposals.swuSixSix.id, why: "the proponent below a minimum was screened in" },
    ],
    readHistory: async (surface, proposalId) => {
      await surface.proposalSwuView.open({ opportunityId: swu, proposalId });
      return readOrEmpty(() => surface.proposalSwuView.historyTab());
    },
    readQuestionsScore: async (surface, proposalId) => {
      await surface.proposalSwuView.open({ opportunityId: swu, proposalId });
      return readOrEmpty(() => surface.proposalSwuView.questionsScore());
    },
    readOpportunityStatus: async (surface) => {
      await surface.opportunitySwuView.open({ opportunityId: swu });
      return readOrEmpty(() => surface.opportunitySwuView.status());
    },
    finalise: async (surface) => {
      await surface.evaluationConsensusListSwu.open({ opportunityId: swu });
      await surface.evaluationConsensusListSwu.finalizeConsensusScores();
      await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
    },
  },
  {
    name: "Team With Us",
    opportunityId: twu,
    byAgreedTotal: [
      seed.proposals.twuFiveOne.id,
      seed.proposals.twuFiveTwo.id,
      seed.proposals.twuFiveFive.id,
      seed.proposals.twuFiveThree.id,
      seed.proposals.twuFiveFour.id,
    ],
    screenedIn: [seed.proposals.twuFiveOne.id, seed.proposals.twuFiveTwo.id, seed.proposals.twuFiveThree.id],
    leftBehind: [
      { proposalId: seed.proposals.twuFiveFour.id, why: "a fourth proponent was screened in" },
      { proposalId: seed.proposals.twuFiveFive.id, why: "the proponent below a minimum was screened in" },
    ],
    readHistory: async (surface, proposalId) => {
      await surface.proposalTwuView.open({ opportunityId: twu, proposalId });
      return readOrEmpty(() => surface.proposalTwuView.historyTab());
    },
    readQuestionsScore: async (surface, proposalId) => {
      await surface.proposalTwuView.open({ opportunityId: twu, proposalId });
      return readOrEmpty(() => surface.proposalTwuView.questionsScore());
    },
    readOpportunityStatus: async (surface) => {
      await surface.opportunityTwuView.open({ opportunityId: twu });
      return readOrEmpty(() => surface.opportunityTwuView.status());
    },
    finalise: async (surface) => {
      await surface.evaluationConsensusListTwu.open({ opportunityId: twu });
      await surface.evaluationConsensusListTwu.finalizeConsensusScores();
      await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();
    },
  },
];

for (const program of programs) {
  test(`${statement} (${program.name})`, async ({ surface }) => {
    const { screenedIn, leftBehind } = program;
    const everyone = [...screenedIn, ...leftBehind.map((p) => p.proposalId)];
    const history = (proposalId: string): Promise<string[]> =>
      program.readHistory(surface, proposalId).then(entries);

    await surface.signIn(persona.administrator);

    const statusBefore = (await program.readOpportunityStatus(surface)).trim();
    expect(statusBefore).toBeTruthy();
    const before = new Map<string, string[]>();
    for (const proposalId of everyone) before.set(proposalId, await history(proposalId));

    await program.finalise(surface);

    // The opportunity moves to its next stage.
    await expect
      .poll(async () => (await program.readOpportunityStatus(surface)).trim(), settle)
      .not.toBe(statusBefore);
    expect((await program.readOpportunityStatus(surface)).toLowerCase()).toContain("challenge");

    // The highest-scoring proponents that met every minimum are screened in, and no others.
    const gained = new Map<string, string[]>();
    for (const proposalId of screenedIn) {
      await expect
        .poll(async () => added(before.get(proposalId)!, await history(proposalId)).length, {
          ...settle,
          message: `proposal ${proposalId} recorded no move after finalising`,
        })
        .toBeGreaterThan(0);
      gained.set(proposalId, added(before.get(proposalId)!, await history(proposalId)));
    }
    for (const { proposalId } of leftBehind) {
      gained.set(proposalId, added(before.get(proposalId)!, await history(proposalId)));
    }

    const sharedByScreenedIn = [...new Set(gained.get(screenedIn[0])!)].filter((line) =>
      screenedIn.every((proposalId) => gained.get(proposalId)!.includes(line)),
    );
    const gainedByLeftBehind = new Set(leftBehind.flatMap(({ proposalId }) => gained.get(proposalId)!));
    const intoNextStage = sharedByScreenedIn.filter((line) => !gainedByLeftBehind.has(line));
    expect(
      intoNextStage,
      "the highest-scoring proponents that met every minimum did not all enter a stage the others did not",
    ).not.toEqual([]);
    for (const { proposalId, why } of leftBehind) {
      expect(intoNextStage.filter((line) => gained.get(proposalId)!.includes(line)), why).toEqual([]);
    }

    // The agreed scores are recorded against each proponent, in the order of the agreed totals.
    const scores: number[] = [];
    for (const proposalId of program.byAgreedTotal) {
      const shown = await program.readQuestionsScore(surface, proposalId);
      const score = firstNumber(shown);
      expect(Number.isNaN(score), `proposal ${proposalId} carries no questions score ("${shown}")`).toBe(false);
      scores.push(score);
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i], "the questions scores do not follow the agreed totals").toBeLessThan(scores[i - 1]);
    }
  });
}
