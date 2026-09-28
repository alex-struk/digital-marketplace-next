// criterion: @R-1.9 v2
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The draft is saved with nothing but a title and whichever dates the case enters. That it
// was stored is read as the opportunity having an identifier of its own and appearing among
// its author's opportunities; that no content validation error was raised is read as the
// form naming no fault.
//
// The dates are read back on each program's manage screen, the one place all the dates an
// opportunity holds itself can be read. A Sprint With Us opportunity holds only a proposal
// deadline and an assignment date; its start and completion dates are its phases', so the
// start-date and completion-date clauses are asserted on Code With Us and Team With Us.
//
// An invalid date is 2000-01-01, which the contract names as invalid for all four whatever
// else is entered. A missing date is a key left out of save_draft's input.
//
// Dates are shown in Pacific time, so "fourteen days from the day of saving" is the
// calendar day in America/Vancouver, never the day in whatever zone the runner happens to
// be in. The day is taken just before and just after saving, so a save that straddles
// midnight Pacific accepts either day. A date comes back as a calendar day in no promised
// shape, so it is asserted by the day of the month (as a whole number) and the year of the
// expected day both standing in it — which 2000-01-01 left in place would not satisfy.

const STATEMENT =
  "An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.";

const PACIFIC = "America/Vancouver";
const INVALID_DATE = "2000-01-01";

type Day = { day: number; year: number };

function pacificDayInFourteenDays(): Day {
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

function showsDay(shown: string, expected: Day): boolean {
  const day = new RegExp(`(^|\\D)0?${expected.day}(\\D|$)`);
  return day.test(shown) && shown.includes(String(expected.year));
}

function expectFourteenDaysOn(name: string, shown: string, before: Day, after: Day) {
  expect(shown, `${name} should be set`).toBeTruthy();
  expect(
    showsDay(shown, before) || showsDay(shown, after),
    `${name} "${shown}" should be ${before.year}-${before.day} (Pacific) or, across midnight, ${after.year}-${after.day}`,
  ).toBe(true);
}

type DateKey = "proposal_deadline" | "assignment_date" | "start_date" | "completion_date";

type Program = {
  name: string;
  // The dates the program's opportunity holds itself, and so the ones save_draft takes.
  dates: DateKey[];
  create: (s: Surface) => {
    open(): Promise<void>;
    saveDraft(input?: unknown): Promise<void>;
    fieldError(): Promise<string>;
  };
  edit: (s: Surface) => {
    open(params: { opportunityId: string }): Promise<void>;
    opportunityIdentifier(): Promise<string>;
    proposalDeadline(): Promise<string>;
    assignmentDate(): Promise<string>;
    startDate?(): Promise<string>;
    completionDate?(): Promise<string>;
  };
};

const programs: Program[] = [
  {
    name: "Code With Us",
    dates: ["proposal_deadline", "assignment_date", "start_date", "completion_date"],
    create: (s) => s.opportunityCwuCreate,
    edit: (s) => s.opportunityCwuEdit,
  },
  {
    name: "Sprint With Us",
    dates: ["proposal_deadline", "assignment_date"],
    create: (s) => s.opportunitySwuCreate,
    edit: (s) => s.opportunitySwuEdit,
  },
  {
    name: "Team With Us",
    dates: ["proposal_deadline", "assignment_date", "start_date", "completion_date"],
    create: (s) => s.opportunityTwuCreate,
    edit: (s) => s.opportunityTwuEdit,
  },
];

const cases = [
  { how: "missing", enter: (_dates: DateKey[]) => ({}) },
  {
    how: "invalid",
    enter: (dates: DateKey[]) =>
      Object.fromEntries(dates.map((key) => [key, INVALID_DATE])),
  },
] as const;

test.describe(STATEMENT, () => {
  for (const program of programs) {
    for (const c of cases) {
      test(`${program.name}: a draft whose dates are ${c.how} is accepted, its proposal deadline, assignment date and start date are set to fourteen days from the day of saving, and its completion date is left empty`, async ({
        surface,
      }) => {
        const title = `R-1.9 ${program.name} draft with ${c.how} dates`;

        await surface.signIn(persona.publicSectorStaff);
        const create = program.create(surface);
        await create.open();

        const before = pacificDayInFourteenDays();
        await create.saveDraft({ title, ...c.enter(program.dates) });
        const after = pacificDayInFourteenDays();

        expect(await create.fieldError()).toBeFalsy();
        const edit = program.edit(surface);
        const opportunityId = await edit.opportunityIdentifier();
        expect(opportunityId).toBeTruthy();

        await surface.opportunityDashboard.open();
        expect(await surface.opportunityDashboard.myOpportunitiesTable()).toContain(title);

        await edit.open({ opportunityId });
        expectFourteenDaysOn("proposal deadline", await edit.proposalDeadline(), before, after);
        expectFourteenDaysOn("assignment date", await edit.assignmentDate(), before, after);
        if (program.dates.includes("start_date")) {
          expectFourteenDaysOn("start date", await edit.startDate!(), before, after);
        }
        if (program.dates.includes("completion_date")) {
          expect(await edit.completionDate!(), "completion date should be left empty").toBeFalsy();
        }
      });
    }
  }
});
