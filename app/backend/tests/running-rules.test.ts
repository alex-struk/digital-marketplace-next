import { describe, expect, it } from "vitest";
import { onceEach } from "../src/opportunities/opportunity-running.service";
import {
  OPPORTUNITY_STATES,
  PROGRAMS,
  addendumProblem,
  cancellationNoteProblem,
  changeIsAnnounced,
  isPermittedTransition,
  mayAddAddendum,
  mayAddNote,
  mayCancelOpportunity,
  mayReadCounters,
  maySeeReporting,
  noteProblem,
} from "../src/rules/opportunities";

const admin = { id: "a", type: "ADMIN" } as const;
const author = { id: "g1", type: "GOV" } as const;
const otherStaff = { id: "g2", type: "GOV" } as const;
const vendor = { id: "v", type: "VENDOR" } as const;
const standing = (status: string) => ({ status, createdBy: "g1" }) as never;

describe("cancelling (R-1.28, R-1.20)", () => {
  it("is an administrator's alone", () => {
    expect(mayCancelOpportunity(admin)).toBe(true);
    for (const viewer of [author, otherStaff, vendor, null]) expect(mayCancelOpportunity(viewer)).toBe(false);
  });

  it("is reachable from published, every evaluation stage and processing, and from nothing else, in every program", () => {
    for (const program of PROGRAMS) {
      for (const status of OPPORTUNITY_STATES[program]) {
        const expected = !["DRAFT", "UNDER_REVIEW", "AWARDED", "CANCELED"].includes(status);
        expect(isPermittedTransition(program, status, "CANCELED"), `${program} ${status}`).toBe(expected);
      }
    }
  });

  it("takes an optional note of up to 1,000 characters", () => {
    expect(cancellationNoteProblem(undefined)).toBeNull();
    expect(cancellationNoteProblem("")).toBeNull();
    expect(cancellationNoteProblem("x".repeat(1000))).toBeNull();
    expect(cancellationNoteProblem("x".repeat(1001))).toMatch(/1,000/);
  });
});

describe("addenda (R-1.32, R-1.35)", () => {
  it("are added by an administrator or the author, to anything that is no longer a draft", () => {
    expect(mayAddAddendum(author, standing("PUBLISHED"))).toBe(true);
    expect(mayAddAddendum(admin, standing("CANCELED"))).toBe(true);
    expect(mayAddAddendum(author, standing("UNDER_REVIEW"))).toBe(true);
    expect(mayAddAddendum(author, standing("DRAFT"))).toBe(false);
    expect(mayAddAddendum(admin, standing("DRAFT"))).toBe(false);
    expect(mayAddAddendum(otherStaff, standing("PUBLISHED"))).toBe(false);
    expect(mayAddAddendum(vendor, standing("PUBLISHED"))).toBe(false);
  });

  it("are 1 to 5,000 characters", () => {
    expect(addendumProblem("")).not.toBeNull();
    expect(addendumProblem("   ")).not.toBeNull();
    expect(addendumProblem(undefined)).not.toBeNull();
    expect(addendumProblem("x")).toBeNull();
    expect(addendumProblem("x".repeat(5000))).toBeNull();
    expect(addendumProblem("x".repeat(5001))).toMatch(/5,000/);
  });

  it("are announced unless the opportunity is a draft or cancelled", () => {
    expect(changeIsAnnounced("PUBLISHED")).toBe(true);
    expect(changeIsAnnounced("EVALUATION")).toBe(true);
    expect(changeIsAnnounced("DRAFT")).toBe(false);
    expect(changeIsAnnounced("CANCELED")).toBe(false);
  });
});

describe("private notes (R-1.33)", () => {
  it("go on a Code With Us or Sprint With Us history from an administrator or the author, in any state", () => {
    for (const status of ["DRAFT", "PUBLISHED", "CANCELED"]) {
      expect(mayAddNote("code-with-us", author, standing(status))).toBe(true);
      expect(mayAddNote("sprint-with-us", admin, standing(status))).toBe(true);
    }
    expect(mayAddNote("team-with-us", admin, standing("PUBLISHED"))).toBe(false);
    expect(mayAddNote("code-with-us", otherStaff, standing("PUBLISHED"))).toBe(false);
    expect(mayAddNote("code-with-us", vendor, standing("PUBLISHED"))).toBe(false);
  });

  it("are 1 to 1,000 characters", () => {
    expect(noteProblem("")).not.toBeNull();
    expect(noteProblem("x".repeat(1000))).toBeNull();
    expect(noteProblem("x".repeat(1001))).not.toBeNull();
  });
});

describe("the reporting figures (R-1.30)", () => {
  it("are the author's and administrators', once the opportunity has been published", () => {
    expect(maySeeReporting(author, standing("PUBLISHED"))).toBe(true);
    expect(maySeeReporting(admin, standing("CANCELED"))).toBe(true);
    expect(maySeeReporting(author, standing("DRAFT"))).toBe(false);
    expect(maySeeReporting(admin, standing("UNDER_REVIEW"))).toBe(false);
    expect(maySeeReporting(otherStaff, standing("PUBLISHED"))).toBe(false);
    expect(maySeeReporting(vendor, standing("PUBLISHED"))).toBe(false);
    expect(maySeeReporting(null, standing("PUBLISHED"))).toBe(false);
  });

  it("come from counts only public sector staff and administrators may read by name", () => {
    expect(mayReadCounters(admin)).toBe(true);
    expect(mayReadCounters(author)).toBe(true);
    expect(mayReadCounters(vendor)).toBe(false);
    expect(mayReadCounters(null)).toBe(false);
  });
});

describe("who is told (R-1.35)", () => {
  it("tells each address once, whatever its case, keeping the place of one with no address", () => {
    expect(
      onceEach([{ email: "a@example.test" }, { email: "A@example.test" }, { email: null }, { email: "b@example.test" }]),
    ).toEqual(["a@example.test", null, "b@example.test"]);
  });
});
