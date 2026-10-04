import { describe, expect, it } from "vitest";
import {
  MemberStanding,
  OVER_TOTAL_BUDGET,
  PhaseForProposal,
  mayWithdrawTeamProposalFrom,
  offeredTeamProposalActions,
  organizationIsLocked,
  phaseCostTooHigh,
  phaseNamesSomeoneTwice,
  phaseShortfall,
  readSwuProposalInput,
  readTwuProposalInput,
  responseProblems,
  swuBodyOf,
  swuCostProblems,
  twuContractCost,
  wordCount,
  workingDays,
} from "../src/rules/team-proposals";

const member = (id: string, membershipStatus: MemberStanding["membershipStatus"], capabilities: string[]): [string, MemberStanding] => [
  id,
  { id, name: id, membershipStatus, capabilities },
];

describe("a Sprint With Us phase's team as the form judges it (R-2.18, R-2.19)", () => {
  const phase: PhaseForProposal = { phase: "PROTOTYPE", maxBudget: 200_000, requiredCapabilities: ["User Research", "Backend Development"] };
  const members = new Map([
    member("a", "ACTIVE", ["User Research"]),
    member("b", "ACTIVE", ["Backend Development"]),
    member("p", "PENDING", ["Backend Development"]),
  ]);

  it("is incomplete while it names nobody, names a pending person, or leaves a capability unheld", () => {
    expect(phaseShortfall(undefined, phase, members)).toMatchObject({ complete: false, empty: true });
    expect(phaseShortfall({ members: [{ member: "a", scrumMaster: true }], proposedCost: 1 }, phase, members)).toMatchObject({
      complete: false,
      missing: ["Backend Development"],
    });
    // A pending person's capabilities are not held until they accept.
    const withPending = phaseShortfall({ members: [{ member: "a", scrumMaster: true }, { member: "p", scrumMaster: false }] , proposedCost: 1 }, phase, members);
    expect(withPending).toMatchObject({ complete: false, pending: true, missing: ["Backend Development"] });
    expect(
      phaseShortfall({ members: [{ member: "a", scrumMaster: true }, { member: "b", scrumMaster: false }], proposedCost: 1 }, phase, members),
    ).toMatchObject({ complete: true, missing: [] });
  });

  it("names a phase cost over its maximum and a total over the opportunity's, with the budget written plainly", () => {
    const opportunity = { totalMaxBudget: 300_000, phases: [phase, { phase: "IMPLEMENTATION" as const, maxBudget: 150_000, requiredCapabilities: [] }], questions: [] };
    expect(phaseCostTooHigh(200_000)).toBe("Please enter a Proposed Cost less than or equal to 200,000.");
    expect(
      swuCostProblems({ phases: { PROTOTYPE: { members: [], proposedCost: 250_000 }, IMPLEMENTATION: { members: [], proposedCost: 100_000 } } }, opportunity),
    ).toEqual([
      { field: "prototypePhase.proposedCost", message: phaseCostTooHigh(200_000) },
      { field: "totalProposedCost", message: OVER_TOTAL_BUDGET },
    ]);
    expect(swuCostProblems({ phases: { PROTOTYPE: { members: [], proposedCost: 150_000 } } }, opportunity)).toEqual([]);
  });

  it("holds a proposal within every phase budget to the total alone when the phase budgets exceed it", () => {
    const opportunity = {
      totalMaxBudget: 400_000,
      phases: [{ ...phase, maxBudget: 200_000 }, { phase: "IMPLEMENTATION" as const, maxBudget: 300_000, requiredCapabilities: [] }],
      questions: [],
    };
    expect(
      swuCostProblems({ phases: { PROTOTYPE: { members: [], proposedCost: 190_000 }, IMPLEMENTATION: { members: [], proposedCost: 290_000 } } }, opportunity),
    ).toEqual([{ field: "totalProposedCost", message: OVER_TOTAL_BUDGET }]);
    expect(OVER_TOTAL_BUDGET).toBe("The proposed cost exceeds the maximum budget for this opportunity.");
  });

  it("notices the same person twice in one phase, which cannot be stored", () => {
    expect(phaseNamesSomeoneTwice({ phases: { IMPLEMENTATION: { members: [{ member: "a", scrumMaster: true }, { member: "a", scrumMaster: false }], proposedCost: 1 } } })).toBe(true);
    expect(phaseNamesSomeoneTwice({ phases: { INCEPTION: { members: [{ member: "a", scrumMaster: true }], proposedCost: 1 }, IMPLEMENTATION: { members: [{ member: "a", scrumMaster: true }], proposedCost: 1 } } })).toBe(false);
  });
});

describe("answers to an opportunity's questions (R-2.21)", () => {
  const questions = [{ order: 0, question: "Why?", wordLimit: 3 }];
  it("counts words, and refuses an empty answer, one over the limit, one against no question, and a question left unanswered", () => {
    expect(wordCount("  one two\nthree ")).toBe(3);
    expect(responseProblems("teamQuestionResponses", [{ order: 0, response: "one two three" }], questions)).toEqual([]);
    expect(responseProblems("teamQuestionResponses", [{ order: 0, response: "one two three four" }], questions)).toEqual([
      { field: "teamQuestionResponses.0.response", message: "Response must be between 1 and 3 words long." },
    ]);
    expect(responseProblems("resourceQuestionResponses", [{ order: 4, response: "Yes" }], questions)).toEqual([
      { field: "resourceQuestionResponses.4.order", message: "No matching opportunity question." },
      { field: "resourceQuestionResponses.0.response", message: "Response must be between 1 and 3 words long." },
    ]);
  });
});

describe("a Team With Us proposal's cost over the contract (R-2.10)", () => {
  it("counts the working days of the contract, both ends included", () => {
    // 2026-11-02 is a Monday; four whole weeks hold twenty working days.
    expect(workingDays("2026-11-02", "2026-11-29")).toBe(20);
    expect(workingDays("2026-11-07", "2026-11-08")).toBe(0);
    expect(workingDays("2026-11-09", "2026-11-02")).toBe(0);
  });

  it("applies each rate at its resource's allocation for 7.5 hours a working day, and cannot count without an end", () => {
    const opportunity = {
      maxBudget: 1,
      startDate: "2026-11-02",
      completionDate: "2026-11-29",
      resources: [
        { id: "r1", serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 },
        { id: "r2", serviceArea: "DATA_PROFESSIONAL", targetAllocation: 50 },
      ],
      questions: [],
    };
    const team = [
      { member: "a", resource: "r1", hourlyRate: 100 },
      { member: "b", resource: "r2", hourlyRate: 80 },
    ];
    expect(twuContractCost(team, opportunity)).toBe(100 * 7.5 * 20 + 80 * 0.5 * 7.5 * 20);
    expect(twuContractCost(team, { ...opportunity, completionDate: null })).toBeNull();
  });
});

describe("what a proposal holds, read from a request", () => {
  it("reads a Sprint With Us team by phase, keeping a phase sent and leaving out one that is not", () => {
    const input = readSwuProposalInput({
      organization: { id: "ORG" },
      implementationPhase: { members: [{ member: "A", scrumMaster: "yes" }, { member: "" }], proposedCost: "$1,200" },
      teamQuestionResponses: [{ order: 0, response: "Yes" }],
      attachments: ["F", { id: "f" }],
    });
    expect(input).toEqual({
      organization: "org",
      phases: { IMPLEMENTATION: { members: [{ member: "a", scrumMaster: true }], proposedCost: 1200 } },
      responses: [{ order: 0, response: "Yes" }],
      references: [],
      attachments: ["f"],
    });
    expect(readSwuProposalInput(swuBodyOf(input))).toEqual(input);
  });

  it("reads a Team With Us team, a rate it cannot read being none", () => {
    expect(readTwuProposalInput({ team: [{ member: "A", resource: "R", hourlyRate: "abc" }] }).team).toEqual([
      { member: "a", resource: "r", hourlyRate: null },
    ]);
  });
});

describe("what may be done to a proposal in each state (R-2.4, R-2.22, R-2.23)", () => {
  it("withdraws anything put forward, locks the organization while it stands, and deletes only a draft", () => {
    expect(mayWithdrawTeamProposalFrom("UNDER_REVIEW_QUESTIONS")).toBe(true);
    expect(mayWithdrawTeamProposalFrom("DRAFT")).toBe(false);
    expect(organizationIsLocked("SUBMITTED")).toBe(true);
    expect(organizationIsLocked("WITHDRAWN")).toBe(false);
    expect(offeredTeamProposalActions("DRAFT")).toEqual({ edit: true, submit: true, withdraw: false, delete: true });
    expect(offeredTeamProposalActions("SUBMITTED")).toEqual({ edit: true, submit: false, withdraw: true, delete: false });
  });
});
