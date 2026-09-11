// criterion: @R-1.11 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Each submission is complete but for the remote-work fields, and each is made as
// something other than a draft, so the fault the form reports can only be theirs. The
// closing case — a remote-work description over 500 characters being rejected whether or
// not remote work is acceptable — is taken with remote work acceptable, which is the half
// the criterion states rather than the half its note adds.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
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
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.11 opportunity that says nothing about remote work",
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("an opportunity that accepts remote work must carry a remote-work description", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.11 opportunity accepting remote work with nothing said about it",
    remoteOk: true,
    remoteDescription: "",
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});

test("a remote-work description of more than 500 characters is rejected", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...complete,
    title: "R-1.11 opportunity whose remote-work description runs too long",
    remoteOk: true,
    remoteDescription: "r".repeat(501),
  });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeTruthy();
});
