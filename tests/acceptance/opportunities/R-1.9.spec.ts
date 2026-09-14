// criterion: @R-1.9 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The draft is saved with nothing but a title, which is the criterion's "fields still
// blank". That it was accepted is read as the opportunity having an identifier of its own
// and the form naming no fault.
//
// The proposal deadline comes back as free text, and no observation says in which shape,
// so the fourteen-day rule is asserted by the day of the month and the year of that day
// both standing in whatever the deadline is shown as. The completion date being left empty
// is not asserted: no observation on any of the three opportunity views returns it.

function fourteenDaysFromToday(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
}

test("an opportunity saved as a draft is accepted with incomplete content", async ({ surface }) => {
  const title = "R-1.9 draft saved with nothing but a title";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
  expect(await surface.opportunityCwuEdit.opportunityIdentifier()).toBeTruthy();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toContain(title);
});

test("a draft whose proposal deadline is missing is given one fourteen days from the day of saving", async ({
  surface,
}) => {
  const title = "R-1.9 draft saved with no proposal deadline";
  const expected = fourteenDaysFromToday();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  const deadline = await surface.opportunityCwuView.proposalDeadline();
  expect(deadline).toBeTruthy();
  expect(deadline).toContain(String(expected.getDate()));
  expect(deadline).toContain(String(expected.getFullYear()));
});
