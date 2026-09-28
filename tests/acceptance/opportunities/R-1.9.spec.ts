// criterion: @R-1.9 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona } from "../../fixtures";

// The draft is saved with nothing but a title, which is the criterion's "fields still
// blank". That it was stored is read as the opportunity having an identifier of its own and
// appearing among its author's opportunities; that no content validation error was raised
// is read as the form naming no fault.
//
// Dates are shown in Pacific time, so "fourteen days from the day of saving" is the
// calendar day in America/Vancouver, never the day in whatever zone the runner happens to
// be in. The day is taken just before and just after saving, so a save that straddles
// midnight Pacific accepts either day. The deadline comes back as free text in no promised
// shape, so it is asserted by the day of the month (as a whole number) and the year of
// the expected day both standing in it.
//
// The assignment date, the start date, the completion date being left empty, and dates
// that are invalid rather than missing are owed by the entry in not-testable.yaml.

const PACIFIC = "America/Vancouver";

function pacificDayInFourteenDays(): { day: number; year: number } {
  const later = new Date(Date.now() + 14 * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(later);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { day: part("day"), year: part("year") };
}

function showsDay(shown: string, expected: { day: number; year: number }): boolean {
  const day = new RegExp(`(^|\\D)0?${expected.day}(\\D|$)`);
  return day.test(shown) && shown.includes(String(expected.year));
}

test("An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.", async ({
  surface,
}) => {
  const title = "R-1.9 draft saved with nothing but a title";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();

  const before = pacificDayInFourteenDays();
  await surface.opportunityCwuCreate.saveDraft({ title });
  const after = pacificDayInFourteenDays();

  expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toContain(title);

  await surface.opportunityCwuView.open({ opportunityId });
  const deadline = await surface.opportunityCwuView.proposalDeadline();
  expect(deadline).toBeTruthy();
  expect(
    showsDay(deadline, before) || showsDay(deadline, after),
    `proposal deadline "${deadline}" should be ${before.year}-${before.day} (Pacific) or, across midnight, ${after.year}-${after.day}`,
  ).toBe(true);
});
