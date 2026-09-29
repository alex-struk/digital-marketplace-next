// criterion: @R-2.31 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The stated weights are the ones the seed gives every seeded Sprint With Us opportunity
// (tests/seed/010-sprint-with-us-stages.sql): questions 25, code challenge 40, team scenario
// 15 and price 20.
//
// The total. seed.opportunities.swuTeamScenarioLastToScoreB is at the team scenario with two
// proposals in contention: the lower bid already holds a score for every stage, the higher bid
// holds every score but its team scenario one. The administrator enters that score first, so
// every stage score of both proposals exists before anything is read; the price score is the
// application's own, worked out when that last score is entered. Then each proposal's four
// stage scores and its total are read off its own view, where the administrator is shown them,
// and the total is compared with the stage scores combined in the stated proportions, allowing
// for each figure being shown rounded to two places.
//
// The rank. A rank is presented on a proposal's management screen, to the vendor who holds it,
// once the opportunity is awarded (R-2.32). seed.opportunities.swuAwarded carries two proposals
// with a score for every stage: the awarded one, held by users.organizationOwner, and the one
// not awarded, held by users.proponentTwo (persona.competingVendor). Each vendor reads their own
// proposal's total and rank there, and the proposal with the higher total must rank first and
// the other second.
//
// Only once fully evaluated. While an opportunity is still being evaluated the administrator
// reads each proposal's rank on its own view. On seed.opportunities.swuTeamScenarioLastToScoreB
// the lower bid holds every stage score and the higher bid lacks its team scenario score: the
// lower bid holds a rank and the higher bid none, until its team scenario score is entered,
// after which it holds one too. On seed.opportunities.twuChallengeLastToScore one proposal is
// scored on the challenge and the other not: the first holds a rank, the second none. The Team
// With Us score is not entered, because the seed notes that entering the last one there is
// where the old application's move to processing is refused.

const statement =
  "A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.";

const settle = { timeout: 30000 };
const weights = { questions: 25, challenge: 40, scenario: 15, price: 20 };

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

type StageScores = { questions: number; challenge: number; scenario: number; price: number; total: number };

async function stageScores(surface: Surface, opportunityId: string, proposalId: string): Promise<StageScores> {
  const view = surface.proposalSwuView;
  await view.open({ opportunityId, proposalId });
  return {
    questions: numberIn(await readOrEmpty(() => view.questionsScore())),
    challenge: numberIn(await readOrEmpty(() => view.challengeScore())),
    scenario: numberIn(await readOrEmpty(() => view.scenarioScore())),
    price: numberIn(await readOrEmpty(() => view.priceScore())),
    total: numberIn(await readOrEmpty(() => view.totalScore())),
  };
}

function weighted(s: StageScores): number {
  return (
    (s.questions * weights.questions +
      s.challenge * weights.challenge +
      s.scenario * weights.scenario +
      s.price * weights.price) /
    100
  );
}

test(`${statement} (a proposal with a score for every stage totals those scores in the stated proportions)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = seed.opportunities.swuTeamScenarioLastToScoreB.id;
  const proposals: Array<[string, string]> = [
    ["the lower bid", seed.proposals.swuScenarioBLowerBid.id],
    ["the higher bid", seed.proposals.swuScenarioBHigherBid.id],
  ];

  await surface.signIn(persona.administrator);
  await surface.proposalSwuView.open({ opportunityId, proposalId: seed.proposals.swuScenarioBHigherBid.id });
  await surface.proposalSwuView.scoreTeamScenario({ score: 60 });

  for (const [name, proposalId] of proposals) {
    await expect
      .poll(async () => {
        const s = await stageScores(surface, opportunityId, proposalId);
        return [s.questions, s.challenge, s.scenario, s.price, s.total].every((n) => !Number.isNaN(n));
      }, { ...settle, message: `${name} does not show a score for every stage and a total` })
      .toBe(true);

    const s = await stageScores(surface, opportunityId, proposalId);
    expect(Math.abs(s.total - weighted(s)), `${name}'s total ${s.total} is not the weighted sum of its stage scores`).toBeLessThan(
      0.05,
    );
  }
});

async function ownTotalAndRank(
  surface: Surface,
  vendor: Persona,
  proposalId: string,
): Promise<{ total: number; rank: number }> {
  const opportunityId = seed.opportunities.swuAwarded.id;
  const edit = surface.proposalSwuEdit;
  await surface.signIn(vendor);
  await expect
    .poll(async () => {
      await edit.open({ opportunityId, proposalId });
      return numberIn(await readOrEmpty(() => edit.rank()));
    }, { ...settle, message: "the vendor is shown no rank for their fully evaluated proposal" })
    .not.toBeNaN();
  return {
    total: numberIn(await readOrEmpty(() => edit.totalScore())),
    rank: numberIn(await readOrEmpty(() => edit.rank())),
  };
}

test(`${statement} (fully evaluated proposals are ranked against each other, highest total first)`, async ({ surface }) => {
  test.setTimeout(180000);
  const awarded = await ownTotalAndRank(surface, persona.organizationOwner, seed.proposals.swuAwardedWinner.id);
  const other = await ownTotalAndRank(surface, persona.competingVendor, seed.proposals.swuAwardedOther.id);

  expect(awarded.total, "the awarded proposal shows no total").not.toBeNaN();
  expect(other.total, "the other proposal shows no total").not.toBeNaN();
  expect(awarded.total, "the two fully evaluated proposals have the same total").not.toBe(other.total);

  const [higher, lower] = awarded.total > other.total ? [awarded, other] : [other, awarded];
  expect(higher.rank, "the proposal with the higher total is not ranked first").toBe(1);
  expect(lower.rank, "the proposal with the lower total is not ranked second").toBe(2);
});

async function swuRank(surface: Surface, proposalId: string): Promise<string> {
  const view = surface.proposalSwuView;
  await view.open({ opportunityId: seed.opportunities.swuTeamScenarioLastToScoreB.id, proposalId });
  return (await readOrEmpty(() => view.rank())).trim();
}

async function twuRank(surface: Surface, proposalId: string): Promise<string> {
  const view = surface.proposalTwuView;
  await view.open({ opportunityId: seed.opportunities.twuChallengeLastToScore.id, proposalId });
  return (await readOrEmpty(() => view.rank())).trim();
}

test(`${statement} (a Sprint With Us proposal still waiting for its team scenario score holds no rank until it is scored)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const scored = seed.proposals.swuScenarioBLowerBid.id;
  const waiting = seed.proposals.swuScenarioBHigherBid.id;
  await surface.signIn(persona.administrator);

  await expect
    .poll(() => swuRank(surface, scored), { ...settle, message: "the fully evaluated proposal holds no rank" })
    .toMatch(/\d/);
  expect(await swuRank(surface, waiting), "a proposal without its team scenario score was ranked").not.toMatch(/\d/);

  await surface.proposalSwuView.open({ opportunityId: seed.opportunities.swuTeamScenarioLastToScoreB.id, proposalId: waiting });
  await surface.proposalSwuView.scoreTeamScenario({ score: 60 });

  await expect
    .poll(() => swuRank(surface, waiting), { ...settle, message: "the proposal holds no rank once fully evaluated" })
    .toMatch(/\d/);
});

test(`${statement} (a Team With Us proposal not yet scored on the challenge holds no rank beside one that is)`, async ({
  surface,
}) => {
  test.setTimeout(120000);
  await surface.signIn(persona.administrator);

  await expect
    .poll(() => twuRank(surface, seed.proposals.twuChallengeScored.id), {
      ...settle,
      message: "the fully evaluated proposal holds no rank",
    })
    .toMatch(/\d/);
  expect(
    await twuRank(surface, seed.proposals.twuChallengeLast.id),
    "a proposal without its challenge score was ranked",
  ).not.toMatch(/\d/);
});
