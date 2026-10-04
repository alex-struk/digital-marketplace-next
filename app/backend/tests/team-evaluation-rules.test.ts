import { describe, expect, it } from "vitest";
import { teamScoresheet } from "../src/rules/proposal-evaluation";
import { proposalHistoryLabel } from "../src/rules/proposals";
import {
  ALL_MUST_BE_SCORED,
  CHALLENGE_SCORE_ENTERED,
  NONE_SCREENED_IN,
  PRICE_SCORE_ENTERED,
  SCENARIO_SCORE_ENTERED,
  finalStageComplete,
  hasReachedStage,
  offeredStageActions,
  priceScoreNote,
  priceScores,
  screeningDecision,
  stageScoreDecision,
  stageScoreNote,
  teamScenarioStartProblem,
  twuBid,
} from "../src/rules/team-evaluation";

describe("a stage score at the wrong stage (R-2.28)", () => {
  it("checks the proposal before the opportunity", () => {
    // Carried into the team scenario while the opportunity is still at the code challenge.
    expect(stageScoreDecision("scoreTeamScenario", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC")).toBe("wrong-stage");
    // Not carried into the team scenario at all: the general refusal, whatever the opportunity's stage.
    expect(stageScoreDecision("scoreTeamScenario", "UNDER_REVIEW_CODE_CHALLENGE", "EVAL_CC")).toBe("not-permitted");
    expect(stageScoreDecision("scoreTeamScenario", "UNDER_REVIEW_CODE_CHALLENGE", "EVAL_SCENARIO")).toBe("not-permitted");
    expect(stageScoreDecision("scoreTeamScenario", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_SCENARIO")).toBe("ok");
  });

  it("lets a stage's score be changed while the stage lasts, and not once the proposal has moved past it", () => {
    expect(stageScoreDecision("scoreCodeChallenge", "EVALUATED_CODE_CHALLENGE", "EVAL_CC")).toBe("ok");
    expect(stageScoreDecision("scoreCodeChallenge", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC")).toBe("not-permitted");
    expect(stageScoreDecision("scoreCodeChallenge", "EVALUATED_CODE_CHALLENGE", "EVAL_SCENARIO")).toBe("wrong-stage");
  });

  it("holds Team With Us to the challenge in the same way", () => {
    expect(stageScoreDecision("scoreChallenge", "UNDER_REVIEW_CHALLENGE", "EVAL_QUESTIONS_CONSENSUS")).toBe("wrong-stage");
    expect(stageScoreDecision("scoreChallenge", "UNDER_REVIEW_QUESTIONS", "EVAL_QUESTIONS_CONSENSUS")).toBe("not-permitted");
    expect(stageScoreDecision("scoreChallenge", "UNDER_REVIEW_CHALLENGE", "EVAL_C")).toBe("ok");
  });

  it("offers on the page only the scores the service would take", () => {
    expect(offeredStageActions("sprint-with-us", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC")).toEqual({
      scoreCodeChallenge: false,
      screenIn: false,
      screenOut: true,
      scoreTeamScenario: false,
      scoreChallenge: false,
    });
    expect(offeredStageActions("sprint-with-us", "UNDER_REVIEW_CODE_CHALLENGE", "EVAL_CC").scoreCodeChallenge).toBe(true);
    expect(offeredStageActions("sprint-with-us", "EVALUATED_CODE_CHALLENGE", "EVAL_CC")).toMatchObject({ scoreCodeChallenge: true, screenIn: true });
    expect(offeredStageActions("team-with-us", "UNDER_REVIEW_CHALLENGE", "EVAL_QUESTIONS_CONSENSUS").scoreChallenge).toBe(false);
    expect(offeredStageActions("team-with-us", "UNDER_REVIEW_CHALLENGE", "EVAL_C").scoreChallenge).toBe(true);
  });

  it("knows whether the opportunity has reached a stage", () => {
    expect(hasReachedStage("EVAL_CC", "EVAL_SCENARIO")).toBe(false);
    expect(hasReachedStage("EVAL_SCENARIO", "EVAL_CC")).toBe(true);
    expect(hasReachedStage("EVAL_QUESTIONS_CONSENSUS", "EVAL_C")).toBe(false);
    expect(hasReachedStage("PROCESSING", "EVAL_C")).toBe(true);
  });
});

describe("screening in to and out of the team scenario", () => {
  it("takes a proponent scored on the code challenge, while the opportunity is still there", () => {
    expect(screeningDecision("screenInToTeamScenario", "EVALUATED_CODE_CHALLENGE", "EVAL_CC")).toBe("ok");
    expect(screeningDecision("screenInToTeamScenario", "UNDER_REVIEW_CODE_CHALLENGE", "EVAL_CC")).toBe("not-permitted");
    expect(screeningDecision("screenOutFromTeamScenario", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_CC")).toBe("ok");
    expect(screeningDecision("screenOutFromTeamScenario", "UNDER_REVIEW_TEAM_SCENARIO", "EVAL_SCENARIO")).toBe("wrong-stage");
  });
});

describe("starting the team scenario (R-1.42)", () => {
  it("is refused while a proponent in the code challenge is unscored and not disqualified", () => {
    expect(teamScenarioStartProblem(["EVALUATED_CODE_CHALLENGE", "UNDER_REVIEW_CODE_CHALLENGE", "UNDER_REVIEW_QUESTIONS"])).toBe(ALL_MUST_BE_SCORED);
    expect(ALL_MUST_BE_SCORED).toMatch(/^All proponents must be scored first\./);
  });

  it("is refused with nobody screened in", () => {
    expect(teamScenarioStartProblem(["EVALUATED_CODE_CHALLENGE", "DISQUALIFIED"])).toBe(NONE_SCREENED_IN);
  });

  it("is allowed once everyone is scored or disqualified and one is screened in", () => {
    expect(teamScenarioStartProblem(["UNDER_REVIEW_TEAM_SCENARIO", "EVALUATED_CODE_CHALLENGE", "DISQUALIFIED", "UNDER_REVIEW_QUESTIONS"])).toBeNull();
  });
});

describe("the end of the final stage (R-1.25)", () => {
  it("comes once nobody at the final stage is waiting for a score", () => {
    expect(finalStageComplete("sprint-with-us", "EVAL_SCENARIO", ["EVALUATED_TEAM_SCENARIO", "UNDER_REVIEW_TEAM_SCENARIO"])).toBe(false);
    expect(finalStageComplete("sprint-with-us", "EVAL_SCENARIO", ["EVALUATED_TEAM_SCENARIO", "EVALUATED_TEAM_SCENARIO", "UNDER_REVIEW_QUESTIONS"])).toBe(true);
    expect(finalStageComplete("sprint-with-us", "EVAL_SCENARIO", ["EVALUATED_TEAM_SCENARIO", "DISQUALIFIED"])).toBe(true);
    expect(finalStageComplete("team-with-us", "EVAL_C", ["EVALUATED_CHALLENGE", "UNDER_REVIEW_CHALLENGE"])).toBe(false);
    expect(finalStageComplete("team-with-us", "EVAL_C", ["EVALUATED_CHALLENGE", "EVALUATED_CHALLENGE"])).toBe(true);
  });

  it("does not come at another stage, or with nobody scored there", () => {
    expect(finalStageComplete("sprint-with-us", "EVAL_CC", ["EVALUATED_TEAM_SCENARIO"])).toBe(false);
    expect(finalStageComplete("sprint-with-us", "EVAL_SCENARIO", ["DISQUALIFIED", "WITHDRAWN"])).toBe(false);
  });
});

describe("price scores (R-2.30)", () => {
  it("are each bid's share of the lowest bid, as a percentage", () => {
    expect(priceScores([
      { id: "a", bid: 100_000 },
      { id: "b", bid: 200_000 },
    ])).toEqual([
      { id: "a", price: 100 },
      { id: "b", price: 50 },
    ]);
    expect(priceScores([{ id: "a", bid: 110 }, { id: "b", bid: 135 }])[1]).toEqual({ id: "b", price: 81.48 });
  });

  it("weigh a Team With Us rate by its resource's target allocation", () => {
    expect(twuBid([{ hourlyRate: 100, targetAllocation: 100 }, { hourlyRate: 80, targetAllocation: 50 }])).toBe(140);
  });

  it("are recorded and shown in the history (R-2.35)", () => {
    expect(priceScoreNote(50)).toBe('A price score of "50%" was calculated.');
    expect(proposalHistoryLabel({ status: null, event: PRICE_SCORE_ENTERED, note: priceScoreNote(50) })).toBe("Price score calculated: 50%");
    expect(proposalHistoryLabel({ status: null, event: CHALLENGE_SCORE_ENTERED, note: stageScoreNote("code challenge", 90) })).toBe(
      "Code challenge score entered: 90%",
    );
    expect(proposalHistoryLabel({ status: null, event: CHALLENGE_SCORE_ENTERED, note: stageScoreNote("challenge", 72.5) })).toBe(
      "Challenge score entered: 72.5%",
    );
    expect(proposalHistoryLabel({ status: null, event: SCENARIO_SCORE_ENTERED, note: stageScoreNote("team scenario", 88) })).toBe(
      "Team scenario score entered: 88%",
    );
  });
});

describe("the weighted total and rank (R-2.31)", () => {
  const weights = { questions: 25, challenge: 40, scenario: 15, price: 20, questionsMax: 20 };
  const lower = { id: "lower", status: "EVALUATED_TEAM_SCENARIO", consensus: [5, 5, 5, 5], challenge: 80, scenario: 70, price: 100 };
  const higher = { id: "higher", status: "UNDER_REVIEW_TEAM_SCENARIO", consensus: [4, 4, 4, 4], challenge: 75, scenario: null, price: null };
  const behind = { id: "behind", status: "UNDER_REVIEW_QUESTIONS", consensus: [5, 5, 5, 2], challenge: null, scenario: null, price: null };

  it("combines the stage scores in the stated proportions", () => {
    expect(teamScoresheet("sprint-with-us", "lower", [lower, higher, behind], weights)?.total).toBe(87.5);
  });

  it("ranks only the fully evaluated", () => {
    expect(teamScoresheet("sprint-with-us", "lower", [lower, higher, behind], weights)?.rank).toEqual({ rank: 1, of: 1 });
    expect(teamScoresheet("sprint-with-us", "higher", [lower, higher, behind], weights)?.rank).toBeNull();
    expect(teamScoresheet("sprint-with-us", "behind", [lower, higher, behind], weights)?.rank).toBeNull();
    const scored = { ...higher, status: "EVALUATED_TEAM_SCENARIO", scenario: 60, price: 50 };
    const sheet = teamScoresheet("sprint-with-us", "higher", [lower, scored, behind], weights);
    expect(sheet?.total).toBe(69);
    expect(sheet?.rank).toEqual({ rank: 2, of: 2 });
  });
});
