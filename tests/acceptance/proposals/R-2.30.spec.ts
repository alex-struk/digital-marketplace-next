// criterion: @R-2.30 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at the team scenario kept for this
// criterion: two proposals in contention bidding 100,000 and 200,000, the lower bid already
// scored on the scenario (price 100) and the higher bid not yet, and a third proponent left
// behind at the questions and so not in contention. Entering the higher bid's scenario score
// is the last human-entered score on the opportunity.
//
// The price score is read where the administrator, who may see a proposal's individual
// scores, is shown them while the opportunity is being evaluated: the proposal's own view
// (its price score and its team scenario tab) and the opportunity's proposals and team
// scenario tabs. The criterion names none of these, so each is read if it is there and
// contributes nothing if it is not; no single one is required. Some of them show the other
// proposals too, so the reading is a comparison: a price score of 50 is something none of
// them shows before the scenario score is entered (the other bids' price is 100 or none),
// and at least one of them shows after. That it appears only after is what "calculated when
// the last human-entered score is recorded" means.
//
// The higher bid's history is read before and after too: afterwards it mentions the price
// score, and carries one more "evaluated" entry than it did, which is the proposal becoming
// fully evaluated.

const statement =
  "A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.";

const settle = { timeout: 45000 };
const opportunityId = seed.opportunities.swuTeamScenarioLastToScoreA.id;
const higherBid = seed.proposals.swuScenarioAHigherBid.id;
const where = { opportunityId, proposalId: higherBid };
const fifty = /(?<![\d.,])50(?:\.0+)?(?![\d]|[.,]\d)/g;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function opened(open: () => Promise<void>): Promise<boolean> {
  try {
    await open();
    return true;
  } catch {
    return false;
  }
}

function countOf(text: string, pattern: RegExp): number {
  return (text.toLowerCase().match(pattern) ?? []).length;
}

// Everything the administrator is shown of the proposals' individual scores, as one text.
async function scoresShown(surface: Surface): Promise<string> {
  const readings: string[] = [];
  await surface.proposalSwuView.open(where);
  readings.push(await readOrEmpty(() => surface.proposalSwuView.priceScore()));
  readings.push(await readOrEmpty(() => surface.proposalSwuView.teamScenarioTab()));
  if (await opened(() => surface.opportunitySwuEdit.open({ opportunityId }))) {
    readings.push(await readOrEmpty(() => surface.opportunitySwuEdit.proposalsTab()));
    readings.push(await readOrEmpty(() => surface.opportunitySwuEdit.teamScenarioTab()));
  }
  return readings.join("\n");
}

async function history(surface: Surface): Promise<string> {
  await surface.proposalSwuView.open(where);
  const entries = await readOrEmpty(() => surface.proposalSwuView.historyEntries());
  return entries || readOrEmpty(() => surface.proposalSwuView.historyTab());
}

test(statement, async ({ surface }) => {
  test.setTimeout(240000);
  await surface.signIn(persona.administrator);

  const fiftiesBefore = countOf(await scoresShown(surface), fifty);
  const historyBefore = await history(surface);

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });

  await expect
    .poll(async () => countOf(await scoresShown(surface), fifty), {
      ...settle,
      message: "the higher bid is not shown a price score of 50 once its scenario score is entered",
    })
    .toBeGreaterThan(fiftiesBefore);

  const historyAfter = await history(surface);
  expect(
    countOf(historyAfter, /price/g),
    "the proposal's history does not record the calculated price score",
  ).toBeGreaterThan(countOf(historyBefore, /price/g));
  expect(
    countOf(historyAfter, /evaluated/g),
    "the proposal's history does not record it becoming fully evaluated",
  ).toBeGreaterThan(countOf(historyBefore, /evaluated/g));
});
