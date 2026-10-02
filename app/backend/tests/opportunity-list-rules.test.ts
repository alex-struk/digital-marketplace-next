import { describe, expect, it } from "vitest";
import { OpportunityStatus, Program } from "../src/rules/opportunities";
import {
  Listable,
  NO_FILTERS,
  counterName,
  groupedForList,
  listGroupOf,
  matchesFilters,
  mayWatch,
  readCounterName,
  statusFiltersFor,
} from "../src/rules/opportunity-list";

const NOW = new Date("2026-10-01T19:00:00Z"); // noon, October 1, Pacific time

function listed(overrides: Partial<Listable> & { id?: string } = {}): Listable & { id: string } {
  return {
    id: "x",
    program: "code-with-us" as Program,
    status: "PUBLISHED" as OpportunityStatus,
    title: "Build an accessible permit tracker",
    location: "Victoria",
    remoteOk: false,
    proposalDeadline: "2026-10-10",
    updatedAt: "2026-09-01T17:00:00.000Z",
    ...overrides,
  };
}

describe("the three groups (R-1.38)", () => {
  it("puts drafts and opportunities under review in the unpublished group", () => {
    expect(listGroupOf(listed({ status: "DRAFT" }), NOW)).toBe("unpublished");
    expect(listGroupOf(listed({ status: "UNDER_REVIEW" }), NOW)).toBe("unpublished");
  });

  it("counts a published opportunity as open only until 4:00 p.m. Pacific time on its deadline", () => {
    expect(listGroupOf(listed({ proposalDeadline: "2026-10-01" }), NOW)).toBe("open");
    expect(listGroupOf(listed({ proposalDeadline: "2026-10-01" }), new Date("2026-10-01T23:00:01Z"))).toBe("closed");
    expect(listGroupOf(listed({ proposalDeadline: "2026-09-30" }), NOW)).toBe("closed");
  });

  it("counts everything published and past, evaluated, awarded or cancelled as closed, whatever its deadline", () => {
    for (const status of ["EVALUATION", "EVAL_QUESTIONS_INDIVIDUAL", "PROCESSING", "AWARDED", "CANCELED"] as const) {
      expect(listGroupOf(listed({ status, proposalDeadline: "2030-01-01" }), NOW)).toBe("closed");
    }
  });

  it("orders open by nearest deadline, closed by most recently closed, unpublished by most recently changed", () => {
    const groups = groupedForList(
      [
        listed({ id: "open-later", proposalDeadline: "2026-11-01" }),
        listed({ id: "open-sooner", proposalDeadline: "2026-10-05" }),
        listed({ id: "closed-long-ago", status: "AWARDED", proposalDeadline: "2025-01-01" }),
        listed({ id: "closed-lately", status: "EVALUATION", proposalDeadline: "2026-09-20" }),
        listed({ id: "draft-old", status: "DRAFT", updatedAt: "2026-08-01T00:00:00.000Z" }),
        listed({ id: "draft-new", status: "UNDER_REVIEW", updatedAt: "2026-09-29T00:00:00.000Z" }),
      ],
      NOW,
    );
    expect(groups.open.map((item) => item.id)).toEqual(["open-sooner", "open-later"]);
    expect(groups.closed.map((item) => item.id)).toEqual(["closed-lately", "closed-long-ago"]);
    expect(groups.unpublished.map((item) => item.id)).toEqual(["draft-new", "draft-old"]);
  });
});

describe("narrowing the list (R-1.39)", () => {
  const swu = listed({ program: "sprint-with-us", status: "EVAL_CC", title: "Licence renewal", location: "Kamloops", remoteOk: true });

  it("narrows by program, state, remote work and words in the title or location, all at once", () => {
    expect(matchesFilters(swu, { ...NO_FILTERS, program: "sprint-with-us" })).toBe(true);
    expect(matchesFilters(swu, { ...NO_FILTERS, program: "code-with-us" })).toBe(false);
    expect(matchesFilters(swu, { ...NO_FILTERS, status: "evaluation" })).toBe(true);
    expect(matchesFilters(swu, { ...NO_FILTERS, status: "published" })).toBe(false);
    expect(matchesFilters(listed(), { ...NO_FILTERS, remoteOnly: true })).toBe(false);
    expect(matchesFilters(swu, { ...NO_FILTERS, remoteOnly: true })).toBe(true);
    expect(matchesFilters(swu, { ...NO_FILTERS, search: "  kAMloops " })).toBe(true);
    expect(matchesFilters(swu, { ...NO_FILTERS, search: "renewal" })).toBe(true);
    expect(matchesFilters(swu, { ...NO_FILTERS, search: "permit" })).toBe(false);
    expect(matchesFilters(swu, { program: "sprint-with-us", status: "evaluation", remoteOnly: true, search: "victoria" })).toBe(false);
  });

  it("offers no processing or cancelled state, and the unpublished ones only to staff", () => {
    expect(statusFiltersFor({ type: "ADMIN" })).toEqual(["draft", "under-review", "published", "evaluation", "awarded"]);
    expect(statusFiltersFor({ type: "GOV" })).toHaveLength(5);
    expect(statusFiltersFor({ type: "VENDOR" })).toEqual(["published", "evaluation", "awarded"]);
    expect(statusFiltersFor(null)).toEqual(["published", "evaluation", "awarded"]);
  });
});

describe("watching and counting", () => {
  it("lets anyone signed in watch an opportunity they did not create (R-1.5)", () => {
    expect(mayWatch({ id: "v", type: "VENDOR" }, { createdBy: "g" })).toBe(true);
    expect(mayWatch({ id: "g", type: "GOV" }, { createdBy: "g" })).toBe(false);
    expect(mayWatch(null, { createdBy: "g" })).toBe(false);
  });

  it("names counters opportunity.<program>.<id>.<kind>, and reads nothing else as one", () => {
    const id = "00000000-0000-4000-8000-000000000601";
    expect(counterName("code-with-us", id, "views")).toBe(`opportunity.code-with-us.${id}.views`);
    expect(readCounterName(`opportunity.code-with-us.${id.toUpperCase()}.views`)).toEqual({
      program: "code-with-us",
      opportunityId: id,
      kind: "views",
    });
    expect(readCounterName(`opportunity.team-with-us.${id}.subscribers`)?.kind).toBe("watchers");
    expect(readCounterName(`opportunity.made-up.${id}.views`)).toBeNull();
    expect(readCounterName(`opportunity.code-with-us.not-an-id.views`)).toBeNull();
    expect(readCounterName(`opportunity.code-with-us.${id}.proposals`)).toBeNull();
    expect(readCounterName("views")).toBeNull();
  });
});
