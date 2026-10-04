import { describe, expect, it } from "vitest";
import {
  allInContentionEvaluated,
  anonymousProponentName,
  disqualificationReasonProblem,
  isInContention,
  mayAwardInState,
  mayAwardTeamProposalInState,
  teamScoresheet,
  mayDisqualifyInState,
  mayEvaluateProposal,
  mayScoreInState,
  offeredEvaluationActions,
  rankAmong,
  rankLabel,
  readScore,
  scoreEnteredNote,
  scoreInNote,
} from "../src/rules/proposal-evaluation";
import { proposalHistoryLabel } from "../src/rules/proposals";

describe("a Code With Us score (R-2.26)", () => {
  it("is out of 100 with at most two decimal places", () => {
    expect(readScore(87)).toBe(87);
    expect(readScore(0)).toBe(0);
    expect(readScore(100)).toBe(100);
    expect(readScore(87.25)).toBe(87.25);
    expect(readScore("64.5")).toBe(64.5);
    expect(readScore(0.29)).toBe(0.29);
    expect(readScore(100.01)).toBeNull();
    expect(readScore(104)).toBeNull();
    expect(readScore(-1)).toBeNull();
    expect(readScore(87.123)).toBeNull();
    expect(readScore("")).toBeNull();
    expect(readScore(null)).toBeNull();
    expect(readScore(Number.NaN)).toBeNull();
  });

  it("is recorded in the history in words, and read back from them", () => {
    expect(scoreEnteredNote(87)).toBe('A score of "87%" was entered.');
    expect(scoreInNote(scoreEnteredNote(87.5))).toBe("87.5%");
    expect(proposalHistoryLabel({ status: null, event: "SCORE_ENTERED", note: scoreEnteredNote(87) })).toBe("Score entered: 87%");
    expect(proposalHistoryLabel({ status: "EVALUATED", event: null })).toBe("Evaluated");
  });
});

describe("disqualifying (R-2.34)", () => {
  it("needs a reason of 1 to 5,000 characters", () => {
    expect(disqualificationReasonProblem(undefined)).not.toBeNull();
    expect(disqualificationReasonProblem("   ")).not.toBeNull();
    expect(disqualificationReasonProblem("x".repeat(5001))).not.toBeNull();
    expect(disqualificationReasonProblem("x".repeat(5000))).toBeNull();
    expect(disqualificationReasonProblem("Late.")).toBeNull();
  });

  it("is open at any stage after closing", () => {
    expect(mayDisqualifyInState("UNDER_REVIEW", "EVALUATION")).toBe(true);
    expect(mayDisqualifyInState("EVALUATED", "PROCESSING")).toBe(true);
    expect(mayDisqualifyInState("SUBMITTED", "PUBLISHED")).toBe(false);
    expect(mayDisqualifyInState("WITHDRAWN", "EVALUATION")).toBe(false);
  });
});

describe("who evaluates, and when", () => {
  const opportunity = { createdBy: "staff-1" };
  it("is an administrator or the opportunity's author", () => {
    expect(mayEvaluateProposal({ id: "admin-1", type: "ADMIN" }, opportunity)).toBe(true);
    expect(mayEvaluateProposal({ id: "staff-1", type: "GOV" }, opportunity)).toBe(true);
    expect(mayEvaluateProposal({ id: "staff-2", type: "GOV" }, opportunity)).toBe(false);
    expect(mayEvaluateProposal({ id: "staff-1", type: "VENDOR" }, opportunity)).toBe(false);
    expect(mayEvaluateProposal(null, opportunity)).toBe(false);
  });

  it("scores a proposal under review while the opportunity is in evaluation", () => {
    expect(mayScoreInState("UNDER_REVIEW", "EVALUATION")).toBe(true);
    expect(mayScoreInState("UNDER_REVIEW", "PROCESSING")).toBe(false);
    expect(mayScoreInState("DISQUALIFIED", "EVALUATION")).toBe(false);
  });

  it("awards only an evaluated proposal, or one passed over, before the opportunity is awarded (R-2.33)", () => {
    expect(mayAwardInState("EVALUATED", "PROCESSING")).toBe(true);
    expect(mayAwardInState("NOT_AWARDED", "PROCESSING")).toBe(true);
    expect(mayAwardInState("UNDER_REVIEW", "PROCESSING")).toBe(false);
    expect(mayAwardInState("EVALUATED", "AWARDED")).toBe(false);
  });

  it("offers Enter score under review, and Award once evaluated", () => {
    expect(offeredEvaluationActions("UNDER_REVIEW", "EVALUATION")).toEqual({ score: true, award: false, disqualify: true });
    expect(offeredEvaluationActions("EVALUATED", "PROCESSING")).toEqual({ score: false, award: true, disqualify: true });
    expect(offeredEvaluationActions("AWARDED", "AWARDED")).toEqual({ score: false, award: false, disqualify: true });
  });
});

describe("moving to processing (R-1.25, R-2.27)", () => {
  it("waits for every proposal still in contention, and ignores drafts, withdrawn and disqualified ones", () => {
    expect(allInContentionEvaluated(["EVALUATED", "UNDER_REVIEW", "DISQUALIFIED"])).toBe(false);
    expect(allInContentionEvaluated(["EVALUATED", "EVALUATED", "DISQUALIFIED"])).toBe(true);
    expect(allInContentionEvaluated(["EVALUATED", "DRAFT", "WITHDRAWN"])).toBe(true);
    expect(allInContentionEvaluated(["DISQUALIFIED", "WITHDRAWN"])).toBe(false);
  });
});

describe("rank (R-2.32)", () => {
  const proposals = [
    { id: "a", status: "AWARDED", score: 91 },
    { id: "b", status: "NOT_AWARDED", score: 80 },
    { id: "c", status: "NOT_AWARDED", score: 80 },
    { id: "d", status: "DISQUALIFIED", score: 99 },
    { id: "e", status: "UNDER_REVIEW", score: null },
  ];
  it("counts the scored proposals still standing, highest first, equal scores sharing a place", () => {
    expect(rankAmong("a", proposals)).toEqual({ rank: 1, of: 3 });
    expect(rankAmong("c", proposals)).toEqual({ rank: 2, of: 3 });
    expect(rankAmong("d", proposals)).toBeNull();
    expect(rankAmong("e", proposals)).toBeNull();
    expect(rankLabel({ rank: 2, of: 3 })).toBe("2 of 3");
  });
});

describe("a Sprint With Us or Team With Us scoresheet (R-2.32)", () => {
  const weights = { questions: 25, challenge: 40, scenario: 15, price: 20, questionsMax: 20 };
  const proposals = [
    { id: "first", status: "EVALUATED_TEAM_SCENARIO", consensus: [5, 5, 5, 5], challenge: 80, scenario: 70, price: 100 },
    { id: "second", status: "EVALUATED_TEAM_SCENARIO", consensus: [4, 4, 4, 4], challenge: 75, scenario: 85, price: 50 },
    { id: "behind", status: "UNDER_REVIEW_QUESTIONS", consensus: [5, 5, 5, 2], challenge: null, scenario: null, price: null },
    { id: "out", status: "DISQUALIFIED", consensus: [5, 5, 5, 5], challenge: 100, scenario: 100, price: 100 },
  ];

  it("weighs each stage in the opportunity's proportions, and ranks the totals of those still standing", () => {
    expect(teamScoresheet("sprint-with-us", "first", proposals, weights)).toEqual({
      questions: 100,
      challenge: 80,
      scenario: 70,
      price: 100,
      total: 87.5,
      rank: { rank: 1, of: 2 },
    });
    expect(teamScoresheet("sprint-with-us", "second", proposals, weights)).toMatchObject({ questions: 80, total: 72.75, rank: { rank: 2, of: 2 } });
  });

  it("has no total or rank until every stage is scored", () => {
    expect(teamScoresheet("sprint-with-us", "behind", proposals, weights)).toMatchObject({ questions: 85, total: null, rank: null });
  });

  it("leaves out the team scenario in Team With Us", () => {
    const twu = { questions: 30, challenge: 40, scenario: 0, price: 30, questionsMax: 20 };
    const one = [{ id: "a", status: "EVALUATED_CHALLENGE", consensus: [4, 4, 4, 4], challenge: 85, scenario: null, price: 100 }];
    expect(teamScoresheet("team-with-us", "a", one, twu)).toEqual({
      questions: 80,
      challenge: 85,
      scenario: null,
      price: 100,
      total: 88,
      rank: { rank: 1, of: 1 },
    });
  });

  it("awards from the last evaluated stage, or after being passed over, at the final stage or in processing", () => {
    expect(mayAwardTeamProposalInState("sprint-with-us", "EVALUATED_TEAM_SCENARIO", "PROCESSING")).toBe(true);
    expect(mayAwardTeamProposalInState("sprint-with-us", "NOT_AWARDED", "EVAL_SCENARIO")).toBe(true);
    expect(mayAwardTeamProposalInState("sprint-with-us", "UNDER_REVIEW_QUESTIONS", "PROCESSING")).toBe(false);
    expect(mayAwardTeamProposalInState("team-with-us", "EVALUATED_CHALLENGE", "PROCESSING")).toBe(true);
    expect(mayAwardTeamProposalInState("team-with-us", "EVALUATED_CHALLENGE", "AWARDED")).toBe(false);
    expect(isInContention("UNDER_REVIEW_QUESTIONS")).toBe(true);
    expect(isInContention("WITHDRAWN")).toBe(false);
  });
});

describe("anonymous proponents (R-2.5)", () => {
  it("are numbered from one", () => {
    expect([0, 1, 2].map(anonymousProponentName)).toEqual(["Proponent 1", "Proponent 2", "Proponent 3"]);
  });
});
