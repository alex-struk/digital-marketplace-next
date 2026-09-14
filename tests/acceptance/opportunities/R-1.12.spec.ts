// criterion: @R-1.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Three submissions, each complete but for the one thing the criterion bounds. The two
// values just outside the range are taken rather than values far outside it, so a form
// that bounded the reward somewhere else would not satisfy them.

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
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("a Code With Us opportunity offering a reward below one dollar is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.12 Code With Us opportunity offering nothing",
    reward: 0,
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us opportunity offering a reward above seventy thousand dollars is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.12 Code With Us opportunity offering more than the ceiling",
    reward: 70001,
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us opportunity naming no skill is rejected", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.12 Code With Us opportunity naming no skill",
    reward: 5000,
    skills: [],
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
