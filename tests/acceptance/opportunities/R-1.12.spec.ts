// criterion: @R-1.12 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  title: "R-1.12 Code With Us opportunity and its reward",
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("a Code With Us opportunity must offer a reward of at least $1", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, reward: 0 });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us opportunity must offer a reward of at most $70,000", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, reward: 70001 });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us opportunity must name at least one skill", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, skills: [] });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
