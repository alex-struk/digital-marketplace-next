// criterion: @R-1.10 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Every test here submits an opportunity that is complete but for the one field it is
// about, so a refusal can only be that field's doing. The submission is made as an
// administrator publishing it, which is the path that validates content in full and
// names the offending field; submitting a draft for review is the weaker check that
// R-1.21 covers.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  title: "R-1.10 complete Code With Us opportunity",
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
  completionDate: inDays(35),
};

test("an opportunity that is not a draft is rejected unless it carries a title", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "" });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected unless its title is at most 200 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "t".repeat(201) });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected unless its teaser is at most 500 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, teaser: "t".repeat(501) });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected unless it carries a location", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, location: "" });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected unless it carries a description of 1 to 10,000 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, description: "" });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, description: "d".repeat(10001) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
