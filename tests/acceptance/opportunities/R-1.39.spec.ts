// criterion: @R-1.39 v1
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test puts in place, itself, the opportunities that one condition tells apart,
// confirms that the list shows every one of them before anything is chosen, and then
// chooses a condition. After each choice it checks, separately, that the opportunity
// meeting the condition is still listed and that the other one is no longer listed.
// Every check's message names the moment it was made — before anything was chosen, or
// after which condition — and which half failed.
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

const everyGroup: Group[] = ["unpublishedGroup", "openGroup", "closedGroup"];

async function readable(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

// Everything the list shows, across all of its groups.
async function listed(surface: Surface): Promise<string> {
  const texts: string[] = [];
  for (const group of everyGroup) texts.push(await readable(() => surface.opportunityList[group]()));
  return texts.join("\n");
}

// `when` names the moment of the check, so a failure says whether the opportunity was
// missing before anything was chosen or only after a particular condition was chosen.
async function shows(surface: Surface, title: string, when: string): Promise<void> {
  await expect
    .poll(async () => (await listed(surface)).includes(title), {
      ...settle,
      message: `${when}: "${title}" should be listed, and is not`,
    })
    .toBe(true);
}

async function hides(surface: Surface, title: string, when: string): Promise<void> {
  await expect
    .poll(async () => (await listed(surface)).includes(title), {
      ...settle,
      message: `${when}: "${title}" should no longer be listed, and still is`,
    })
    .toBe(false);
}

async function publish(surface: Surface, fields: Record<string, unknown>): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, ...fields });
}

const beforeAnything = "Before anything is chosen";

test(`${statement} (by program)`, async ({ surface }) => {
  const codeWithUs = "R-1.39 draft Code With Us opportunity narrowed by program";
  const sprintWithUs = "R-1.39 draft Sprint With Us opportunity narrowed by program";
  const beforeProgram = "Before any program is chosen";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: codeWithUs });
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintWithUs });

  await surface.opportunityList.open();
  await shows(surface, codeWithUs, beforeProgram);
  await shows(surface, sprintWithUs, beforeProgram);

  await surface.opportunityList.filterByProgram({ program: "Code With Us" });
  await shows(surface, codeWithUs, 'After program "Code With Us" is chosen, the Code With Us opportunity');
  await hides(surface, sprintWithUs, 'After program "Code With Us" is chosen, the Sprint With Us opportunity');

  await surface.opportunityList.open();
  await shows(surface, codeWithUs, beforeProgram);
  await shows(surface, sprintWithUs, beforeProgram);

  await surface.opportunityList.filterByProgram({ program: "Sprint With Us" });
  await shows(surface, sprintWithUs, 'After program "Sprint With Us" is chosen, the Sprint With Us opportunity');
  await hides(surface, codeWithUs, 'After program "Sprint With Us" is chosen, the Code With Us opportunity');
});

test(`${statement} (by state)`, async ({ surface }) => {
  const published = "R-1.39 published opportunity narrowed by state";
  const draft = "R-1.39 draft opportunity narrowed by state";
  const beforeState = "Before any state is chosen";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: published });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: draft });

  await surface.opportunityList.open();
  await shows(surface, published, beforeState);
  await shows(surface, draft, beforeState);

  await surface.opportunityList.filterByStatus({ status: "Published" });
  await shows(surface, published, 'After state "Published" is chosen, the published opportunity');
  await hides(surface, draft, 'After state "Published" is chosen, the draft opportunity');

  await surface.opportunityList.open();
  await shows(surface, published, beforeState);
  await shows(surface, draft, beforeState);

  await surface.opportunityList.filterByStatus({ status: "Draft" });
  await shows(surface, draft, 'After state "Draft" is chosen, the draft opportunity');
  await hides(surface, published, 'After state "Draft" is chosen, the published opportunity');
});

test(`${statement} (to remote-friendly opportunities only)`, async ({ surface }) => {
  const remote = "R-1.39 published opportunity that accepts remote work";
  const onSite = "R-1.39 published opportunity that does not accept remote work";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: remote });
  await publish(surface, { title: onSite, remoteOk: false, remoteDescription: "" });

  await surface.opportunityList.open();
  await shows(surface, remote, "Before remote-only is ticked");
  await shows(surface, onSite, "Before remote-only is ticked");

  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  await shows(surface, remote, "After remote-only is ticked, the remote-friendly opportunity");
  await hides(surface, onSite, "After remote-only is ticked, the on-site opportunity");
});

test(`${statement} (by free text matched against title and location)`, async ({ surface }) => {
  const byTitle = "R-1.39 published opportunity about kittiwakes";
  const byLocation = "R-1.39 published opportunity in another town";
  const beforeText = "Before any text is searched for";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: byTitle });
  await publish(surface, { title: byLocation, location: "Kamloops" });

  await surface.opportunityList.open();
  await shows(surface, byTitle, beforeText);
  await shows(surface, byLocation, beforeText);

  await surface.opportunityList.search({ text: "kittiwakes" });
  await shows(surface, byTitle, 'After "kittiwakes" is searched for, the opportunity with it in its title');
  await hides(surface, byLocation, 'After "kittiwakes" is searched for, the opportunity without it');

  await surface.opportunityList.open();
  await shows(surface, byTitle, beforeText);
  await shows(surface, byLocation, beforeText);

  await surface.opportunityList.search({ text: "Kamloops" });
  await shows(surface, byLocation, 'After "Kamloops" is searched for, the opportunity with it as its location');
  await hides(surface, byTitle, 'After "Kamloops" is searched for, the opportunity without it');
});

test(`${statement} (only opportunities matching every chosen condition remain visible)`, async ({ surface }) => {
  const both = "R-1.39 remote opportunity about puffins";
  const wordOnly = "R-1.39 on-site opportunity about puffins";
  const remoteOnly = "R-1.39 remote opportunity about gannets";
  const afterBoth = 'After remote-only is ticked and "puffins" is searched for';

  await surface.signIn(persona.administrator);
  await publish(surface, { title: both });
  await publish(surface, { title: wordOnly, remoteOk: false, remoteDescription: "" });
  await publish(surface, { title: remoteOnly });

  await surface.opportunityList.open();
  await shows(surface, both, beforeAnything);
  await shows(surface, wordOnly, beforeAnything);
  await shows(surface, remoteOnly, beforeAnything);

  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  await surface.opportunityList.search({ text: "puffins" });
  await shows(surface, both, `${afterBoth}, the remote opportunity about puffins`);
  await hides(surface, wordOnly, `${afterBoth}, the on-site opportunity about puffins`);
  await hides(surface, remoteOnly, `${afterBoth}, the remote opportunity about gannets`);
});
