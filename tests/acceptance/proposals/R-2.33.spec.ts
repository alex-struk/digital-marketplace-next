// criterion: @R-2.33 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given — one evaluated proposal, one already disqualified and one withdrawn — is built
// on the seeded Code With Us opportunity kept for this criterion: past its deadline with two
// submitted proposals and a third withdrawn before the deadline. The scheduled transition
// trigger closes it. The administrator disqualifies the second with a reason, which is
// established because that proposal's status, as its own vendor reads it, changes from what
// it was and the reason is recorded against it — not because any particular word appears.
// Scoring the first then leaves nothing in contention unscored, and the opportunity moves on
// to where an award is made.
//
// The award is read as: the awarded proposal's status changes, the opportunity's status
// changes from what it was before the award, and the disqualified and withdrawn proposals read exactly as they did before. The withdrawn
// proposal's vendor has no persona, so its state is read from the administrator's view of
// its history, which must be the same after the award as before it.
//
// The second test is the statement's other clause, "marks every other proposal still in
// contention as not awarded", on the seeded opportunity whose two proposals are both from
// vendors a test can sign in as: the one not chosen changes status, and to a different
// status from the one that was chosen.

const statement =
  "Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.";

const settle = { timeout: 30000 };

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

async function opportunityStatus(surface: Surface, opportunityId: string): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return readOrEmpty(() => surface.opportunityCwuView.status());
}

// The bounded closing procedure of observables.yaml (scheduled_transitions): trigger, read
// every half second, trigger again after three quiet seconds, give up after thirty.
async function closeLapsed(surface: Surface, opportunityId: string): Promise<string> {
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
    last = await opportunityStatus(surface, opportunityId);
    if (/evaluat/i.test(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`the opportunity was not seen to close: last status "${last}" after ${triggers} triggers`);
}

async function vendorStatus(
  surface: Surface,
  vendor: Persona,
  opportunityId: string,
  proposalId: string,
): Promise<string> {
  return as(surface, vendor, async () => {
    await surface.proposalCwuEdit.open({ opportunityId, proposalId });
    return readOrEmpty(() => surface.proposalCwuEdit.status());
  });
}

// Wherever the proposal's screen shows what has been recorded against it.
async function recordedAgainst(surface: Surface, opportunityId: string, proposalId: string): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  const history = await readOrEmpty(() => surface.proposalCwuView.historyTab());
  const proposal = await readOrEmpty(() => surface.proposalCwuView.proposalTab());
  return `${history}\n${proposal}`;
}

async function history(surface: Surface, opportunityId: string, proposalId: string): Promise<string> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  return readOrEmpty(() => surface.proposalCwuView.historyTab());
}

async function score(surface: Surface, opportunityId: string, proposalId: string, value: number): Promise<void> {
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  await surface.proposalCwuView.enterScore({ score: value });
  await expect
    .poll(async () => {
      await surface.proposalCwuView.open({ opportunityId, proposalId });
      return readOrEmpty(() => surface.proposalCwuView.score());
    }, settle)
    .toContain(String(value));
}

test(statement, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuLapsedForAward.id;
  const evaluated = seed.proposals.cwuForAwardOne.id;
  const disqualified = seed.proposals.cwuForAwardTwo.id;
  const withdrawn = seed.proposals.cwuForAwardWithdrawn.id;
  const reason = "R-2.33 the proponent could not confirm their availability.";

  await as(surface, persona.administrator, () => closeLapsed(surface, opportunityId));

  const beforeDisqualifying = await vendorStatus(surface, persona.competingVendor, opportunityId, disqualified);
  expect(beforeDisqualifying).not.toBe("");

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({ opportunityId, proposalId: disqualified });
  await surface.proposalCwuView.disqualifyProposal({ reason });
  await expect.poll(() => recordedAgainst(surface, opportunityId, disqualified), settle).toContain(reason);
  await surface.signOut();

  await expect
    .poll(() => vendorStatus(surface, persona.competingVendor, opportunityId, disqualified), settle)
    .not.toBe(beforeDisqualifying);
  const disqualifiedState = await vendorStatus(surface, persona.competingVendor, opportunityId, disqualified);

  await surface.signIn(persona.administrator);
  const inEvaluation = await opportunityStatus(surface, opportunityId);
  await score(surface, opportunityId, evaluated, 85);
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(inEvaluation);
  const beforeAward = await opportunityStatus(surface, opportunityId);
  const withdrawnHistory = await history(surface, opportunityId, withdrawn);
  expect(withdrawnHistory).not.toBe("");
  await surface.signOut();

  const evaluatedState = await vendorStatus(surface, persona.organizationOwner, opportunityId, evaluated);
  expect(evaluatedState).not.toBe("");

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({ opportunityId, proposalId: evaluated });
  await surface.proposalCwuView.awardProposal();

  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(beforeAward);
  expect(await history(surface, opportunityId, withdrawn)).toBe(withdrawnHistory);
  await surface.signOut();

  expect(await vendorStatus(surface, persona.organizationOwner, opportunityId, evaluated)).not.toBe(evaluatedState);
  expect(await vendorStatus(surface, persona.competingVendor, opportunityId, disqualified)).toBe(disqualifiedState);
});

test(`${statement} (the other proposal still in contention)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuLapsedAtFinalStage.id;
  const chosen = seed.proposals.cwuFinalStageOne.id;
  const other = seed.proposals.cwuFinalStageTwo.id;

  await surface.signIn(persona.administrator);
  const inEvaluation = await closeLapsed(surface, opportunityId);
  await score(surface, opportunityId, chosen, 88);
  await score(surface, opportunityId, other, 72);
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(inEvaluation);
  const beforeAward = await opportunityStatus(surface, opportunityId);
  await surface.signOut();

  const chosenBefore = await vendorStatus(surface, persona.organizationOwner, opportunityId, chosen);
  const otherBefore = await vendorStatus(surface, persona.competingVendor, opportunityId, other);
  expect(chosenBefore).not.toBe("");
  expect(otherBefore).not.toBe("");

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({ opportunityId, proposalId: chosen });
  await surface.proposalCwuView.awardProposal();
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(beforeAward);
  await surface.signOut();

  const chosenAfter = await vendorStatus(surface, persona.organizationOwner, opportunityId, chosen);
  const otherAfter = await vendorStatus(surface, persona.competingVendor, opportunityId, other);
  expect(chosenAfter).not.toBe(chosenBefore);
  expect(otherAfter).not.toBe(otherBefore);
  expect(otherAfter).not.toBe("");
  expect(otherAfter).not.toBe(chosenAfter);
});
