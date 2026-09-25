// criterion: @R-1.25 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each program is given its own seeded opportunity standing at its final evaluation stage with
// the last proposal in contention still to be scored:
//
//   - Code With Us has one evaluation stage. Its seeded opportunity is past its proposal
//     deadline with two submitted proposals, so it is first closed through the scheduled
//     transition trigger and read at that stage. Both are then scored; after the first it must
//     not yet have moved, after the second it must.
//   - Sprint With Us is at the team scenario with one proponent already scored and the other,
//     the higher bid, the last left to score; a third was left behind at the questions and is
//     no longer in contention.
//   - Team With Us is at the challenge with one proponent scored and the other the last left.
//
// The administrator enters every score, so nothing about who is scoring is in question. The
// state is read off the opportunity's own view, and waited for.

const statement =
  "An opportunity moves to processing on its own once every proposal still in contention has been scored at its program's final evaluation stage.";

const settle = { timeout: 30000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function cwuStatus(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
}

test(`${statement} (Code With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuLapsedAtFinalStage.id;
  const [first, last] = [seed.proposals.cwuFinalStageOne.id, seed.proposals.cwuFinalStageTwo.id];

  await surface.signIn(persona.administrator);
  await expect
    .poll(async () => {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      return cwuStatus(surface, opportunityId);
    }, settle)
    .toMatch(/evaluat/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: first });
  await surface.proposalCwuView.enterScore({ score: 80 });
  await expect.poll(async () => {
    await surface.proposalCwuView.open({ opportunityId, proposalId: first });
    return readOrEmpty(() => surface.proposalCwuView.score());
  }, settle).toBeTruthy();
  expect(await cwuStatus(surface, opportunityId)).not.toMatch(/processing/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: last });
  await surface.proposalCwuView.enterScore({ score: 70 });

  await expect.poll(() => cwuStatus(surface, opportunityId), settle).toMatch(/processing/);
});

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuTeamScenarioLastToScoreC.id;
  const last = seed.proposals.swuScenarioCHigherBid.id;

  async function status(): Promise<string> {
    await surface.opportunitySwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  const before = await status();
  expect(before).toBeTruthy();
  expect(before).not.toMatch(/processing/);

  await surface.proposalSwuView.open({ opportunityId, proposalId: last });
  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });

  await expect.poll(status, settle).toMatch(/processing/);
});

test(`${statement} (Team With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.twuChallengeLastToScore.id;
  const last = seed.proposals.twuChallengeLast.id;

  async function status(): Promise<string> {
    await surface.opportunityTwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunityTwuView.status())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  const before = await status();
  expect(before).toBeTruthy();
  expect(before).not.toMatch(/processing/);

  await surface.proposalTwuView.open({ opportunityId, proposalId: last });
  await surface.proposalTwuView.scoreChallenge({ score: 80 });

  await expect.poll(status, settle).toMatch(/processing/);
});
