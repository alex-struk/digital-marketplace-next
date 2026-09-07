// criterion: @R-1.11 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Both tests submit an opportunity complete in every other respect, as an administrator
// publishing it, so a refusal can only be the remote-work fields' doing.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  title: "R-1.11 Code With Us opportunity and its remote-work fields",
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

test("an opportunity that is not a draft must state whether remote work is acceptable", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, remoteOk: null, remoteDescription: "" });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft must carry a remote-work description whenever remote work is acceptable", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, remoteOk: true, remoteDescription: "" });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
