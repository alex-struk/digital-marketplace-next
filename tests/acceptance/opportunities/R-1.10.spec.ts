// criterion: @R-1.10 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Each submission below is complete but for the one field the criterion names, and is made
// as something other than a draft, so the fault the form reports can only be that field's.
// That the offending field is named is read from the form's own field error rather than
// from a message this test writes for it.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  title: "R-1.10 an otherwise complete opportunity",
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

test("an opportunity that is not a draft is rejected when its title is missing", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "" });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its title is over 200 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "t".repeat(201) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its teaser is over 500 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, teaser: "t".repeat(501) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its location is missing", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, location: "" });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its description is missing", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, description: "" });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its description is over 10,000 characters", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, description: "d".repeat(10001) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
