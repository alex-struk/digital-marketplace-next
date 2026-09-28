// criterion: @R-2.30 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at the team scenario kept for this
// criterion: two proposals in contention bidding 100,000 and 200,000, the lower bid already
// scored on the scenario (price 100) and the higher bid not yet, and a third proponent left
// behind at the questions and so not in contention. Entering the higher bid's scenario score
// is the last human-entered score on the opportunity.
//
// The criterion does not say where the price score appears, so it is read everywhere the
// administrator — who is entitled to see a proposal's individual scores — is shown them: the
// proposal's own scores and scenario tab, the proposal's export, and the opportunity's
// proposals and team scenario tabs. Some of those also show the other proposals, so the
// reading is a comparison rather than a single look: a price score of 50 is something none of
// those places shows before the scenario score is entered (the other bids' price is 100 or
// none), and at least one of them shows after. That it appears only after is what "calculated
// when the last human-entered score is recorded" means.
//
// The history of the higher bid is read before and after too: afterwards it mentions the
// price score, and carries one more "evaluated" entry than it did, which is the proposal
// becoming fully evaluated.

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

function countOf(text: string, pattern: RegExp): number {
  return (text.toLowerCase().match(pattern) ?? []).length;
}

// Everything the administrator is shown of the proposals' individual scores, as one text.
async function scoresShown(surface: Surface): Promise<string> {
  const readings: string[] = [];
  await surface.proposalSwuView.open(where);
  readings.push(await readOrEmpty(() => surface.proposalSwuView.priceScore()));
  readings.push(await readOrEmpty(() => surface.proposalSwuView.teamScenarioTab()));
  await surface.proposalSwuExportOne.open(where);
  readings.push(await readOrEmpty(() => surface.proposalSwuExportOne.exportedProposal()));
  await surface.opportunitySwuEdit.open({ opportunityId });
  readings.push(await readOrEmpty(() => surface.opportunitySwuEdit.proposalsTab()));
  readings.push(await readOrEmpty(() => surface.opportunitySwuEdit.teamScenarioTab()));
  return readings.join("\n");
}

async function history(surface: Surface): Promise<string> {
  await surface.proposalSwuView.open(where);
  return readOrEmpty(() => surface.proposalSwuView.historyTab());
}

test(statement, async ({ surface }) => {
  test.setTimeout(240000);
  await surface.signIn(persona.administrator);

  const fiftiesBefore = countOf(await scoresShown(surface), fifty);
  const historyBefore = await history(surface);

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });

  await expect
    .poll(async () => countOf(await scoresShown(surface), fifty), settle)
    .toBeGreaterThan(fiftiesBefore);

  const historyAfter = await history(surface);
  expect(countOf(historyAfter, /price/g)).toBeGreaterThan(countOf(historyBefore, /price/g));
  expect(countOf(historyAfter, /evaluated/g)).toBeGreaterThan(
    countOf(historyBefore, /evaluated/g),
  );
});
