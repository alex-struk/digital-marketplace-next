// criterion: @R-1.14 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The ordering half is asserted by submitting an otherwise complete opportunity with one
// date out of place. The second half — that each date is recorded as 4:00 p.m. Pacific
// time on the day chosen — is not asserted: the surface returns an opportunity's proposal
// deadline as it is shown, and names no observation for the time or the zone it was
// recorded in, nor any observation at all for the three later dates.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  title: "R-1.14 Code With Us opportunity and its key dates",
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

test("an opportunity's proposal deadline may be no earlier than today", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, proposalDeadline: inDays(-1) });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity's key dates must run in order — the proposal deadline, then the assignment date, then the start date, then the completion date", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, assignmentDate: inDays(7) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, startDate: inDays(15) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, completionDate: inDays(22) });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
