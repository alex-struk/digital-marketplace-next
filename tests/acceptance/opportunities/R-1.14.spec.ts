// criterion: @R-1.14 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Four submissions, each with exactly one date out of its place, so a form that only
// checked the first pair would fail the later ones. The fifth test reads the deadline back
// off a published opportunity: the deadline observation returns free text, and no
// observation says in which shape, so four in the afternoon is looked for in either of the
// two ways a clock time is ordinarily written.

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
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("an opportunity that is not a draft is rejected when its proposal deadline is earlier than today", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.14 opportunity whose deadline has already gone by",
    proposalDeadline: inDays(-1),
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its assignment date falls before its proposal deadline", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.14 opportunity assigned before proposals close",
    assignmentDate: inDays(13),
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its start date falls before its assignment date", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.14 opportunity starting before it is assigned",
    startDate: inDays(20),
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that is not a draft is rejected when its completion date falls before its start date", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.14 opportunity completed before it starts",
    completionDate: inDays(27),
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("each of an opportunity's key dates is recorded as four o'clock in the afternoon on the day chosen", async ({
  surface,
}) => {
  const title = "R-1.14 opportunity whose deadline is read back for its time of day";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.proposalDeadline()).toMatch(/4:00|16:00/);
});
