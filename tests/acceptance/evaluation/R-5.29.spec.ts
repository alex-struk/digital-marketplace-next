// criterion: @R-5.29 v1
// provenance: blind, spec@7eb305e85acb5a44b285f09b9800da3c65c6a355, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — an opportunity in consensus — is the seeded Sprint With Us opportunity with
// one consensus outstanding: every individual evaluation submitted, the chair's consensus
// submitted for the first two proponents and not begun for the third. Its panel is the
// government account as an evaluator who is not the chair, and the administrator as chair.
// The seed is put back before every test, so each test below starts from that given.
//
// Each attempt is made by entering an agreed score and note for every question and saving.
// A screen that will not let the attempt be made is a refusal too, so the actions are
// allowed to fail; what decides each test is what stands afterwards, not whether a message
// was shown.
//
// The evaluator's attempt is counted as refused when, afterwards, the chair finds no
// consensus for the outstanding proponent, neither under the evaluator's user id nor under
// the chair's own, so an attempt stored as the proponent's consensus cannot pass unseen. The
// same read on the chair's own consensus of a proponent already agreed is made first, so that
// a screen that shows no consensus to anybody fails the test rather than passing it. Then the
// chair records that outstanding consensus through the same screen, with no failure allowed,
// and it is read back: the refusal is measured against a write shown to succeed.
//
// The chair's second attempt is counted as refused when exactly one consensus stands for
// that proponent afterwards. The chair may change the consensus they already agreed, so the
// scores it holds and its status are not compared; the consensus list is read before and
// after, and the proponents named on it must be named the same number of times, with the
// chair's consensus for that proponent still there.
//
// "Only while the opportunity is in consensus" is tested from the side before consensus: the
// chair attempts a consensus while the seeded closed opportunity is still at individual
// evaluation, and none is recorded.
//
// Changing a consensus is tested through evaluation-consensus-request-swu and -twu, which
// read back the agreed scores and notes a consensus holds and send a change no screen offers
// the person making it. The starting points are the seeded opportunities still at consensus
// with the chair's consensus submitted for both proponents (swuConsensusAllAgreed,
// twuConsensusAllAgreed), and those moved past consensus with the chair's consensus standing
// (swuPastConsensus, twuPastConsensus). A change counts as refused when the service does not
// report it accepted and the administrator, who may read a consensus at any stage, finds the
// stored scores and notes exactly as they were before the attempt. Each refusal is measured
// against a write shown to succeed: the chair changing a consensus on the opportunity still
// in consensus is accepted, and the change is read back.

const statement =
  "Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;
const questions = [0, 1, 2, 3];

const opportunityId = seed.opportunities.swuConsensusOneOutstanding.id;
const agreed = seed.proposals.swuOutstandingOne.id;
const outstanding = seed.proposals.swuOutstandingThree.id;
const chair = seed.users.administratorOne.id;
const evaluator = seed.users.staffOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function recordConsensus(
  surface: Surface,
  params: { opportunityId: string; proposalId: string },
  score: number,
): Promise<void> {
  const create = surface.evaluationConsensusCreateSwu;
  await create.open(params);
  for (const order of questions) {
    await create.enterQuestionScore({ order, score });
    await create.enterQuestionNotes({ order, notes: "The score this person put forward as agreed." });
  }
  await create.saveDraft();
}

async function attemptConsensus(
  surface: Surface,
  params: { opportunityId: string; proposalId: string },
  score: number,
): Promise<void> {
  try {
    await recordConsensus(surface, params, score);
  } catch {
    // A consensus the screen will not let be recorded is refused; what stands is read below.
  }
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
}

async function consensusStatusOf(
  surface: Surface,
  params: { opportunityId: string; proposalId: string; userId: string },
): Promise<string> {
  await surface.evaluationConsensusEditSwu.open(params);
  return readOrEmpty(() => surface.evaluationConsensusEditSwu.consensusStatus());
}

function proponentMentions(rows: string): number {
  return (rows.match(/Proponent \d+/g) ?? []).length;
}

test(`${statement} (an evaluator who is not the chair tries to record an agreed score, and is refused, while the chair records it)`, async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await attemptConsensus(surface, { opportunityId, proposalId: outstanding }, 3);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusEditSwu.open({ opportunityId, proposalId: agreed, userId: chair });
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusEditSwu.consensusStatus()), settle)
    .toBeTruthy();

  expect(
    await consensusStatusOf(surface, { opportunityId, proposalId: outstanding, userId: evaluator }),
  ).toBe("");
  expect(
    await consensusStatusOf(surface, { opportunityId, proposalId: outstanding, userId: chair }),
  ).toBe("");

  await recordConsensus(surface, { opportunityId, proposalId: outstanding }, 4);

  await expect
    .poll(() => consensusStatusOf(surface, { opportunityId, proposalId: outstanding, userId: chair }), settle)
    .toBeTruthy();
});

test(`${statement} (the chair records a second consensus for a proponent they have already agreed, and is refused as a duplicate)`, async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusListSwu.proponentRow()), settle)
    .toBeTruthy();
  const before = proponentMentions(await readOrEmpty(() => surface.evaluationConsensusListSwu.proponentRow()));
  expect(before).toBeGreaterThan(0);

  await attemptConsensus(surface, { opportunityId, proposalId: agreed }, 3);

  expect(await consensusStatusOf(surface, { opportunityId, proposalId: agreed, userId: chair })).toBeTruthy();

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await expect
    .poll(() => readOrEmpty(() => surface.evaluationConsensusListSwu.proponentRow()), settle)
    .toBeTruthy();
  const after = proponentMentions(await readOrEmpty(() => surface.evaluationConsensusListSwu.proponentRow()));
  expect(after).toBe(before);
});

test(`${statement} (the chair tries to record a consensus before the opportunity is in consensus, and none is recorded)`, async ({
  surface,
}) => {
  const earlyOpportunityId = seed.opportunities.closedSprintWithUs.id;
  const proposalId = seed.proposals.sprintWithUsOne.id;

  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await attemptConsensus(surface, { opportunityId: earlyOpportunityId, proposalId }, 4);

  expect(
    await consensusStatusOf(surface, { opportunityId: earlyOpportunityId, proposalId, userId: chair }),
  ).toBe("");
});

type ConsensusRequestPage = Surface["evaluationConsensusRequestSwu"];

const programs = [
  {
    name: "Sprint With Us",
    request: (surface: Surface): ConsensusRequestPage => surface.evaluationConsensusRequestSwu,
    inConsensus: seed.proposals.swuAgreedOne.id,
    pastConsensus: seed.proposals.swuPastConsensusOne.id,
  },
  {
    name: "Team With Us",
    request: (surface: Surface): ConsensusRequestPage => surface.evaluationConsensusRequestTwu,
    inConsensus: seed.proposals.twuAgreedOne.id,
    pastConsensus: seed.proposals.twuPastConsensusOne.id,
  },
];

const changedConsensus = {
  questions: questions.map((order) => ({
    order,
    score: 1,
    notes: `A changed agreed note on question ${order + 1}.`,
  })),
};

async function storedConsensus(
  consensusPage: ConsensusRequestPage,
  proposalId: string,
): Promise<{ scores: string; notes: string }> {
  await consensusPage.open({ proposalId, userId: chair });
  return {
    scores: await readOrEmpty(() => consensusPage.storedScores()),
    notes: await readOrEmpty(() => consensusPage.storedNotes()),
  };
}

async function attemptChange(consensusPage: ConsensusRequestPage, proposalId: string): Promise<string> {
  await consensusPage.open({ proposalId, userId: chair });
  try {
    await consensusPage.changeConsensusByRequest(changedConsensus);
  } catch {
    // A change the service will not take is refused; what stands is read below.
  }
  return readOrEmpty(() => consensusPage.requestAccepted());
}

async function chairChangesInConsensus(consensusPage: ConsensusRequestPage, proposalId: string): Promise<void> {
  const before = await storedConsensus(consensusPage, proposalId);
  await consensusPage.open({ proposalId, userId: chair });
  await consensusPage.changeConsensusByRequest(changedConsensus);
  expect(await readOrEmpty(() => consensusPage.requestAccepted())).toBeTruthy();
  await expect
    .poll(async () => (await storedConsensus(consensusPage, proposalId)).notes, settle)
    .not.toBe(before.notes);
  expect((await storedConsensus(consensusPage, proposalId)).notes).toContain("A changed agreed note");
}

for (const program of programs) {
  test(`${statement} (${program.name}: an evaluator who is not the chair tries to change the chair's consensus, and is refused, while the chair may change it)`, async ({
    surface,
  }) => {
    const page = program.request(surface);

    await surface.signIn(persona.administrator);
    const before = await storedConsensus(page, program.inConsensus);
    expect(before.scores).toBeTruthy();
    expect(before.notes).toContain("Seeded note on question");
    await surface.signOut();

    await surface.signIn(persona.publicSectorStaff);
    expect(await attemptChange(page, program.inConsensus)).toBeFalsy();
    await surface.signOut();

    await surface.signIn(persona.administrator);
    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    expect(await storedConsensus(page, program.inConsensus)).toEqual(before);

    await chairChangesInConsensus(page, program.inConsensus);
  });

  test(`${statement} (${program.name}: the chair tries to change a consensus once the opportunity has moved past consensus, and is refused)`, async ({
    surface,
  }) => {
    const page = program.request(surface);

    await surface.signIn(persona.administrator);
    const before = await storedConsensus(page, program.pastConsensus);
    expect(before.scores).toBeTruthy();

    expect(await attemptChange(page, program.pastConsensus)).toBeFalsy();

    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    expect(await storedConsensus(page, program.pastConsensus)).toEqual(before);

    await chairChangesInConsensus(page, program.inConsensus);
  });
}
