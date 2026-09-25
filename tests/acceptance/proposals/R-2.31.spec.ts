// criterion: @R-2.31 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at the team scenario kept for this
// criterion. Its stated weights are the ones the seed gives every Sprint With Us opportunity:
// questions 25, code challenge 40, team scenario 15 and price 20. Two proposals are in
// contention: the lower bid already carries a score for every stage, and the higher bid lacks
// only its scenario score. The administrator enters that score, which is the "when" for the
// higher bid.
//
// The total is checked for each of the two by reading its four stage scores off its own view
// and combining them in the stated proportions, then comparing that with the total the view
// shows, allowing for each score being shown rounded to two decimal places.
//
// The rank is read before and after. Before, the higher bid is not fully evaluated and holds
// no rank. After, both are fully evaluated, and the lower bid, whose total is the higher, is
// ranked first and the other second. Rank is offered only on the screen that manages a
// proposal, so it is read there, by the administrator.

const statement =
  "A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.";

const settle = { timeout: 30000 };
const weights = { questions: 25, challenge: 40, scenario: 15, price: 20 };
const opportunityId = seed.opportunities.swuTeamScenarioLastToScoreB.id;
const lowerBid = seed.proposals.swuScenarioBLowerBid.id;
const higherBid = seed.proposals.swuScenarioBHigherBid.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function numberIn(text: string): number {
  const match = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

async function scores(surface: Surface, proposalId: string) {
  await surface.proposalSwuView.open({ opportunityId, proposalId });
  const view = surface.proposalSwuView;
  return {
    questions: numberIn(await readOrEmpty(() => view.questionsScore())),
    challenge: numberIn(await readOrEmpty(() => view.challengeScore())),
    scenario: numberIn(await readOrEmpty(() => view.scenarioScore())),
    price: numberIn(await readOrEmpty(() => view.priceScore())),
    total: numberIn(await readOrEmpty(() => view.totalScore())),
  };
}

async function rank(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalSwuEdit.open({ opportunityId, proposalId });
  return readOrEmpty(() => surface.proposalSwuEdit.rank());
}

function weighted(s: { questions: number; challenge: number; scenario: number; price: number }): number {
  return (
    (s.questions * weights.questions +
      s.challenge * weights.challenge +
      s.scenario * weights.scenario +
      s.price * weights.price) /
    100
  );
}

test(statement, async ({ surface }) => {
  await surface.signIn(persona.administrator);

  expect(await rank(surface, higherBid), "ranked before it was fully evaluated").not.toMatch(/\d/);

  await surface.proposalSwuView.open({ opportunityId, proposalId: higherBid });
  await surface.proposalSwuView.scoreTeamScenario({ score: 60 });

  await expect
    .poll(async () => (await scores(surface, higherBid)).total, settle)
    .not.toBeNaN();

  const higher = await scores(surface, higherBid);
  const lower = await scores(surface, lowerBid);
  for (const [name, s] of [
    ["the higher bid", higher],
    ["the lower bid", lower],
  ] as const) {
    for (const stage of ["questions", "challenge", "scenario", "price"] as const) {
      expect(s[stage], `${name} shows no ${stage} score`).not.toBeNaN();
    }
    expect(Math.abs(s.total - weighted(s)), `${name}'s total is not its weighted sum`).toBeLessThan(0.05);
  }

  expect(lower.total).toBeGreaterThan(higher.total);
  await expect.poll(async () => numberIn(await rank(surface, lowerBid)), settle).toBe(1);
  expect(numberIn(await rank(surface, higherBid))).toBe(2);
});
