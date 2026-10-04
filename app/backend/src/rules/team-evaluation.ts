/**
 * Rules about the stages after the questions of a Sprint With Us or Team With Us opportunity — the
 * code challenge and team scenario, or the challenge — as plain TypeScript (decision record 0065).
 *
 * A proposal's stage score is entered only while the proposal is in that stage and the opportunity
 * stands at it (R-2.28). A Sprint With Us proponent scored on the code challenge is screened in to the
 * team scenario, or out again, while the opportunity is still at the code challenge, and the team
 * scenario starts only once every proponent there is scored or disqualified and at least one is
 * screened in (R-1.42). The last score at the program's final stage works out every price score and
 * moves the opportunity to processing (R-1.25, R-2.30).
 *
 * Nothing here imports NestJS, Prisma or Node: the service and the proposal page both call these, so
 * the page offers what the service accepts.
 */

import type { TeamProgramName } from "./proposal-evaluation";

/** The refusal of a score, or a screening, sent while the opportunity stands at another stage (R-2.28). */
export const WRONG_STAGE = "The opportunity is not in the correct stage of evaluation to perform that action.";

/** The service's general refusal: what was asked is not open to this proposal as it stands. */
export const NOT_PERMITTED = "You do not have permission to perform this action.";

/** Starting the team scenario with a proponent left unscored in the code challenge (R-1.42). */
export const ALL_MUST_BE_SCORED =
  "All proponents must be scored first. Score or disqualify every proponent in the code challenge, and at least one must remain screened in.";

/** Starting the team scenario with nobody screened in to it (R-1.42). */
export const NONE_SCREENED_IN = "At least one proponent must be screened in to the team scenario before it can start.";

/** Team With Us proponents are carried into the challenge by finalising the consensus, not one by one. */
export const SCREENED_BY_FINALIZING = "Proponents are screened in to the challenge when the consensus scores are finalized.";

/** The note on an opportunity moved to the team scenario. */
export const TEAM_SCENARIO_STARTED_NOTE = "The team scenario has started.";

export const SCREENED_IN_NOTE = "Screened in.";
export const SCREENED_OUT_NOTE = "Screened out.";

/** The events recorded beside a stage score and a calculated price score (R-2.35). */
export const CHALLENGE_SCORE_ENTERED = "CHALLENGE_SCORE_ENTERED";
export const SCENARIO_SCORE_ENTERED = "SCENARIO_SCORE_ENTERED";
export const PRICE_SCORE_ENTERED = "PRICE_SCORE_ENTERED";

export type StageScoreTag = "scoreCodeChallenge" | "scoreTeamScenario" | "scoreChallenge";
export type ScreeningTag = "screenInToTeamScenario" | "screenOutFromTeamScenario" | "screenInToChallenge" | "screenOutFromChallenge";

export interface StageScoreRule {
  readonly program: TeamProgramName;
  /** The states a proposal may be in to take this score: under review at the stage, or already scored there. */
  readonly proposalIn: readonly string[];
  /** Where the score takes the proposal. */
  readonly evaluated: string;
  /** The stage the opportunity must stand at. */
  readonly opportunity: string;
  /** Which stored score it is. */
  readonly score: "challenge" | "scenario";
  readonly event: string;
  /** The stage in words, as the page and the history name it. */
  readonly name: string;
}

export const STAGE_SCORES: Readonly<Record<StageScoreTag, StageScoreRule>> = {
  scoreCodeChallenge: {
    program: "sprint-with-us",
    proposalIn: ["UNDER_REVIEW_CODE_CHALLENGE", "EVALUATED_CODE_CHALLENGE"],
    evaluated: "EVALUATED_CODE_CHALLENGE",
    opportunity: "EVAL_CC",
    score: "challenge",
    event: CHALLENGE_SCORE_ENTERED,
    name: "code challenge",
  },
  scoreTeamScenario: {
    program: "sprint-with-us",
    proposalIn: ["UNDER_REVIEW_TEAM_SCENARIO", "EVALUATED_TEAM_SCENARIO"],
    evaluated: "EVALUATED_TEAM_SCENARIO",
    opportunity: "EVAL_SCENARIO",
    score: "scenario",
    event: SCENARIO_SCORE_ENTERED,
    name: "team scenario",
  },
  scoreChallenge: {
    program: "team-with-us",
    proposalIn: ["UNDER_REVIEW_CHALLENGE", "EVALUATED_CHALLENGE"],
    evaluated: "EVALUATED_CHALLENGE",
    opportunity: "EVAL_C",
    score: "challenge",
    event: CHALLENGE_SCORE_ENTERED,
    name: "challenge",
  },
};

export function isStageScoreTag(tag: unknown): tag is StageScoreTag {
  return typeof tag === "string" && Object.hasOwn(STAGE_SCORES, tag);
}

export function isScreeningTag(tag: unknown): tag is ScreeningTag {
  return typeof tag === "string" && ["screenInToTeamScenario", "screenOutFromTeamScenario", "screenInToChallenge", "screenOutFromChallenge"].includes(tag);
}

/**
 * Whether a stage action may be taken now. The proposal is checked before the opportunity: a
 * proposal that has not been carried into the stage is refused with the general message, and only one
 * that has, on an opportunity standing at a different stage, with the stage message (R-2.28).
 */
export type StageDecision = "ok" | "not-permitted" | "wrong-stage";

export function stageScoreDecision(tag: StageScoreTag, proposal: string, opportunity: string): StageDecision {
  const rule = STAGE_SCORES[tag];
  if (!rule.proposalIn.includes(proposal)) return "not-permitted";
  return opportunity === rule.opportunity ? "ok" : "wrong-stage";
}

/** Where screening takes a Sprint With Us proposal, from where, while the opportunity is at the code challenge. */
export const SCREENINGS = {
  screenInToTeamScenario: { from: "EVALUATED_CODE_CHALLENGE", to: "UNDER_REVIEW_TEAM_SCENARIO", note: SCREENED_IN_NOTE },
  screenOutFromTeamScenario: { from: "UNDER_REVIEW_TEAM_SCENARIO", to: "EVALUATED_CODE_CHALLENGE", note: SCREENED_OUT_NOTE },
} as const;

export function screeningDecision(tag: keyof typeof SCREENINGS, proposal: string, opportunity: string): StageDecision {
  if (proposal !== SCREENINGS[tag].from) return "not-permitted";
  return opportunity === "EVAL_CC" ? "ok" : "wrong-stage";
}

/**
 * Why the team scenario may not start yet, or null when it may: every proponent in the code challenge
 * must be scored or disqualified, and at least one screened in (R-1.42).
 */
export function teamScenarioStartProblem(statuses: readonly string[]): string | null {
  if (statuses.includes("UNDER_REVIEW_CODE_CHALLENGE")) return ALL_MUST_BE_SCORED;
  if (!statuses.includes("UNDER_REVIEW_TEAM_SCENARIO")) return NONE_SCREENED_IN;
  return null;
}

/** Each program's final stage: the opportunity's state, and its proposals' under review and evaluated. */
export const FINAL_STAGES = {
  "sprint-with-us": { opportunity: "EVAL_SCENARIO", underReview: "UNDER_REVIEW_TEAM_SCENARIO", evaluated: "EVALUATED_TEAM_SCENARIO" },
  "team-with-us": { opportunity: "EVAL_C", underReview: "UNDER_REVIEW_CHALLENGE", evaluated: "EVALUATED_CHALLENGE" },
} as const;

/**
 * Whether every proposal still in contention at the program's final stage has been scored there, so
 * that price scores are worked out and the opportunity moves to processing (R-1.25, R-2.30). A
 * proponent left behind at an earlier stage, disqualified or withdrawn is not waited for, and an
 * opportunity with nobody scored at the final stage does not move.
 */
export function finalStageComplete(program: TeamProgramName, opportunity: string, statuses: readonly string[]): boolean {
  const final = FINAL_STAGES[program];
  return opportunity === final.opportunity && !statuses.includes(final.underReview) && statuses.includes(final.evaluated);
}

const twoPlaces = (value: number) => Math.round(value * 100) / 100;

/**
 * Each bid's price score: its share of the lowest bid among them, as a percentage to two decimal
 * places, so the lowest bid scores 100 (R-2.30). A bid of nothing scores 100.
 */
export function priceScores(bids: readonly { readonly id: string; readonly bid: number }[]): { id: string; price: number }[] {
  const positive = bids.map((entry) => entry.bid).filter((bid) => bid > 0);
  const lowest = positive.length > 0 ? Math.min(...positive) : 0;
  return bids.map((entry) => ({ id: entry.id, price: entry.bid <= 0 ? 100 : twoPlaces((lowest / entry.bid) * 100) }));
}

/**
 * A Team With Us bid: each named person's hourly rate weighted by the target allocation of the
 * resource they are named against (R-2.30 note).
 */
export function twuBid(team: readonly { readonly hourlyRate: number; readonly targetAllocation: number | null }[]): number {
  return team.reduce((sum, member) => sum + Math.max(member.hourlyRate, 0) * ((member.targetAllocation ?? 0) / 100), 0);
}

/** The note recorded with a stage score: `A code challenge score of "90%" was entered.` */
export function stageScoreNote(name: string, score: number): string {
  return `A ${name} score of "${score}%" was entered.`;
}

/** The note recorded with a calculated price score: `A price score of "50%" was calculated.` */
export function priceScoreNote(price: number): string {
  return `A price score of "${price}%" was calculated.`;
}

/** One stage event in words for the history: "Code challenge score entered: 90%" (R-2.35). */
export function stageEventLabel(event: string, note: string | null): string | null {
  const score = /"(\d+(?:\.\d+)?%)"/.exec(note ?? "")?.[1];
  const suffix = score ? `: ${score}` : "";
  if (event === PRICE_SCORE_ENTERED) return `Price score calculated${suffix}`;
  if (event === SCENARIO_SCORE_ENTERED) return `Team scenario score entered${suffix}`;
  if (event === CHALLENGE_SCORE_ENTERED) {
    return `${/code challenge/i.test(note ?? "") ? "Code challenge" : "Challenge"} score entered${suffix}`;
  }
  return null;
}

/** What the read-only proposal page offers the opportunity's author and administrators on the stage tabs. */
export interface StageOffers {
  readonly scoreCodeChallenge: boolean;
  readonly screenIn: boolean;
  readonly screenOut: boolean;
  readonly scoreTeamScenario: boolean;
  readonly scoreChallenge: boolean;
}

/**
 * A stage's score is offered only once the opportunity stands at that stage and the proposal is in
 * it, for entering or changing; a proposal carried past a stage is no longer offered its score
 * (R-2.28). Screening is offered while the opportunity is at the code challenge.
 */
export function offeredStageActions(program: TeamProgramName, proposal: string, opportunity: string): StageOffers {
  const sprint = program === "sprint-with-us";
  return {
    scoreCodeChallenge: sprint && stageScoreDecision("scoreCodeChallenge", proposal, opportunity) === "ok",
    screenIn: sprint && screeningDecision("screenInToTeamScenario", proposal, opportunity) === "ok",
    screenOut: sprint && screeningDecision("screenOutFromTeamScenario", proposal, opportunity) === "ok",
    scoreTeamScenario: sprint && stageScoreDecision("scoreTeamScenario", proposal, opportunity) === "ok",
    scoreChallenge: !sprint && stageScoreDecision("scoreChallenge", proposal, opportunity) === "ok",
  };
}

/** The opportunity's evaluation stages in order, to say whether it has reached one yet. */
const STAGE_ORDER: readonly string[] = [
  "PUBLISHED",
  "EVAL_QUESTIONS_INDIVIDUAL",
  "EVAL_QUESTIONS_CONSENSUS",
  "EVAL_CC",
  "EVAL_C",
  "EVAL_SCENARIO",
  "PROCESSING",
  "AWARDED",
];

/** Whether the opportunity has reached a stage, or gone past it. */
export function hasReachedStage(opportunity: string, stage: string): boolean {
  const at = STAGE_ORDER.indexOf(opportunity);
  return at >= 0 && at >= STAGE_ORDER.indexOf(stage);
}
