// criterion: @R-1.26 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The given is an opportunity in processing with proposals against it. The seed carries one in
// Code With Us, with two evaluated proposals, and one in Sprint With Us, with two evaluated
// proposals and a third left behind at the questions but still in contention. The seed carries
// no Team With Us opportunity in processing, so the award is taken in the two programs it does.
// The opportunity is shown to be in processing before anything is awarded.
//
// The administrator awards the first proposal in each, which is Northern Pines's. Then:
//
//   - the opportunity's own view reads it as awarded;
//   - the successful proponent it names is the organization that made the winning proposal;
//   - every other proposal in contention carries "not awarded" in its own history.

const statement =
  "Awarding a proposal moves its opportunity to awarded and records the winning proponent against it; every other proposal still in contention is marked not awarded.";

const settle = { timeout: 30000 };
const winner = seed.organizations.qualified.legal_name;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test(`${statement} (Code With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuInProcessing.id;
  const awarded = seed.proposals.cwuProcessingOne.id;
  const others = [seed.proposals.cwuProcessingTwo.id];

  async function status(): Promise<string> {
    await surface.opportunityCwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  expect(await status()).toMatch(/processing/);

  await surface.proposalCwuView.open({ opportunityId, proposalId: awarded });
  await surface.proposalCwuView.awardProposal();

  await expect.poll(status, settle).toMatch(/awarded/);
  expect(await status()).not.toMatch(/not awarded/);
  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.successfulProponent()).toContain(winner);

  for (const proposalId of others) {
    await surface.proposalCwuView.open({ opportunityId, proposalId });
    await expect.poll(() => readOrEmpty(() => surface.proposalCwuView.historyTab()), settle).toMatch(/not awarded/i);
  }
});

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.swuProcessingB.id;
  const awarded = seed.proposals.swuProcessingBFirst.id;
  const others = [seed.proposals.swuProcessingBSecond.id, seed.proposals.swuProcessingBThird.id];

  async function status(): Promise<string> {
    await surface.opportunitySwuView.open({ opportunityId });
    return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
  }

  await surface.signIn(persona.administrator);
  expect(await status()).toMatch(/processing/);

  await surface.proposalSwuView.open({ opportunityId, proposalId: awarded });
  await surface.proposalSwuView.awardProposal();

  await expect.poll(status, settle).toMatch(/awarded/);
  expect(await status()).not.toMatch(/not awarded/);
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await surface.opportunitySwuView.successfulProponent()).toContain(winner);

  for (const proposalId of others) {
    await surface.proposalSwuView.open({ opportunityId, proposalId });
    await expect.poll(() => readOrEmpty(() => surface.proposalSwuView.historyTab()), settle).toMatch(/not awarded/i);
  }
});
