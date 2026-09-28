// criterion: @R-2.27 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The given — an opportunity in evaluation with two proposals under review and one already
// disqualified — is built on the seeded Code With Us opportunity past its deadline with three
// submitted proposals. The scheduled transition trigger closes it. The administrator then
// disqualifies the first proposal with a reason, and that proposal is taken to be out of
// contention because its status, as its own vendor reads it, changes from what it was and
// the reason is recorded against it — not because any particular word appears.
//
// The opportunity's status is read once it has closed. Scoring the second proposal leaves
// that reading unchanged, since one proposal in contention is still unscored; scoring the
// third, the "when", changes it, and the opportunity's history carries the note the
// criterion gives.
//
// The criterion also says withdrawn proposals are not counted. The seeded opportunity kept
// for an award has two submitted proposals and one withdrawn before the deadline, so the
// second test scores the two in contention there and reads the same move. That draft
// proposals are not counted is the third test: the seeded lapsed opportunity carrying one
// submitted proposal beside one left in draft is closed, the submission — the only proposal
// in contention — is scored, and the opportunity moves to processing though the draft was
// never evaluated.

const statement =
  "When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.";

const note = "Automatically moved to Processing as all proposals have been evaluated.";
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
  const opportunityId = seed.opportunities.cwuLapsedWithThreeProposals.id;
  const disqualified = seed.proposals.cwuThreeOne.id;
  const first = seed.proposals.cwuThreeTwo.id;
  const last = seed.proposals.cwuThreeThree.id;
  const reason = "R-2.27 the proponent withdrew their named developer.";

  await as(surface, persona.administrator, () => closeLapsed(surface, opportunityId));

  const beforeDisqualifying = await vendorStatus(surface, persona.organizationOwner, opportunityId, disqualified);
  expect(beforeDisqualifying).not.toBe("");

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({ opportunityId, proposalId: disqualified });
  await surface.proposalCwuView.disqualifyProposal({ reason });
  await expect.poll(() => recordedAgainst(surface, opportunityId, disqualified), settle).toContain(reason);
  await surface.signOut();

  await expect
    .poll(() => vendorStatus(surface, persona.organizationOwner, opportunityId, disqualified), settle)
    .not.toBe(beforeDisqualifying);

  await surface.signIn(persona.administrator);
  const inEvaluation = await opportunityStatus(surface, opportunityId);
  expect(inEvaluation).not.toBe("");

  await score(surface, opportunityId, first, 80);
  expect(await opportunityStatus(surface, opportunityId)).toBe(inEvaluation);

  await score(surface, opportunityId, last, 70);
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(inEvaluation);

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(note);
});

test(`${statement} (a withdrawn proposal is not counted)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuLapsedForAward.id;
  const first = seed.proposals.cwuForAwardOne.id;
  const last = seed.proposals.cwuForAwardTwo.id;

  await surface.signIn(persona.administrator);
  const inEvaluation = await closeLapsed(surface, opportunityId);

  await score(surface, opportunityId, first, 85);
  expect(await opportunityStatus(surface, opportunityId)).toBe(inEvaluation);

  await score(surface, opportunityId, last, 75);
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(inEvaluation);

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(note);
});

test(`${statement} (a draft proposal is not counted)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.cwuLapsedWithSubmissionAndDraft.id;
  const submission = seed.proposals.cwuSubmissionBesideDraft.id;

  await surface.signIn(persona.administrator);
  const inEvaluation = await closeLapsed(surface, opportunityId);

  await score(surface, opportunityId, submission, 90);
  await expect.poll(() => opportunityStatus(surface, opportunityId), settle).not.toBe(inEvaluation);

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(note);
});
