import { describe, expect, it } from "vitest";
import { OpportunityViewer } from "../src/rules/opportunities";
import { SWU_BUDGET_MAX, creationDecision, draftOf } from "../src/rules/other-program-drafts";

const ADMIN: OpportunityViewer = { id: "admin-1", type: "ADMIN" };
const STAFF: OpportunityViewer = { id: "staff-1", type: "GOV" };
const VENDOR: OpportunityViewer = { id: "vendor-1", type: "VENDOR" };

describe("creating a Sprint With Us or Team With Us opportunity before slice 10 (R-1.7, R-1.48)", () => {
  it("accepts a draft from public sector staff and administrators, a draft being what is asked for when nothing is", () => {
    expect(creationDecision(STAFF, { status: "DRAFT" })).toBe("DRAFT");
    expect(creationDecision(STAFF, {})).toBe("DRAFT");
    expect(creationDecision(ADMIN, { title: "x" })).toBe("DRAFT");
  });

  it("refuses a public sector employee who asks for it published, naming the rule", () => {
    expect(creationDecision(STAFF, { status: "PUBLISHED" })).toEqual({ kind: "only-administrators-publish" });
  });

  it("refuses anyone who is not public sector staff", () => {
    expect(creationDecision(VENDOR, { status: "DRAFT" })).toEqual({ kind: "not-permitted" });
    expect(creationDecision(null, {})).toEqual({ kind: "not-permitted" });
  });

  it("refuses a state an opportunity cannot be created in", () => {
    expect(creationDecision(ADMIN, { status: "AWARDED" })).toEqual({ kind: "unknown-state" });
  });

  it("says that submitting for review or publishing is not offered yet, since the program's content cannot be entered", () => {
    expect(creationDecision(STAFF, { status: "UNDER_REVIEW" })).toEqual({ kind: "not-yet-offered" });
    expect(creationDecision(ADMIN, { status: "PUBLISHED" })).toEqual({ kind: "not-yet-offered" });
  });
});

describe("what a draft keeps (R-1.9 in the other two programs)", () => {
  const today = "2026-10-01";

  it("keeps a title alone, setting the missing dates fourteen days ahead and no budget", () => {
    expect(draftOf("sprint-with-us", { title: "Only a title" }, today)).toEqual({
      title: "Only a title",
      teaser: "",
      remoteOk: false,
      remoteDesc: "",
      location: "",
      budget: 0,
      description: "",
      proposalDeadline: "2026-10-15",
      assignmentDate: "2026-10-15",
      startDate: null,
      completionDate: null,
    });
  });

  it("keeps the dates given in order, and replaces one earlier than the one it must follow", () => {
    const draft = draftOf(
      "team-with-us",
      { proposalDeadline: "2026-11-02", assignmentDate: "2026-10-20", startDate: "2026-12-01", completionDate: "2026-11-30" },
      today,
    );
    expect(draft.proposalDeadline).toBe("2026-11-02");
    expect(draft.assignmentDate).toBe("2026-10-15");
    expect(draft.startDate).toBe("2026-12-01");
    expect(draft.completionDate).toBeNull();
    expect(draftOf("sprint-with-us", { proposalDeadline: "2000-01-01" }, today).proposalDeadline).toBe("2026-10-15");
  });

  it("reads each program's budget by its own name and remote work as a yes or no", () => {
    expect(draftOf("sprint-with-us", { totalMaxBudget: SWU_BUDGET_MAX, maxBudget: 3 }, today).budget).toBe(SWU_BUDGET_MAX);
    expect(draftOf("team-with-us", { totalMaxBudget: 3, maxBudget: "$120,000" }, today).budget).toBe(120_000);
    expect(draftOf("team-with-us", { maxBudget: 1.5 }, today).budget).toBe(0);
    expect(draftOf("team-with-us", { remoteOk: true }, today).remoteOk).toBe(true);
    expect(draftOf("team-with-us", { remoteOk: "no" }, today).remoteOk).toBe(false);
  });
});
