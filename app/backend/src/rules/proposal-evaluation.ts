/**
 * Rules about evaluating a Code With Us proposal once its opportunity has closed, and about what
 * closing does, as plain TypeScript (decision record 0060).
 *
 * Nothing here imports NestJS, Prisma or Node: the service and the proposal page both call these,
 * so the page offers what the service accepts.
 */

import type { ProposalViewer } from "./proposals";

/** The proposals still in contention: put forward, and not withdrawn, disqualified or decided (R-2.27). */
export const IN_CONTENTION: readonly string[] = ["SUBMITTED", "UNDER_REVIEW", "EVALUATED"];

/** The states whose score counts towards a rank (R-2.32). */
const RANKED_STATES: readonly string[] = ["EVALUATED", "AWARDED", "NOT_AWARDED"];

/** The event recorded beside the change of state when a score is entered (R-2.26, R-2.35). */
export const SCORE_ENTERED = "SCORE_ENTERED";

/** The note recorded with a score: `A score of "87%" was entered.` (R-2.26). */
export function scoreEnteredNote(score: number): string {
  return `A score of "${score}%" was entered.`;
}

/** The score a score-entered note records, as "87%", or null. */
export function scoreInNote(note: string | null): string | null {
  return /"(\d+(?:\.\d+)?%)"/.exec(note ?? "")?.[1] ?? null;
}

/** The note an opportunity carries when it closes at its deadline (R-1.1). */
export const OPPORTUNITY_CLOSED_NOTE = "This opportunity has closed.";

/** The note on a proposal moved to review when its opportunity closes (R-1.1, R-2.5). */
export const PROPOSAL_CLOSED_NOTE = "The opportunity closed.";

/** The note an opportunity carries when the last score in contention moves it on (R-1.25, R-2.27). */
export const MOVED_TO_PROCESSING_NOTE = "Automatically moved to Processing as all proposals have been evaluated.";

export const SCORE_MESSAGE = "Enter a score between 0 and 100, with no more than two decimal places";
export const DISQUALIFY_REASON_MAX = 5_000;
export const DISQUALIFY_REASON_MESSAGE = "Enter a reason for disqualifying this proposal";
export const DISQUALIFY_REASON_TOO_LONG = "The reason must be 5,000 characters or fewer";

/**
 * A score as given: a number, or the digits of one, out of 100 with at most two decimal places
 * (R-2.26). Anything else is null.
 */
export function readScore(value: unknown): number | null {
  const given = typeof value === "string" && value.trim() !== "" ? Number(value.trim()) : value;
  if (typeof given !== "number" || !Number.isFinite(given) || given < 0 || given > 100) return null;
  // At most two decimal places: a hundredfold score is a whole number, within floating error.
  const hundredths = given * 100;
  if (Math.abs(hundredths - Math.round(hundredths)) > 1e-6) return null;
  return Math.round(hundredths) / 100;
}

/** What is wrong with a reason to disqualify: it needs 1 to 5,000 characters once trimmed (R-2.34). */
export function disqualificationReasonProblem(value: unknown): string | null {
  const reason = typeof value === "string" ? value.trim() : "";
  if (reason.length === 0) return DISQUALIFY_REASON_MESSAGE;
  if (reason.length > DISQUALIFY_REASON_MAX) return DISQUALIFY_REASON_TOO_LONG;
  return null;
}

/**
 * Who may score, disqualify and award a Code With Us proposal: an administrator, or the public
 * sector employee who created its opportunity (R-2.26, R-2.33, R-2.34).
 */
export function mayEvaluateProposal(viewer: ProposalViewer | null, opportunity: { readonly createdBy: string | null }): boolean {
  if (!viewer) return false;
  return viewer.type === "ADMIN" || (viewer.type === "GOV" && opportunity.createdBy !== null && opportunity.createdBy === viewer.id);
}

/**
 * Who sees the winner's contact details and score on an awarded opportunity: whoever may see
 * proposal scores, an administrator or the opportunity's author (R-1.27).
 */
export const maySeeProposalScores = mayEvaluateProposal;

/** A proposal under review, or one already scored, may be scored while its opportunity is in evaluation (R-2.26). */
export function mayScoreInState(proposal: string, opportunity: string): boolean {
  return opportunity === "EVALUATION" && (proposal === "UNDER_REVIEW" || proposal === "EVALUATED");
}

/** A proposal may be disqualified at any stage after its opportunity has closed (R-2.34). */
export function mayDisqualifyInState(proposal: string, opportunity: string): boolean {
  return (
    ["EVALUATION", "PROCESSING", "AWARDED"].includes(opportunity) &&
    ["UNDER_REVIEW", "EVALUATED", "AWARDED", "NOT_AWARDED"].includes(proposal)
  );
}

/** Only a fully evaluated proposal, or one passed over, may be awarded, before the opportunity is (R-2.33). */
export function mayAwardInState(proposal: string, opportunity: string): boolean {
  return ["EVALUATION", "PROCESSING"].includes(opportunity) && (proposal === "EVALUATED" || proposal === "NOT_AWARDED");
}

/**
 * Whether every proposal still in contention has been evaluated, so that the opportunity moves to
 * processing (R-1.25, R-2.27). Drafts, withdrawn and disqualified proposals are not counted, and an
 * opportunity with nothing in contention does not move.
 */
export function allInContentionEvaluated(statuses: readonly string[]): boolean {
  const contending = statuses.filter((status) => IN_CONTENTION.includes(status));
  return contending.length > 0 && contending.every((status) => status === "EVALUATED");
}

/** Where a scored proposal stands among the scored proposals on its opportunity: "1 of 2" (R-2.32). */
export interface Rank {
  readonly rank: number;
  readonly of: number;
}

/**
 * The rank of one proposal among the scored proposals on the same opportunity, highest score first
 * and equal scores sharing a rank; null when it carries no score that counts.
 */
export function rankAmong(
  proposalId: string,
  proposals: readonly { readonly id: string; readonly status: string; readonly score: number | null }[],
): Rank | null {
  const ranked = proposals.filter((proposal) => RANKED_STATES.includes(proposal.status) && typeof proposal.score === "number");
  const own = ranked.find((proposal) => proposal.id === proposalId);
  if (!own || own.score === null) return null;
  const score = own.score;
  const ahead = ranked.filter((proposal) => (proposal.score as number) > score).length;
  return { rank: ahead + 1, of: ranked.length };
}

export function rankLabel(rank: Rank): string {
  return `${rank.rank} of ${rank.of}`;
}

/**
 * What the read-only proposal page offers the opportunity's author and administrators in each
 * state: a proposal under review is scored, an evaluated one awarded, and either disqualified.
 */
export function offeredEvaluationActions(
  proposal: string,
  opportunity: string,
): { readonly score: boolean; readonly award: boolean; readonly disqualify: boolean } {
  return {
    score: proposal === "UNDER_REVIEW" && mayScoreInState(proposal, opportunity),
    award: mayAwardInState(proposal, opportunity),
    disqualify: mayDisqualifyInState(proposal, opportunity),
  };
}

export const NOT_PERMITTED_TO_EVALUATE =
  "Only an administrator or the opportunity's author may score, disqualify or award a proposal.";
export const CANNOT_SCORE_NOW = "Only a proposal under review, on an opportunity being evaluated, can be scored.";
export const CANNOT_DISQUALIFY_NOW = "This proposal cannot be disqualified now.";
export const CANNOT_AWARD_NOW = "Only an evaluated proposal, on an opportunity not yet awarded, can be awarded.";

// ------------------------------------------------------------------------ Sprint With Us and Team With Us results

/** States that are out of contention for an award, in every program: never put forward, taken away, or decided. */
const OUT_OF_CONTENTION: readonly string[] = ["DRAFT", "WITHDRAWN", "DISQUALIFIED", "AWARDED", "NOT_AWARDED"];

/** Whether a proposal is still in contention when another is awarded, in any program (R-1.26, R-2.33). */
export function isInContention(status: string): boolean {
  return !OUT_OF_CONTENTION.includes(status);
}

/** The last evaluated stage of each team program, from which a proposal may be awarded. */
const FINAL_EVALUATED = { "sprint-with-us": "EVALUATED_TEAM_SCENARIO", "team-with-us": "EVALUATED_CHALLENGE" } as const;
/** The last evaluation stage of each team program's opportunity. */
const FINAL_STAGE = { "sprint-with-us": "EVAL_SCENARIO", "team-with-us": "EVAL_C" } as const;

export type TeamProgramName = keyof typeof FINAL_EVALUATED;

/**
 * A Sprint With Us or Team With Us proposal may be awarded once fully evaluated, or after being
 * passed over, while its opportunity is at its final stage or in processing (R-1.26, R-2.33).
 */
export function mayAwardTeamProposalInState(program: TeamProgramName, proposal: string, opportunity: string): boolean {
  return (
    (opportunity === "PROCESSING" || opportunity === FINAL_STAGE[program]) &&
    (proposal === FINAL_EVALUATED[program] || proposal === "NOT_AWARDED")
  );
}

/**
 * A Sprint With Us or Team With Us proposal may be disqualified at any stage after its opportunity
 * has closed: under review or evaluated at any stage, or decided (R-2.34).
 */
export function mayDisqualifyTeamProposalInState(proposal: string, opportunity: string): boolean {
  const closed = !["DRAFT", "UNDER_REVIEW", "PUBLISHED", "CANCELED"].includes(opportunity);
  return closed && (/^(UNDER_REVIEW|EVALUATED)_/.test(proposal) || proposal === "AWARDED" || proposal === "NOT_AWARDED");
}

/**
 * What the read-only Sprint With Us or Team With Us proposal page offers the opportunity's author
 * and administrators here: an award once fully evaluated, and disqualification. Each stage's score
 * comes with the stages' own screens.
 */
export function offeredTeamEvaluationActions(
  program: TeamProgramName,
  proposal: string,
  opportunity: string,
): { readonly score: boolean; readonly award: boolean; readonly disqualify: boolean } {
  return {
    score: false,
    award: mayAwardTeamProposalInState(program, proposal, opportunity),
    disqualify: mayDisqualifyTeamProposalInState(proposal, opportunity),
  };
}

/** What is stored towards one team proposal's result. */
export interface TeamProposalScores {
  readonly id: string;
  readonly status: string;
  /** The agreed (consensus) score of each question, or none when there is no consensus. */
  readonly consensus: readonly number[] | null;
  readonly challenge: number | null;
  /** Sprint With Us only. */
  readonly scenario: number | null;
  readonly price: number | null;
}

/** What an opportunity weighs each stage at, out of 100, and the most its questions may score. */
export interface TeamWeights {
  readonly questions: number;
  readonly challenge: number;
  /** Sprint With Us only; zero for Team With Us. */
  readonly scenario: number;
  readonly price: number;
  readonly questionsMax: number;
}

/** A proposal's result, as its scoresheet shows it (R-2.32). Each score is a percentage. */
export interface Scoresheet {
  readonly questions: number | null;
  readonly challenge: number | null;
  readonly scenario: number | null;
  readonly price: number | null;
  /** The stages combined in the opportunity's proportions, once every stage is scored. */
  readonly total: number | null;
  /** Its place among the proposals with a total that are still standing. */
  readonly rank: Rank | null;
}

const twoPlaces = (value: number) => Math.round(value * 100) / 100;

function questionsPercent(scores: TeamProposalScores, weights: TeamWeights): number | null {
  if (!scores.consensus || scores.consensus.length === 0 || weights.questionsMax <= 0) return null;
  return twoPlaces((scores.consensus.reduce((sum, score) => sum + score, 0) / weights.questionsMax) * 100);
}

function totalOf(program: TeamProgramName, scores: TeamProposalScores, weights: TeamWeights): number | null {
  const questions = questionsPercent(scores, weights);
  const scenario = program === "sprint-with-us" ? scores.scenario : 0;
  if (questions === null || scores.challenge === null || scenario === null || scores.price === null) return null;
  return twoPlaces(
    (questions * weights.questions + scores.challenge * weights.challenge + scenario * weights.scenario + scores.price * weights.price) / 100,
  );
}

/**
 * One proposal's scoresheet among the proposals on its opportunity: each stage's score, the
 * weighted total once every stage is scored, and its rank among the totals of the proposals not
 * withdrawn or disqualified, highest first (R-2.32).
 */
export function teamScoresheet(
  program: TeamProgramName,
  proposalId: string,
  proposals: readonly TeamProposalScores[],
  weights: TeamWeights,
): Scoresheet | null {
  const own = proposals.find((proposal) => proposal.id === proposalId);
  if (!own) return null;
  const totals = proposals
    .filter((proposal) => !["DRAFT", "WITHDRAWN", "DISQUALIFIED"].includes(proposal.status))
    .map((proposal) => ({ id: proposal.id, status: "EVALUATED", score: totalOf(program, proposal, weights) }));
  const total = totalOf(program, own, weights);
  return {
    questions: questionsPercent(own, weights),
    challenge: own.challenge,
    scenario: program === "sprint-with-us" ? own.scenario : null,
    price: own.price,
    total,
    rank: total === null ? null : rankAmong(proposalId, totals),
  };
}

// ------------------------------------------------------------------------ closing

/** The first evaluation stage of each program, where an opportunity goes when it closes (R-1.1). */
export const FIRST_EVALUATION_STAGE = {
  "code-with-us": "EVALUATION",
  "sprint-with-us": "EVAL_QUESTIONS_INDIVIDUAL",
  "team-with-us": "EVAL_QUESTIONS_INDIVIDUAL",
} as const;

/** The first review stage of each program, where a submitted proposal goes when its opportunity closes (R-2.5). */
export const FIRST_REVIEW_STAGE = {
  "code-with-us": "UNDER_REVIEW",
  "sprint-with-us": "UNDER_REVIEW_QUESTIONS",
  "team-with-us": "UNDER_REVIEW_QUESTIONS",
} as const;

/** Sprint With Us and Team With Us proponents are anonymous during evaluation; Code With Us ones are not (R-1.24). */
export function anonymizesProponents(program: keyof typeof FIRST_EVALUATION_STAGE): boolean {
  return program !== "code-with-us";
}

/** The anonymous name of the proposal at a place in the order closing read them, counted from one (R-2.5). */
export function anonymousProponentName(index: number): string {
  return `Proponent ${index + 1}`;
}
