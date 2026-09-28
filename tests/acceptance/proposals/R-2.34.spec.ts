// criterion: @R-2.34 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// Every test here starts from a seeded opportunity past its deadline, which the scheduled
// transition trigger closes. A proposal's state is read as its own vendor reads it on the
// proposal's management screen: a disqualification is established because that status
// changes from what it was, and a refusal because it does not — never by a word appearing or
// failing to appear. The reason is read wherever the proposal's screen shows what has been
// recorded against it, on the Code With Us proposal, whose screen an administrator can read
// throughout its single evaluation stage.
//
// "At any stage of evaluation" is asserted at two stages: the one evaluation stage of a Code
// With Us opportunity, and review of the questions on a Team With Us opportunity, the first
// of that program's stages. The last part of the "then", that the opportunity is re-checked
// for whether every remaining proposal is now evaluated, is read as its consequence: with
// every other proposal scored, disqualifying the last one moves the opportunity on.
//
// A refusal may come from the service or from a form that will not send the request at
// all; either leaves the proposal as it was, so an action that fails is not itself a failure
// of the refusal tests — the status read after it is what they assert.

const statement =
  "A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.";

const settle = { timeout: 30000 };
const tooLongAReason = "x".repeat(5001);

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function as<T>(surface: Surface, who: Persona, body: () => Promise<T>): Promise<T> {
  await surface.signIn(who);
  try {
    return await body();
  } finally {
    await surface.signOut();
  }
}

// The bounded closing procedure of observables.yaml (scheduled_transitions): trigger, read
// every half second, trigger again after three quiet seconds, give up after thirty.
async function closeLapsed(surface: Surface, read: () => Promise<string>): Promise<string> {
  const started = Date.now();
  let lastTrigger = 0;
  let triggers = 0;
  let last = "";
  while (Date.now() - started < 30000) {
    if (Date.now() - lastTrigger >= 3000) {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      lastTrigger = Date.now();
      triggers += 1;
    }
    last = await read();
    if (/evaluat/i.test(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`the opportunity was not seen to close: last status "${last}" after ${triggers} triggers`);
}

async function cwuOpportunityStatus(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return readOrEmpty(() => surface.opportunityCwuView.status());
}

async function twuOpportunityStatus(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunityTwuView.open({ opportunityId });
  return readOrEmpty(() => surface.opportunityTwuView.status());
}

async function cwuVendorStatus(surface: Surface, vendor: Persona, opportunityId: string, proposalId: string) {
  return as(surface, vendor, async () => {
    await surface.proposalCwuEdit.open({ opportunityId, proposalId });
    return readOrEmpty(() => surface.proposalCwuEdit.status());
  });
}

async function twuVendorStatus(surface: Surface, vendor: Persona, opportunityId: string, proposalId: string) {
  return as(surface, vendor, async () => {
    await surface.proposalTwuEdit.open({ opportunityId, proposalId });
    return readOrEmpty(() => surface.proposalTwuEdit.status());
  });
}

// Wherever the proposal's screen shows what has been recorded against it.
async function recordedAgainst(surface: Surface, opportunityId: string, proposalId: string): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  const history = await readOrEmpty(() => surface.proposalCwuView.historyTab());
  const proposal = await readOrEmpty(() => surface.proposalCwuView.proposalTab());
  return `${history}\n${proposal}`;
}

// The Code With Us proposal a test disqualifies, with the status its vendor reads once the
// opportunity has closed.
const cwu = {
  opportunityId: seed.opportunities.cwuLapsedForScoring.id,
  proposalId: seed.proposals.cwuLapsedForScoringOne.id,
  vendor: persona.organizationOwner,
};

async function closedCwuProposal(surface: Surface): Promise<string> {
  await as(surface, persona.administrator, () =>
    closeLapsed(surface, () => cwuOpportunityStatus(surface, cwu.opportunityId)),
  );
  const status = await cwuVendorStatus(surface, cwu.vendor, cwu.opportunityId, cwu.proposalId);
  expect(status).not.toBe("");
  return status;
}

async function disqualifyCwu(surface: Surface, reason: string): Promise<void> {
  await as(surface, persona.administrator, async () => {
    await surface.proposalCwuView.open({ opportunityId: cwu.opportunityId, proposalId: cwu.proposalId });
    await surface.proposalCwuView.disqualifyProposal({ reason });
  });
}

test(`${statement} (without a reason, the request is refused)`, async ({ surface }) => {
  const before = await closedCwuProposal(surface);
  await disqualifyCwu(surface, "").catch(() => undefined);
  expect(await cwuVendorStatus(surface, cwu.vendor, cwu.opportunityId, cwu.proposalId)).toBe(before);
});

test(`${statement} (a reason of more than 5,000 characters is refused)`, async ({ surface }) => {
  const before = await closedCwuProposal(surface);
  await disqualifyCwu(surface, tooLongAReason).catch(() => undefined);
  expect(await cwuVendorStatus(surface, cwu.vendor, cwu.opportunityId, cwu.proposalId)).toBe(before);
});

test(`${statement} (with a reason, the proposal becomes disqualified and the reason is kept)`, async ({
  surface,
}) => {
  const reason = "R-2.34 the proponent withdrew from the procurement in writing.";
  const before = await closedCwuProposal(surface);
  await disqualifyCwu(surface, reason);

  await expect
    .poll(() => cwuVendorStatus(surface, cwu.vendor, cwu.opportunityId, cwu.proposalId), settle)
    .not.toBe(before);

  await surface.signIn(persona.administrator);
  await expect.poll(() => recordedAgainst(surface, cwu.opportunityId, cwu.proposalId), settle).toContain(reason);
});

for (const [label, reason] of [
  ["a reason of 1 character", "x"],
  ["a reason of 5,000 characters", "y".repeat(5000)],
] as const) {
  test(`${statement} (${label} is accepted)`, async ({ surface }) => {
    const before = await closedCwuProposal(surface);
    await disqualifyCwu(surface, reason);
    await expect
      .poll(() => cwuVendorStatus(surface, cwu.vendor, cwu.opportunityId, cwu.proposalId), settle)
      .not.toBe(before);
  });
}

test(`${statement} (at review of the questions on a Team With Us opportunity)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.closedTeamWithUs.id;
  const proposalId = seed.proposals.teamWithUsOne.id;
  const vendor = persona.organizationOwner;

  await as(surface, persona.administrator, () =>
    closeLapsed(surface, () => twuOpportunityStatus(surface, opportunityId)),
  );
  const before = await twuVendorStatus(surface, vendor, opportunityId, proposalId);
  expect(before).not.toBe("");

  await as(surface, persona.administrator, async () => {
    await surface.proposalTwuView.open({ opportunityId, proposalId });
    await surface.proposalTwuView.disqualifyProposal({
      reason: "R-2.34 the proponent's named resource is no longer available.",
    });
  });

  await expect.poll(() => twuVendorStatus(surface, vendor, opportunityId, proposalId), settle).not.toBe(before);
});

test(`${statement} (the opportunity is re-checked for whether every remaining proposal is now evaluated)`, async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.cwuLapsedWithThreeProposals.id;
  const scored = [seed.proposals.cwuThreeOne.id, seed.proposals.cwuThreeTwo.id];
  const last = seed.proposals.cwuThreeThree.id;

  await surface.signIn(persona.administrator);
  await closeLapsed(surface, () => cwuOpportunityStatus(surface, opportunityId));

  for (const [i, proposalId] of scored.entries()) {
    const value = 80 - i * 5;
    await surface.proposalCwuView.open({ opportunityId, proposalId });
    await surface.proposalCwuView.enterScore({ score: value });
    await expect
      .poll(async () => {
        await surface.proposalCwuView.open({ opportunityId, proposalId });
        return readOrEmpty(() => surface.proposalCwuView.score());
      }, settle)
      .toContain(String(value));
  }
  const withOneUnscored = await cwuOpportunityStatus(surface, opportunityId);
  expect(withOneUnscored).not.toBe("");

  await surface.proposalCwuView.open({ opportunityId, proposalId: last });
  await surface.proposalCwuView.disqualifyProposal({
    reason: "R-2.34 the proponent did not attend the mandatory briefing.",
  });

  await expect.poll(() => cwuOpportunityStatus(surface, opportunityId), settle).not.toBe(withOneUnscored);
});
