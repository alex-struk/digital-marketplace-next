// criterion: @R-5.30 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — a consensus the chair has already submitted, on an opportunity still in
// consensus — is seeded for each program (swuConsensusAllAgreed, twuConsensusAllAgreed): the
// chair, the administrator, has submitted agreed scores of 4, 4, 4, 4 for the first
// proponent. The chair changes them on the consensus edit screen and saves, twice, and never
// submits again. After each save the consensus is read back as the service holds it: the
// change stands, and its status reads exactly as it did when it was first submitted.
//
// "Until it is finalised" is tested from the other side on the seeded opportunities that have
// moved past consensus with the chair's consensus standing (swuPastConsensus,
// twuPastConsensus): the chair's attempt to change it through the same screen is allowed to
// fail, and the consensus must read exactly as before.
//
// The contrast the criterion draws — an individual evaluation is fixed once submitted — is
// tested on the seeded closed Sprint With Us opportunity: the evaluator scores every
// proponent, submits the set, and then tries to change one; the evaluation must read exactly
// as it did when submitted.

const statement =
  "The chair may change the agreed scores of a consensus they have already submitted, as often as they like until it is finalised; each change is saved directly and the consensus stays submitted, with no second submission, unlike an individual evaluation, which is fixed once submitted.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;
const questions = [0, 1, 2, 3];
const chair = seed.users.administratorOne.id;
const evaluator = seed.users.staffOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

type EditPage = Surface["evaluationConsensusEditSwu"] | Surface["evaluationConsensusEditTwu"];
type RequestPage = Surface["evaluationConsensusRequestSwu"] | Surface["evaluationConsensusRequestTwu"];

const programs = [
  {
    name: "Sprint With Us",
    edit: (surface: Surface): EditPage => surface.evaluationConsensusEditSwu,
    request: (surface: Surface): RequestPage => surface.evaluationConsensusRequestSwu,
    inConsensus: { opportunityId: seed.opportunities.swuConsensusAllAgreed.id, proposalId: seed.proposals.swuAgreedOne.id },
    pastConsensus: { opportunityId: seed.opportunities.swuPastConsensus.id, proposalId: seed.proposals.swuPastConsensusOne.id },
  },
  {
    name: "Team With Us",
    edit: (surface: Surface): EditPage => surface.evaluationConsensusEditTwu,
    request: (surface: Surface): RequestPage => surface.evaluationConsensusRequestTwu,
    inConsensus: { opportunityId: seed.opportunities.twuConsensusAllAgreed.id, proposalId: seed.proposals.twuAgreedOne.id },
    pastConsensus: { opportunityId: seed.opportunities.twuPastConsensus.id, proposalId: seed.proposals.twuPastConsensusOne.id },
  },
];

async function storedConsensus(
  request: RequestPage,
  proposalId: string,
): Promise<{ scores: string; notes: string; status: string }> {
  await request.open({ proposalId, userId: chair });
  return {
    scores: await readOrEmpty(() => request.storedScores()),
    notes: await readOrEmpty(() => request.storedNotes()),
    status: await readOrEmpty(() => request.consensusStatus()),
  };
}

async function changeAgreedScores(
  edit: EditPage,
  params: { opportunityId: string; proposalId: string },
  score: number,
  notes: string,
): Promise<void> {
  await edit.open({ ...params, userId: chair });
  for (const order of questions) {
    await edit.enterQuestionScore({ order, score });
    await edit.enterQuestionNotes({ order, notes });
  }
  await edit.saveChanges();
}

for (const program of programs) {
  test(`${statement} (${program.name}: the chair changes a submitted consensus twice, each change saved directly, and it stays submitted)`, async ({
    surface,
  }) => {
    const edit = program.edit(surface);
    const request = program.request(surface);
    const { proposalId } = program.inConsensus;

    await surface.signIn(persona.administrator);
    const submitted = await storedConsensus(request, proposalId);
    expect(submitted.status).toBeTruthy();
    expect(submitted.scores).toBeTruthy();

    const changes = [
      { score: 2, notes: "The panel met again and agreed a lower score for this answer." },
      { score: 5, notes: "The panel met a third time and agreed a higher score for this answer." },
    ];
    let previous = submitted;
    for (const change of changes) {
      await changeAgreedScores(edit, program.inConsensus, change.score, change.notes);

      await expect.poll(async () => (await storedConsensus(request, proposalId)).notes, settle).toContain(change.notes);
      const now = await storedConsensus(request, proposalId);
      expect(now.scores, "the agreed scores were not changed").not.toBe(previous.scores);
      expect(now.status, "the consensus no longer reads as submitted").toBe(submitted.status);
      previous = now;
    }
  });

  test(`${statement} (${program.name}: once finalised, the chair's change is not taken)`, async ({ surface }) => {
    const edit = program.edit(surface);
    const request = program.request(surface);
    const { proposalId } = program.pastConsensus;

    await surface.signIn(persona.administrator);
    const before = await storedConsensus(request, proposalId);
    expect(before.scores).toBeTruthy();

    try {
      await changeAgreedScores(edit, program.pastConsensus, 1, "A change attempted after the consensus was finalised.");
    } catch {
      // A change the screen will not take is refused; what stands is read below.
    }
    await new Promise((resolve) => setTimeout(resolve, quietPeriod));

    expect(await storedConsensus(request, proposalId)).toEqual(before);
  });
}

test(`${statement} (an individual evaluation, once submitted, cannot be changed)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.closedSprintWithUs.id;
  const proposals = [
    seed.proposals.sprintWithUsOne.id,
    seed.proposals.sprintWithUsTwo.id,
    seed.proposals.sprintWithUsThree.id,
  ];
  const changed = seed.proposals.sprintWithUsOne.id;

  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order, notes: "A complete reading of this answer." });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  const request = surface.evaluationIndividualRequestSwu;
  async function storedEvaluation(): Promise<{ scores: string; notes: string; status: string }> {
    await request.open({ proposalId: changed, userId: evaluator });
    return {
      scores: await readOrEmpty(() => request.storedScores()),
      notes: await readOrEmpty(() => request.storedNotes()),
      status: await readOrEmpty(() => request.evaluationStatus()),
    };
  }
  await expect.poll(async () => (await storedEvaluation()).status, settle).toBeTruthy();
  const submitted = await storedEvaluation();
  expect(submitted.scores).toBeTruthy();

  const edit = surface.evaluationIndividualEditSwu;
  try {
    await edit.open({ opportunityId, proposalId: changed, userId: evaluator });
    for (const order of questions) {
      await edit.enterQuestionScore({ order, score: 1 });
      await edit.enterQuestionNotes({ order, notes: "A change attempted after this evaluation was submitted." });
    }
    await edit.saveChanges();
  } catch {
    // A change the screen will not take is refused; what stands is read below.
  }
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));

  expect(await storedEvaluation()).toEqual(submitted);
});
