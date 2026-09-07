// criterion: @R-1.39 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Each test publishes what it needs to be narrowed down to, then asks for it under a
// condition it meets and under one it does not, so that a filter which did nothing at all
// would fail the second assertion.

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
  proposalDeadline: inDays(45),
  assignmentDate: inDays(60),
  startDate: inDays(70),
  completionDate: inDays(150),
};

test("the opportunity list can be narrowed by program", async ({ surface }) => {
  const title = "R-1.39 published opportunity narrowed by program";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Code With Us" });
  expect(await surface.opportunityList.openGroup()).toContain(title);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Sprint With Us" });
  expect(await surface.opportunityList.openGroup()).not.toContain(title);
});

test("the opportunity list can be narrowed by state", async ({ surface }) => {
  const title = "R-1.39 published opportunity narrowed by state";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByStatus({ status: "Published" });
  expect(await surface.opportunityList.openGroup()).toContain(title);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByStatus({ status: "Draft" });
  expect(await surface.opportunityList.openGroup()).not.toContain(title);
});

test("the opportunity list can be narrowed to remote-friendly opportunities only", async ({ surface }) => {
  const remote = "R-1.39 published opportunity that accepts remote work";
  const onSite = "R-1.39 published opportunity that does not accept remote work";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: remote });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: onSite,
    remoteOk: false,
    remoteDescription: "",
  });

  await surface.opportunityList.open();
  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  const listed = await surface.opportunityList.openGroup();
  expect(listed).toContain(remote);
  expect(listed).not.toContain(onSite);
});

test("the opportunity list can be narrowed by free text matched against title and location", async ({
  surface,
}) => {
  const title = "R-1.39 published opportunity about kittiwakes";
  const elsewhere = "R-1.39 published opportunity in another town";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: elsewhere, location: "Kamloops" });

  await surface.opportunityList.open();
  await surface.opportunityList.search({ text: "kittiwakes" });
  let listed = await surface.opportunityList.openGroup();
  expect(listed).toContain(title);
  expect(listed).not.toContain(elsewhere);

  await surface.opportunityList.open();
  await surface.opportunityList.search({ text: "Kamloops" });
  listed = await surface.opportunityList.openGroup();
  expect(listed).toContain(elsewhere);
  expect(listed).not.toContain(title);
});
