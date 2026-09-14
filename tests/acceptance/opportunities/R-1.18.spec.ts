// criterion: @R-1.18 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's given and when are the submission of a Team With Us opportunity that is
// not a draft, so each opportunity below is published rather than saved, and the rejection
// is read after that submission rather than after the resource is added. Every opportunity
// is complete in every other respect — a question, a panel, a budget and weights totalling
// one hundred — and its one resource is well formed but for the one thing the criterion
// bounds. The allocations taken are the two values just outside the range rather than
// values far outside it, so a form that bounded the allocation somewhere else would not
// satisfy them.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  maxBudget: 500000,
  questionsWeight: 30,
  challengeWeight: 40,
  priceWeight: 30,
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const sound = { serviceArea: "Full Stack Developer", targetAllocation: 100 };

async function prepare(surface: Surface, resource: typeof sound): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource(resource);
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [seed.users.staffOne, seed.users.administratorOne],
    chair: seed.users.administratorOne,
  });
}

test("a Team With Us resource whose target allocation is below one per cent is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepare(surface, { ...sound, targetAllocation: 0 });
  await surface.opportunityTwuCreate.publish({
    ...complete,
    title: "R-1.18 Team With Us opportunity with a resource allocated below one per cent",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us resource whose target allocation is above one hundred per cent is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepare(surface, { ...sound, targetAllocation: 101 });
  await surface.opportunityTwuCreate.publish({
    ...complete,
    title: "R-1.18 Team With Us opportunity with a resource allocated above one hundred per cent",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us resource naming a service area the service does not recognise is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepare(surface, { ...sound, serviceArea: "Lighthouse Keeper" });
  await surface.opportunityTwuCreate.publish({
    ...complete,
    title: "R-1.18 Team With Us opportunity with a resource in an unrecognised service area",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});
