// criterion: @R-1.18 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is complete but for its one resource, which is given in turn an
// allocation outside 1 to 100 and a service area that is not one of the recognised ones.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
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
};

async function prepareWithoutResources(surface: Surface): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelEvaluator,
  });
}

test("each resource on a Team With Us opportunity names a target allocation between 1 and 100 per cent of full time", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await prepareWithoutResources(surface);
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 0 });
  await surface.opportunityTwuCreate.publish({
    ...details,
    title: "R-1.18 Team With Us opportunity with a resource allocated nothing",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();

  await prepareWithoutResources(surface);
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 101 });
  await surface.opportunityTwuCreate.publish({
    ...details,
    title: "R-1.18 Team With Us opportunity with a resource allocated more than full time",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("each resource on a Team With Us opportunity names one service area", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await prepareWithoutResources(surface);
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Cheesemonger", targetAllocation: 100 });
  await surface.opportunityTwuCreate.publish({
    ...details,
    title: "R-1.18 Team With Us opportunity with an unrecognised service area",
  });

  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});
