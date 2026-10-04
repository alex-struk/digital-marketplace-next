import { describe, expect, it } from "vitest";
import {
  anonymousNameAt,
  asksForAnonymous,
  copyIsAnonymous,
  exportedInOrder,
  mayExportAllProposals,
  mayReadOpportunityReport,
} from "../src/rules/exports";

const vendor = { type: "VENDOR" };
const staff = { type: "GOV" };
const administrator = { type: "ADMIN" };

describe("the printable copy of one proposal (R-2.37)", () => {
  it("names a Sprint With Us proponent anonymously to staff while it is judged on its questions", () => {
    for (const status of ["SUBMITTED", "UNDER_REVIEW_QUESTIONS", "EVALUATED_QUESTIONS"]) {
      expect(copyIsAnonymous(staff, "sprint-with-us", status)).toBe(true);
      expect(copyIsAnonymous(administrator, "sprint-with-us", status)).toBe(true);
      expect(copyIsAnonymous(staff, "team-with-us", status)).toBe(true);
    }
  });

  it("names the organization to staff once the proposal reaches the challenge stage", () => {
    for (const status of ["UNDER_REVIEW_CODE_CHALLENGE", "EVALUATED_CODE_CHALLENGE", "UNDER_REVIEW_TEAM_SCENARIO", "AWARDED", "NOT_AWARDED"]) {
      expect(copyIsAnonymous(staff, "sprint-with-us", status)).toBe(false);
    }
    expect(copyIsAnonymous(staff, "team-with-us", "UNDER_REVIEW_CHALLENGE")).toBe(false);
  });

  it("always names the organization to the vendor, and never anonymises Code With Us", () => {
    expect(copyIsAnonymous(vendor, "sprint-with-us", "UNDER_REVIEW_QUESTIONS")).toBe(false);
    expect(copyIsAnonymous(staff, "code-with-us", "UNDER_REVIEW")).toBe(false);
  });

  it("uses the anonymous name given at closing, or the place counted from one", () => {
    expect(anonymousNameAt("Proponent 3", 0)).toBe("Proponent 3");
    expect(anonymousNameAt("", 1)).toBe("Proponent 2");
  });
});

describe("every proposal in one document (R-2.38)", () => {
  it("is for public sector staff and administrators, never a vendor or a visitor", () => {
    expect(mayExportAllProposals(staff)).toBe(true);
    expect(mayExportAllProposals(administrator)).toBe(true);
    expect(mayExportAllProposals(vendor)).toBe(false);
    expect(mayExportAllProposals(null)).toBe(false);
  });

  it("leaves out drafts and withdrawn proposals, and keeps one order by anonymous name", () => {
    const proposals = [
      { id: "a", status: "UNDER_REVIEW_QUESTIONS", anonymousProponentName: "Proponent 10" },
      { id: "b", status: "DRAFT", anonymousProponentName: "" },
      { id: "c", status: "UNDER_REVIEW_QUESTIONS", anonymousProponentName: "Proponent 2" },
      { id: "d", status: "WITHDRAWN", anonymousProponentName: "Proponent 1" },
      { id: "e", status: "SUBMITTED", anonymousProponentName: "" },
    ];
    expect(exportedInOrder(proposals).map((proposal) => proposal.id)).toEqual(["c", "a", "e"]);
  });

  it("keeps the service's order where no anonymous name is given, as in Code With Us", () => {
    const proposals = [
      { id: "x", status: "UNDER_REVIEW" },
      { id: "y", status: "EVALUATED" },
    ];
    expect(exportedInOrder(proposals).map((proposal) => proposal.id)).toEqual(["x", "y"]);
  });

  it("withholds the proponents when the address asks for it", () => {
    expect(asksForAnonymous({ anonymous: "true" })).toBe(true);
    expect(asksForAnonymous({ anonymous: true })).toBe(true);
    expect(asksForAnonymous({})).toBe(false);
    expect(asksForAnonymous({ anonymous: "false" })).toBe(false);
  });
});

describe("the full report of an opportunity (R-1.40)", () => {
  it("is an administrator's alone", () => {
    expect(mayReadOpportunityReport(administrator)).toBe(true);
    expect(mayReadOpportunityReport(staff)).toBe(false);
    expect(mayReadOpportunityReport(vendor)).toBe(false);
    expect(mayReadOpportunityReport(undefined)).toBe(false);
  });
});
