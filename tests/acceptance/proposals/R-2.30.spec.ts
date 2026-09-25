// criterion: @R-2.30 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at the team scenario kept for this
// criterion: two proposals in contention bidding 100,000 and 200,000, the lower bid already
// scored on the scenario and the higher bid not yet, and a third proponent left behind at the
// questions and so not in contention. Entering the higher bid's scenario score is the last
// human-entered score on the opportunity.
//
// The higher bid is read before and after. Before, it carries no price score of 50, since the
// price score is worked out only once the last human-entered score is in. After, its price
// score reads 50 — the lowest bid in contention as a share of its own — its history mentions
// the price score, and its history carries one more "evaluated" entry than it did, which is it
// becoming fully evaluated.

const statement =
  "A proposal's price score is its share of the lowest bid among the proposals still in contention, expressed as a percentage, and it is calculated when the last human-entered score is recorded.";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.swuTeamScenarioLastToScoreA.id;
const higherBid = seed.proposals.swuScenarioAHigherBid.id;
const fifty = /(^|[^\d.])50(\.0+)?(?![\d])/;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function countOf(text: string, word: RegExp): number {
  return (text.toLowerCase().match(word) ?? []).length;
}

test(statement, async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.proposalSwuView.open({ opportunityId, proposalId: higherBid });
  expect(await readOrEmpty(() => surface.proposalSwuView.priceScore())).not.toMatch(fifty);
  const before = await readOrEmpty(() => surface.proposalSwuView.historyTab());

  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });

  await expect
    .poll(async () => {
      await surface.proposalSwuView.open({ opportunityId, proposalId: higherBid });
      return readOrEmpty(() => surface.proposalSwuView.priceScore());
    }, settle)
    .toMatch(fifty);

  await surface.proposalSwuView.open({ opportunityId, proposalId: higherBid });
  const after = await readOrEmpty(() => surface.proposalSwuView.historyTab());
  expect(after.toLowerCase()).toContain("price");
  expect(countOf(after, /evaluated/g)).toBeGreaterThan(countOf(before, /evaluated/g));
});
