// criterion: @R-2.33 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — one evaluated proposal, one already disqualified and one withdrawn — is built on
// the seeded Code With Us opportunity kept for this criterion, which is past its deadline with
// two submitted proposals and a third withdrawn before the deadline. The scheduled transition
// trigger closes it, which puts the two submitted proposals under review. The administrator
// disqualifies the second, with a reason, and scores the first, which makes it evaluated.
//
// The administrator then awards the evaluated proposal. The opportunity is read as awarded off
// its own view. The proposals' own screens offer no observation of their status, so each
// proposal's state is read from its history: the awarded one records the award, and the
// disqualified and withdrawn ones still record what they were and record no award of either
// kind, which is them keeping the state they were in.

const statement =
  "Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.cwuLapsedForAward.id;
const evaluated = seed.proposals.cwuForAwardOne.id;
const disqualified = seed.proposals.cwuForAwardTwo.id;
const withdrawn = seed.proposals.cwuForAwardWithdrawn.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function status(surface: Surface): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
}

async function history(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  return (await readOrEmpty(() => surface.proposalCwuView.historyTab())).toLowerCase();
}

test(statement, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await expect
    .poll(async () => {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      return status(surface);
    }, settle)
    .toMatch(/evaluat/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: disqualified });
  await surface.proposalCwuView.disqualifyProposal({
    reason: "R-2.33 the proponent could not confirm their availability.",
  });
  await expect.poll(() => history(surface, disqualified), settle).toMatch(/disqualif/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: evaluated });
  await surface.proposalCwuView.enterScore({ score: 85 });
  await expect.poll(() => history(surface, evaluated), settle).toMatch(/evaluated/);

  expect(await history(surface, withdrawn)).toMatch(/withdrawn/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: evaluated });
  await surface.proposalCwuView.awardProposal();

  await expect.poll(() => status(surface), settle).toMatch(/awarded/);
  expect(await status(surface)).not.toMatch(/not awarded/);

  const winner = await history(surface, evaluated);
  expect(winner).toMatch(/awarded/);
  expect(winner).not.toMatch(/not awarded/);

  const afterDisqualified = await history(surface, disqualified);
  expect(afterDisqualified).toMatch(/disqualif/);
  expect(afterDisqualified).not.toMatch(/awarded/);

  const afterWithdrawn = await history(surface, withdrawn);
  expect(afterWithdrawn).toMatch(/withdrawn/);
  expect(afterWithdrawn).not.toMatch(/awarded/);
});
