// criterion: @R-1.9 v2
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The date the service is expected to choose is fourteen days from the day of saving, so
// the test works it out from the clock of the machine it runs on and looks for the year
// and the day of the month in whatever form the deadline is shown in, rather than
// assuming a format.
//
// The third clause — that the completion date is left empty — is not asserted: the
// surface returns an opportunity's proposal deadline but names no observation for its
// assignment, start or completion dates.

function inDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

test("an opportunity saved as a draft is accepted with incomplete content", async ({ surface }) => {
  const title = "R-1.9 draft saved with fields still blank";
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toContain(title);
});

test("a proposal deadline that is missing is set to fourteen days from the day of saving", async ({
  surface,
}) => {
  const title = "R-1.9 draft saved with no proposal deadline";
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  await surface.opportunityCwuView.open({ title });
  const deadline = await surface.opportunityCwuView.proposalDeadline();
  const expected = inDays(14);
  expect(deadline).toBeTruthy();
  expect(deadline).toContain(String(expected.getFullYear()));
  expect(deadline).toContain(String(expected.getDate()));
});
