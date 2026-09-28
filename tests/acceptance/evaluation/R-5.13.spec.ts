// criterion: @R-5.13 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Sprint With Us opportunity at consensus with one consensus
// outstanding: every individual evaluation submitted, the chair's consensus submitted for
// the first two proponents, and nothing begun for the third, which is still under review of
// the questions. The seed is put back before every test, so both tests start from it.
//
// A proponent lacks a submitted consensus in two ways, and each gets its own test: nobody has
// begun one, or the chair has saved one as a draft and not submitted it.
//
// The criterion promises that finalising is refused, not a message and not the step at which
// it is stopped. So the finalise is attempted from every place the contract offers it — the
// consensus list and the opportunity's own management screen — and a screen that will not
// offer it, or will not confirm it, is allowed to stop it. What decides each test is what
// stands afterwards: the opportunity still reads the state it read before, which is
// consensus, and no proponent was screened in or out, read as no proponent's history having
// gained any entry across the attempt — the history being where a proposal's move into or out
// of a stage is recorded.

const statement =
  "Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;
const questions = [0, 1, 2, 3];

const opportunityId = seed.opportunities.swuConsensusOneOutstanding.id;
const outstanding = seed.proposals.swuOutstandingThree.id;
const proposals = [seed.proposals.swuOutstandingOne.id, seed.proposals.swuOutstandingTwo.id, outstanding];
const chair = seed.users.administratorOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function opportunityStatus(surface: Surface): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunitySwuView.status())).trim();
}

// How many entries a proposal's history holds. Counted rather than compared as text, so that a
// time shown relative to now ("a minute ago") cannot read as a change.
async function historyLengths(surface: Surface): Promise<Map<string, number>> {
  const read = new Map<string, number>();
  for (const proposalId of proposals) {
    await surface.proposalSwuView.open({ opportunityId, proposalId });
    const history = await readOrEmpty(() => surface.proposalSwuView.historyTab());
    read.set(proposalId, history.split(/\r?\n/).filter((line) => line.trim().length > 0).length);
  }
  return read;
}

async function attemptToFinalise(surface: Surface): Promise<void> {
  await surface.evaluationConsensusListSwu.open({ opportunityId });
  try {
    await surface.evaluationConsensusListSwu.finalizeConsensusScores();
    await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
  } catch {
    // A finalise the screen will not offer or confirm is refused; what stands is read below.
  }

  await surface.opportunitySwuEdit.open({ opportunityId });
  try {
    await surface.opportunitySwuEdit.finalizeQuestionConsensuses();
  } catch {
    // As above.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
}

async function checkRefused(surface: Surface): Promise<void> {
  const statusBefore = await opportunityStatus(surface);
  expect(statusBefore).toBeTruthy();
  const historiesBefore = await historyLengths(surface);
  for (const proposalId of proposals) {
    expect(historiesBefore.get(proposalId), `proposal ${proposalId} shows no history to compare`).toBeGreaterThan(0);
  }

  await attemptToFinalise(surface);

  expect(await opportunityStatus(surface), "the opportunity left consensus").toBe(statusBefore);
  const historiesAfter = await historyLengths(surface);
  for (const proposalId of proposals) {
    expect(historiesAfter.get(proposalId), `proposal ${proposalId} was screened in or out`).toBe(
      historiesBefore.get(proposalId),
    );
  }
}

test(`${statement} (a proponent under review has no consensus at all)`, async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.evaluationConsensusEditSwu.open({ opportunityId, proposalId: outstanding, userId: chair });
  expect(await readOrEmpty(() => surface.evaluationConsensusEditSwu.consensusStatus())).toBe("");

  await checkRefused(surface);
});

test(`${statement} (a proponent under review has a consensus saved as a draft and not submitted)`, async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  const create = surface.evaluationConsensusCreateSwu;
  await create.open({ opportunityId, proposalId: outstanding });
  for (const order of questions) {
    await create.enterQuestionScore({ order, score: 4 });
    await create.enterQuestionNotes({ order, notes: "The panel's agreed score, saved and not yet submitted." });
  }
  await create.saveDraft();

  await surface.evaluationConsensusEditSwu.open({ opportunityId, proposalId: outstanding, userId: chair });
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusEditSwu.consensusStatus()), settle)
    .toBeTruthy();

  await checkRefused(surface);
});
