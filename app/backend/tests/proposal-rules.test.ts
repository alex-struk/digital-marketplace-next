import { describe, expect, it } from "vitest";
import { recordedInstantOf } from "../src/rules/opportunities";
import {
  ProposalStanding,
  blankIndividual,
  cwuProposalProblems,
  deadlineHasPassed,
  draftProposalProblems,
  hasClosedToProposals,
  hasCurrentTerms,
  isAcceptingProposals,
  mayEditInState,
  mayListOpportunityProposals,
  mayManageProposal,
  mayReadProposal,
  mayStartProposal,
  offeredProposalActions,
  proposalHistoryLabel,
  proposalProblemFromLine,
  proposalRefusalLine,
  readCwuProposalInput,
} from "../src/rules/proposals";

const vendor = { id: "vendor", type: "VENDOR" as const, acceptedTermsAt: "2026-01-05T17:00:00Z", lastAcceptedTermsAt: "2026-01-05T17:00:00Z" };
const staff = { id: "staff", type: "GOV" as const };
const otherStaff = { id: "other-staff", type: "GOV" as const };
const administrator = { id: "admin", type: "ADMIN" as const };

const proposal = (overrides: Partial<ProposalStanding> = {}, closed = true): ProposalStanding => ({
  status: "SUBMITTED",
  createdBy: "vendor",
  organization: "org",
  opportunity: { createdBy: "staff", closed },
  ...overrides,
});

describe("starting and submitting (R-2.1, R-2.3)", () => {
  it("lets only a vendor who has ever accepted the terms start a proposal", () => {
    expect(mayStartProposal(vendor)).toBe(true);
    expect(mayStartProposal({ ...vendor, acceptedTermsAt: null })).toBe(true);
    expect(mayStartProposal({ ...vendor, acceptedTermsAt: null, lastAcceptedTermsAt: null })).toBe(false);
    expect(mayStartProposal({ ...staff, acceptedTermsAt: null, lastAcceptedTermsAt: null })).toBe(false);
    expect(mayStartProposal({ ...administrator, acceptedTermsAt: "x", lastAcceptedTermsAt: "x" })).toBe(false);
    expect(mayStartProposal(null)).toBe(false);
  });

  it("needs the current terms to submit", () => {
    expect(hasCurrentTerms(vendor)).toBe(true);
    expect(hasCurrentTerms({ ...vendor, acceptedTermsAt: null })).toBe(false);
  });
});

describe("the deadline (R-2.15, R-2.23, R-2.25)", () => {
  const deadline = "2026-10-02";
  const closing = recordedInstantOf(deadline);
  const before = new Date(closing.getTime() - 1);
  const after = new Date(closing.getTime());

  it("closes proposals at 4:00 p.m. Pacific time on the deadline", () => {
    expect(closing.toISOString()).toBe("2026-10-02T23:00:00.000Z");
    expect(deadlineHasPassed(deadline, before)).toBe(false);
    expect(deadlineHasPassed(deadline, after)).toBe(true);
  });

  it("accepts proposals only while published and before the deadline", () => {
    expect(isAcceptingProposals({ status: "PUBLISHED", proposalDeadline: deadline }, before)).toBe(true);
    expect(isAcceptingProposals({ status: "PUBLISHED", proposalDeadline: deadline }, after)).toBe(false);
    expect(isAcceptingProposals({ status: "EVALUATION", proposalDeadline: deadline }, before)).toBe(false);
  });

  it("counts an opportunity closed once it is evaluated or its deadline has passed, and never a draft", () => {
    expect(hasClosedToProposals({ status: "PUBLISHED", proposalDeadline: deadline }, before)).toBe(false);
    expect(hasClosedToProposals({ status: "PUBLISHED", proposalDeadline: deadline }, after)).toBe(true);
    expect(hasClosedToProposals({ status: "EVALUATION", proposalDeadline: deadline }, before)).toBe(true);
    expect(hasClosedToProposals({ status: "CANCELED", proposalDeadline: deadline }, before)).toBe(false);
    expect(hasClosedToProposals({ status: "DRAFT", proposalDeadline: deadline }, after)).toBe(false);
  });

  it("lets a draft be edited at any time, and a submitted or withdrawn one only while proposals are accepted", () => {
    expect(mayEditInState("DRAFT", false)).toBe(true);
    expect(mayEditInState("SUBMITTED", true)).toBe(true);
    expect(mayEditInState("WITHDRAWN", false)).toBe(false);
    expect(mayEditInState("UNDER_REVIEW", true)).toBe(false);
  });
});

describe("who reads a proposal, and so its files, in every program (R-2.24, R-2.25, R-8.20)", () => {
  it("gives a vendor their own and their organization's, and never another vendor's", () => {
    expect(mayReadProposal(vendor, proposal(), false)).toBe(true);
    expect(mayReadProposal({ id: "someone", type: "VENDOR" }, proposal(), true)).toBe(true);
    expect(mayReadProposal({ id: "someone", type: "VENDOR" }, proposal(), false)).toBe(false);
    expect(mayReadProposal({ id: "someone", type: "VENDOR" }, proposal({ organization: null }), true)).toBe(false);
    expect(mayManageProposal({ id: "someone", type: "VENDOR" }, proposal(), true)).toBe(true);
    expect(mayManageProposal(administrator, proposal(), false)).toBe(false);
  });

  it("gives staff nothing until the opportunity closes, and then no draft", () => {
    expect(mayReadProposal(staff, proposal({}, false), false)).toBe(false);
    expect(mayReadProposal(administrator, proposal({}, false), false)).toBe(false);
    expect(mayReadProposal(staff, proposal(), false)).toBe(true);
    expect(mayReadProposal(otherStaff, proposal(), false)).toBe(false);
    expect(mayReadProposal(administrator, proposal({ status: "DRAFT" }), false)).toBe(false);
    // A withdrawn proposal is seen by administrators and not by the opportunity's author.
    expect(mayReadProposal(administrator, proposal({ status: "WITHDRAWN" }), false)).toBe(true);
    expect(mayReadProposal(staff, proposal({ status: "WITHDRAWN" }), false)).toBe(false);
    // The Sprint With Us and Team With Us review stages are read alike.
    expect(mayReadProposal(staff, proposal({ status: "UNDER_REVIEW_QUESTIONS" }), false)).toBe(true);
    expect(mayReadProposal(null, proposal(), false)).toBe(false);
  });

  it("lets the author and administrators list an opportunity's proposals only once it has closed (R-1.31)", () => {
    expect(mayListOpportunityProposals(staff, { createdBy: "staff", closed: false })).toBe(false);
    expect(mayListOpportunityProposals(staff, { createdBy: "staff", closed: true })).toBe(true);
    expect(mayListOpportunityProposals(otherStaff, { createdBy: "staff", closed: true })).toBe(false);
    expect(mayListOpportunityProposals(administrator, { createdBy: "staff", closed: true })).toBe(true);
    expect(mayListOpportunityProposals({ id: "v", type: "VENDOR" }, { createdBy: "staff", closed: true })).toBe(false);
  });
});

describe("what the manage page offers (R-2.4, R-2.23)", () => {
  it("offers Delete on a draft only, Withdraw on what was put forward, and Submit on a draft or a withdrawn one", () => {
    expect(offeredProposalActions("DRAFT")).toEqual({ edit: true, submit: true, withdraw: false, delete: true });
    expect(offeredProposalActions("SUBMITTED")).toEqual({ edit: true, submit: false, withdraw: true, delete: false });
    expect(offeredProposalActions("WITHDRAWN")).toEqual({ edit: true, submit: true, withdraw: false, delete: false });
    expect(offeredProposalActions("AWARDED")).toEqual({ edit: false, submit: false, withdraw: true, delete: false });
    expect(offeredProposalActions("DISQUALIFIED")).toEqual({ edit: false, submit: false, withdraw: false, delete: false });
  });

  it("names a proposal's first state as its draft being created", () => {
    expect(proposalHistoryLabel({ status: "DRAFT", event: null })).toBe("Draft created");
    expect(proposalHistoryLabel({ status: "NOT_AWARDED", event: null })).toBe("Not awarded");
  });
});

describe("what a proposal must hold (R-2.12, R-2.13, R-2.14)", () => {
  it("reads an individual or an organization, and attachments by identifier or by record", () => {
    const read = readCwuProposalInput({
      proposalText: "Text",
      proponent: { tag: "organization", value: { id: "ORG-ID", legalName: "x" } },
      attachments: ["A", { id: "b" }, "a", 7],
    });
    expect(read.proponent).toEqual({ tag: "organization", value: "org-id" });
    expect(read.attachments).toEqual(["a", "b"]);
    expect(readCwuProposalInput({}).proponent).toEqual({ tag: "individual", value: blankIndividual() });
  });

  it("asks nothing of a draft but the limits", () => {
    expect(draftProposalProblems(readCwuProposalInput({}))).toEqual([]);
    expect(draftProposalProblems(readCwuProposalInput({ proposalText: "x".repeat(10_001) })).map((p) => p.field)).toEqual(["proposalText"]);
  });

  it("names each field of an incomplete individual in turn", () => {
    const problems = cwuProposalProblems(
      readCwuProposalInput({
        proposalText: "x".repeat(10_001),
        proponent: { tag: "individual", value: { email: "nobody@", phone: "12", country: "Canada" } },
      }),
    );
    expect(problems.map((problem) => problem.field)).toEqual([
      "legalName",
      "email",
      "phone",
      "street1",
      "city",
      "region",
      "mailCode",
      "proposalText",
    ]);
  });

  it("accepts a complete individual, an optional phone and second line left blank", () => {
    const input = readCwuProposalInput({
      proposalText: "We will build it.",
      proponent: {
        tag: "individual",
        value: { legalName: "A", email: "a@example.test", street1: "1 St", city: "V", region: "BC", mailCode: "V8W", country: "Canada" },
      },
    });
    expect(cwuProposalProblems(input)).toEqual([]);
  });

  it("asks only that an organization be chosen", () => {
    expect(cwuProposalProblems(readCwuProposalInput({ proposalText: "t", proponent: { tag: "organization", value: "" } }))).toEqual([
      { field: "organization", message: "Choose the organization this proposal is for" },
    ]);
  });

  it("writes and reads refusal lines by the field's name in the request", () => {
    const line = proposalRefusalLine({ field: "mailCode", message: "Enter a postal code" });
    expect(line).toBe("mailCode: Enter a postal code");
    expect(proposalProblemFromLine(line)).toEqual({ field: "mailCode", message: "Enter a postal code" });
    expect(proposalProblemFromLine("This opportunity is no longer accepting proposals.")).toBeNull();
  });
});
