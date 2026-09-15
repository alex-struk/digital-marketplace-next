// criterion: @R-1.39 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test publishes what it needs to be narrowed down to, then asks for it under a
// condition it meets and under one it does not. The list narrows a moment after a condition
// is chosen, so after each choice it is read again until what should remain is there and
// what should be gone is gone at the same reading; a list that had not narrowed yet, or never
// narrowed at all, would never satisfy both.
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

async function readable(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

async function publish(surface: Surface, fields: Record<string, unknown>): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, ...fields });
}

async function settlesTo(check: () => Promise<boolean>): Promise<void> {
  await expect.poll(check, settle).toBe(true);
}

test(`${statement} (by program)`, async ({ surface }) => {
  const title = "R-1.39 published opportunity narrowed by program";
  const sprint = seed.opportunities.closedSprintWithUs.title;

  await surface.signIn(persona.administrator);
  await publish(surface, { title });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Code With Us" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    const closed = await readable(() => surface.opportunityList.closedGroup());
    return open.includes(title) && !closed.includes(sprint);
  });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByProgram({ program: "Sprint With Us" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    const closed = await readable(() => surface.opportunityList.closedGroup());
    return closed.includes(sprint) && !open.includes(title);
  });
});

test(`${statement} (by state)`, async ({ surface }) => {
  const published = "R-1.39 published opportunity narrowed by state";
  const draft = "R-1.39 draft opportunity narrowed by state";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: published });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: draft });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByStatus({ status: "Published" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    const unpublished = await readable(() => surface.opportunityList.unpublishedGroup());
    return open.includes(published) && !unpublished.includes(draft);
  });

  await surface.opportunityList.open();
  await surface.opportunityList.filterByStatus({ status: "Draft" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    const unpublished = await readable(() => surface.opportunityList.unpublishedGroup());
    return unpublished.includes(draft) && !open.includes(published);
  });
});

test(`${statement} (to remote-friendly opportunities only)`, async ({ surface }) => {
  const remote = "R-1.39 published opportunity that accepts remote work";
  const onSite = "R-1.39 published opportunity that does not accept remote work";

  await surface.signIn(persona.administrator);
  await publish(surface, { title: remote });
  await publish(surface, { title: onSite, remoteOk: false, remoteDescription: "" });

  await surface.opportunityList.open();
  await surface.opportunityList.filterRemoteOnly({ remoteOnly: true });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    return open.includes(remote) && !open.includes(onSite);
  });
});

test(`${statement} (by free text matched against title and location)`, async ({ surface }) => {
  const title = "R-1.39 published opportunity about kittiwakes";
  const elsewhere = "R-1.39 published opportunity in another town";

  await surface.signIn(persona.administrator);
  await publish(surface, { title });
  await publish(surface, { title: elsewhere, location: "Kamloops" });

  await surface.opportunityList.open();
  await surface.opportunityList.search({ text: "kittiwakes" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    return open.includes(title) && !open.includes(elsewhere);
  });

  await surface.opportunityList.open();
  await surface.opportunityList.search({ text: "Kamloops" });
  await settlesTo(async () => {
    const open = await readable(() => surface.opportunityList.openGroup());
    return open.includes(elsewhere) && !open.includes(title);
  });
});
