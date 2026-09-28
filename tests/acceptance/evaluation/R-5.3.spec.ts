// criterion: @R-5.3 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each program has a seeded opportunity at individual evaluation in which the government
// account already holds a draft evaluation of the first proponent, scored 3, 3, 3, 3, and
// nothing of the second.
//
// Signed in as that evaluator, the test asks the service to start an evaluation of the first
// proponent — the request the create screen sends — with different scores. The service must
// refuse it, answering that they already have one, and the evaluation they hold must still
// read exactly as it did. The same request for the second proponent is a first attempt and
// must be accepted with no refusal, which is what shows that the first was refused for
// already holding one rather than for any other reason.

const statement =
  "An evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one.";

const settle = { timeout: 15000 };
const evaluator = seed.users.staffOne.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

type RequestPage = Surface["evaluationIndividualRequestSwu"] | Surface["evaluationIndividualRequestTwu"];

const programs = [
  {
    name: "Sprint With Us",
    alreadyEvaluated: seed.proposals.swuAlreadyBegunEvaluated.id,
    notYetEvaluated: seed.proposals.swuAlreadyBegunUntouched.id,
    request: (surface: Surface): RequestPage => surface.evaluationIndividualRequestSwu,
  },
  {
    name: "Team With Us",
    alreadyEvaluated: seed.proposals.twuAlreadyBegunEvaluated.id,
    notYetEvaluated: seed.proposals.twuAlreadyBegunUntouched.id,
    request: (surface: Surface): RequestPage => surface.evaluationIndividualRequestTwu,
  },
];

const anotherEvaluation = {
  status: "DRAFT",
  questions: [0, 1, 2, 3].map((order) => ({ order, score: 5, notes: `A second evaluation of question ${order + 1}.` })),
};

for (const program of programs) {
  test(`${statement} (${program.name})`, async ({ surface }) => {
    const request = program.request(surface);

    await surface.signIn(persona.publicSectorStaff);

    // The given: the evaluator already holds an evaluation of this proponent.
    await request.open({ proposalId: program.alreadyEvaluated, userId: evaluator });
    await expect.poll(() => readOrEmpty(() => request.storedScores()), settle).toBeTruthy();
    const heldBefore = await readOrEmpty(() => request.storedScores());
    expect(await readOrEmpty(() => request.evaluationStatus())).toBeTruthy();

    // The when: they attempt a second one.
    await request.createEvaluationByRequest(anotherEvaluation);

    // The then: it is refused, with a message saying they already have one.
    expect(await readOrEmpty(() => request.evaluationCreated()), "a second evaluation was accepted").toBeFalsy();
    const refusal = await readOrEmpty(() => request.creationRefusalMessage());
    expect(refusal.toLowerCase()).toMatch(/already have/);

    // And the one they hold is the only one: it still reads as it did.
    await request.open({ proposalId: program.alreadyEvaluated, userId: evaluator });
    await expect.poll(() => readOrEmpty(() => request.storedScores()), settle).toBe(heldBefore);

    // A first attempt on a proponent they have not evaluated is accepted, so the refusal
    // above was for already holding one.
    await request.open({ proposalId: program.notYetEvaluated, userId: evaluator });
    await request.createEvaluationByRequest(anotherEvaluation);
    expect(await readOrEmpty(() => request.evaluationCreated()), "a first evaluation was refused").toBeTruthy();
    expect(await readOrEmpty(() => request.creationRefusalMessage())).toBeFalsy();
  });
}
