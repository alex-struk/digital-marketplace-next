// criterion: @R-1.39 v1
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test puts in place two opportunities that one condition tells apart, confirms that
// the list shows both before anything is chosen, and then chooses a condition. After each
// choice it checks, separately, that the opportunity meeting the condition is still listed
// and that the other one is no longer listed, so a failure says which half did not hold.
// The list may narrow a moment after a condition is chosen, so each half is read again
// until it holds or the wait runs out.
//
// A group with nothing left in it may not be readable at all, and that is read as empty.

const statement =
  "The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.";

const settle = { timeout: 15000 };

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: pacificDay(45),
  assignmentDate: pacificDay(60),
  startDate: pacificDay(70),
  completionDate: pacificDay(150),
};

type Group = "unpublishedGroup" | "openGroup" | "closedGroup";

async function readable(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

// Everything the list shows, across all of its groups.
async function listed(surface: Surface, groups: Group[]): Promise<string> {
  const texts: string[] = [];
  for (const group of groups) texts.push(await readable(() => surface.opportunityList[group]()));
  return texts.join("\n");
}

async function shows(surface: Surface, groups: Group[], title: string): Promise<void> {
  await expect
    .poll(async () => (await listed(surface, groups)).includes(title), { ...settle, message: `"${title}" is listed` })
    .toBe(true);
}

async function hides(surface: Surface, groups: Group[], title: string): Promise<void> {
  await expect
    .poll(async () => (await listed(surface, groups)).includes(title), { ...settle, message: `"${title}" is no longer listed` })
    .toBe(false);
}

async function publish(surface: Surface, fields: Record<string, unknown>): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, ...fields });
}

const everyGroup: Group[] = ["unpublishedGroup", "openGroup", "closedGroup"];

test(`${statement} (by program)`, async ({ surface }) => {
  const codeWithUs = "R-1.39 published Code With Us opportunity narrowed by program";
  const sprintWithUs = seed.opportunities.closedSprintWithUs.title;

  await surface.signIn(persona.administrator);
  await publish(surface, { title: codeWithUs });

  await surface.opportunityList.open();
  await shows(surface, everyGroup, codeWithUs);
  await shows(surface, everyGroup, sprintWithUs);

  await surface.opportunityList.filterByProgram({ program: "Code With Us" });
  await shows(surface, everyGroup, codeWithUs);
  await hides(surface, everyGroup, sprintWithUs);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Sprint With Us" });
  await shows(surface, everyGroup, sprintWithUs);
  await hides(surface, everyGroup, codeWithUs);
});

test(`${statement} (by state)`, async ({ surface }) => {
  const published = "R-1.39 published opportunity narrowed by state";
  const draft = "R-1.39 draft opportunity narrowed by state";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: published });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: draft });

  await surface.opportunityList.open();
  await shows(surface, everyGroup, published);
  await shows(surface, everyGroup, draft);

  await surface.opportunityList.filterByStatus({ status: "Published" });
  await shows(surface, everyGroup, published);
  await hides(surface, everyGroup, draft);

  await surface.opportunityList.open();
  await surface.opportunityList.filterByStatus({ status: "Draft" });
  await shows(surface, everyGroup, draft);
  await hides(surface, everyGroup, published);
});

test(`${statement} (to remote-friendly opportunities only)`, async ({ surface }) => {
  const remote = "R-1.39 published opportunity that accepts remote work";
  const onSite = "R-1.39 published opportunity that does not accept remote work";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: remote });
  await publish(surface, { title: onSite, remoteOk: false, remoteDescription: "" });

  await surface.opportunityList.open();
  await shows(surface, everyGroup, remote);
  await shows(surface, everyGroup, onSite);

  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  await shows(surface, everyGroup, remote);
  await hides(surface, everyGroup, onSite);
});

test(`${statement} (by free text matched against title and location)`, async ({ surface }) => {
  const byTitle = "R-1.39 published opportunity about kittiwakes";
  const byLocation = "R-1.39 published opportunity in another town";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: byTitle });
  await publish(surface, { title: byLocation, location: "Kamloops" });

  await surface.opportunityList.open();
  await shows(surface, everyGroup, byTitle);
  await shows(surface, everyGroup, byLocation);

  await surface.opportunityList.search({ text: "kittiwakes" });
  await shows(surface, everyGroup, byTitle);
  await hides(surface, everyGroup, byLocation);

  await surface.opportunityList.open();
  await surface.opportunityList.search({ text: "Kamloops" });
  await shows(surface, everyGroup, byLocation);
  await hides(surface, everyGroup, byTitle);
});

test(`${statement} (only opportunities matching every chosen condition remain visible)`, async ({ surface }) => {
  const both = "R-1.39 remote opportunity about puffins";
  const wordOnly = "R-1.39 on-site opportunity about puffins";
  const remoteOnly = "R-1.39 remote opportunity about gannets";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: both });
  await publish(surface, { title: wordOnly, remoteOk: false, remoteDescription: "" });
  await publish(surface, { title: remoteOnly });

  await surface.opportunityList.open();
  await shows(surface, everyGroup, both);
  await shows(surface, everyGroup, wordOnly);
  await shows(surface, everyGroup, remoteOnly);

  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  await surface.opportunityList.search({ text: "puffins" });
  await shows(surface, everyGroup, both);
  await hides(surface, everyGroup, wordOnly);
  await hides(surface, everyGroup, remoteOnly);
});
