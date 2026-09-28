// criterion: @R-5.3 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The starting point is each program's seeded closed opportunity, which the application
// moves into individual question evaluation once the transition trigger has been
// requested. The government account is an evaluator on both seeded panels.
//
// The evaluator starts one evaluation of a proponent and saves it, and it is read back as
// theirs. They then start a second evaluation of the same proponent through the same
// screen. A screen that returns them to the evaluation they already hold has refused a
// second evaluation just as a screen that reports the refusal has, so the attempt is
// allowed to fail and neither outcome is required. What decides the test is what stands
// afterwards: the evaluator's own list names that proponent exactly as many times as it did
// before, and the evaluation stored under the evaluator for that proponent is still there.
//
// The criterion's message is required only where the screen actually asked the service for
// a second evaluation and reported the answer, which is read from the duplicate-evaluation
// refusal the screen shows. No action in the contract sends that request to the service on
// its own, so where the screen never sends it the message is not asserted here; the entry
// for this criterion in not-testable.yaml keeps that clause owed.

const statement =
  "An evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;
const questions = [0, 1, 2, 3];
const evaluator = seed.users.staffOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function mentions(text: string, name: string): number {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(`${escaped}(?!\\d)`, "g")) ?? []).length;
}

type CreatePage = Surface["evaluationIndividualCreateSwu"] | Surface["evaluationIndividualCreateTwu"];
type ListPage = Surface["evaluationIndividualListSwu"] | Surface["evaluationIndividualListTwu"];
type RequestPage = Surface["evaluationIndividualRequestSwu"] | Surface["evaluationIndividualRequestTwu"];

const programs = [
  {
    name: "Sprint With Us",
    opportunityId: seed.opportunities.closedSprintWithUs.id,
    proposalId: seed.proposals.sprintWithUsOne.id,
    create: (surface: Surface): CreatePage => surface.evaluationIndividualCreateSwu,
    list: (surface: Surface): ListPage => surface.evaluationIndividualListSwu,
    request: (surface: Surface): RequestPage => surface.evaluationIndividualRequestSwu,
    message: "You already have a team question evaluation for this proposal.",
  },
  {
    name: "Team With Us",
    opportunityId: seed.opportunities.closedTeamWithUs.id,
    proposalId: seed.proposals.teamWithUsOne.id,
    create: (surface: Surface): CreatePage => surface.evaluationIndividualCreateTwu,
    list: (surface: Surface): ListPage => surface.evaluationIndividualListTwu,
    request: (surface: Surface): RequestPage => surface.evaluationIndividualRequestTwu,
    message: "You already have a resource question evaluation for this proposal.",
  },
];

async function enterEvaluation(create: CreatePage, score: number, notes: string): Promise<void> {
  for (const order of questions) {
    await create.enterQuestionScore({ order, score });
    await create.enterQuestionNotes({ order, notes });
  }
  await create.saveDraft();
}

for (const program of programs) {
  test(`${statement} (${program.name})`, async ({ surface }) => {
    const { opportunityId, proposalId } = program;
    const create = program.create(surface);
    const list = program.list(surface);
    const request = program.request(surface);

    await surface.scheduledTransitionTrigger.open();
    await surface.scheduledTransitionTrigger.runPendingTransitions();

    await surface.signIn(persona.publicSectorStaff);

    // The given: an evaluator who has already started an evaluation of one proponent.
    await create.open({ opportunityId, proposalId });
    await expect.poll(() => readOrEmpty(() => create.anonymousProponentName()), settle).toBeTruthy();
    const proponent = (await readOrEmpty(() => create.anonymousProponentName())).trim();
    await enterEvaluation(create, 4, "The first evaluation of this answer.");

    await request.open({ proposalId, userId: evaluator });
    await expect.poll(() => readOrEmpty(() => request.evaluationStatus()), settle).toBeTruthy();

    await list.open({ opportunityId });
    await expect.poll(() => readOrEmpty(() => list.proponentRow()), settle).toContain(proponent);
    const before = mentions(await readOrEmpty(() => list.proponentRow()), proponent);
    expect(before).toBeGreaterThan(0);

    // The when: they start a second evaluation of the same proponent.
    try {
      await create.open({ opportunityId, proposalId });
      await enterEvaluation(create, 3, "A second evaluation of the same answer.");
    } catch {
      // A screen that will not start a second evaluation has refused it; what stands is read below.
    }
    await new Promise((resolve) => setTimeout(resolve, quietPeriod));
    const refusal = await readOrEmpty(() => create.duplicateEvaluationError());

    // Where the service was asked for a second evaluation and the screen reports its answer,
    // that answer says they already have one.
    if (refusal) {
      expect(refusal).toContain(program.message);
    }

    // The then: no second evaluation was created; the one they hold still stands.
    await list.open({ opportunityId });
    await expect.poll(() => readOrEmpty(() => list.proponentRow()), settle).toContain(proponent);
    expect(mentions(await readOrEmpty(() => list.proponentRow()), proponent)).toBe(before);

    await request.open({ proposalId, userId: evaluator });
    expect(await readOrEmpty(() => request.evaluationStatus())).toBeTruthy();
  });
}
