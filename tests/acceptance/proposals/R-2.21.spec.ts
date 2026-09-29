// criterion: @R-2.21 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every test publishes the same Team With Us opportunity: one Full Stack Developer resource
// and one resource question with a word limit of thirty. Then it submits the same proposal
// through proposal-team-request: the seed's qualified organization, which provides that
// service area and has accepted the program's terms, with its administrator as the one team
// member. The only thing that changes from one test to the next is the answer to the
// opportunity's question. Nothing on the proposal form has to be filled in first; the request
// carries the whole proposal.
//
// A response "numbered against no question" is an answer given for question order 1 when the
// opportunity asks only question 0. It is sent beside a proper answer to question 0, so the
// only answer the service can object to is the one that answers nothing it asked.

const statement =
  "A response to an opportunity question is rejected if it is empty or longer than the word limit that question carries, or if it answers a question the opportunity does not ask.";

const noMatchingQuestion = "No matching opportunity question.";

const settle = { timeout: 30000 };
const wordLimit = 30;
const withinLimit = "Our developer built and ran the same kind of service for a Crown corporation.";
const overLimit = Array.from({ length: wordLimit * 3 }, () => "delivery").join(" ");

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100, order: 0 });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await expect
    .poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle)
    .toBeTruthy();
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function submitWithAnswers(
  surface: Surface,
  title: string,
  answers: Array<{ order: number; response: string }>,
): Promise<void> {
  const opportunityId = await publishTeamOpportunity(surface, title);
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTeamRequest.open({ program: "team-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization: seed.organizations.qualified,
    team: [{ member: seed.users.organizationAdmin, resource: "Full Stack Developer", hourlyRate: 100 }],
    answers,
  });
  await expect
    .poll(
      async () =>
        (await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())) ||
        (await readOrEmpty(() => surface.proposalTeamRequest.refusalStatus())),
      { ...settle, message: "the service answered the submission" },
    )
    .toBeTruthy();
}

async function expectRejected(surface: Surface, what: string): Promise<string> {
  expect(await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted()), what).toBeFalsy();
  const messages = await readOrEmpty(() => surface.proposalTeamRequest.refusalMessages());
  expect(messages, what).toBeTruthy();
  return messages;
}

test(`${statement} (an empty response is rejected)`, async ({ surface }) => {
  test.setTimeout(180000);
  await submitWithAnswers(surface, "R-2.21 opportunity whose question is answered with nothing", [
    { order: 0, response: "" },
  ]);
  await expectRejected(surface, "an empty response was accepted");
});

test(`${statement} (a response longer than the question's word limit is rejected)`, async ({ surface }) => {
  test.setTimeout(180000);
  await submitWithAnswers(surface, "R-2.21 opportunity whose question is answered past its word limit", [
    { order: 0, response: overLimit },
  ]);
  const messages = await expectRejected(surface, "a response over the word limit was accepted");
  expect(messages, "a response to a question the opportunity asks was reported as matching no question").not.toContain(
    noMatchingQuestion,
  );
});

test(`${statement} (a response to a question the opportunity does not ask is rejected)`, async ({ surface }) => {
  test.setTimeout(180000);
  await submitWithAnswers(surface, "R-2.21 opportunity answered on a question it does not ask", [
    { order: 0, response: withinLimit },
    { order: 1, response: withinLimit },
  ]);
  const messages = await expectRejected(surface, "a response to a question the opportunity does not ask was accepted");
  expect(messages).toContain(noMatchingQuestion);
});
