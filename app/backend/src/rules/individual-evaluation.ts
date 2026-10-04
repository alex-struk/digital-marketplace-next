import type { AccountKind } from "./users";
import type { OpportunityStatus } from "./opportunities";
import type { OtherProgram } from "./other-program-drafts";

/**
 * Individual evaluation of a Sprint With Us or Team With Us opportunity's questions (decision
 * record 0062): each evaluator on the panel scores every proponent on their own, one score and one
 * comment per question, saves drafts as they go, and submits the whole set at once; once every
 * evaluator has, the opportunity moves to consensus by itself. The two programs run it alike and
 * differ only in what their questions are called (R-5.36).
 *
 * Plain rules with no framework in them, read by the service and by the screens alike.
 */

/** Someone on an opportunity's evaluation panel, by account. */
export interface PanelSeat {
  readonly user: string;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

/** What the rules about an evaluation turn on: the opportunity's state, its author and its panel. */
export interface EvaluatedOpportunity {
  readonly status: OpportunityStatus;
  readonly createdBy: string | null;
  readonly panel: readonly PanelSeat[];
}

export interface EvaluationReader {
  readonly id: string;
  readonly type: AccountKind;
}

/** One question's score and comment as entered; the score is null while none is entered. */
export interface EnteredScore {
  readonly order: number;
  readonly score: number | null;
  readonly notes: string;
}

/** A question as an evaluation is scored against it: worth up to `score` points. */
export interface ScoredQuestion {
  readonly score: number;
}

export const EVALUATION_STATUSES = ["DRAFT", "SUBMITTED"] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

/** What each program calls its questions (R-5.36). */
export const QUESTION_NOUN: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "team question",
  "team-with-us": "resource question",
};

/** The part of an evaluation's address that names the questions. */
export const QUESTIONS_SEGMENT: Readonly<Record<OtherProgram, "team-questions" | "resource-questions">> = {
  "sprint-with-us": "team-questions",
  "team-with-us": "resource-questions",
};

// ------------------------------------------------------------------------ the service's words

/** R-5.3, in the service's own words. */
export function duplicateEvaluationRefusal(program: OtherProgram): string {
  return `You already have a ${QUESTION_NOUN[program]} evaluation for this proposal.`;
}

/** R-5.25, in the service's own words. */
export const INCOMPLETE_EVALUATION =
  "This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again.";
export const NOT_AN_EVALUATOR = "Only an evaluator on the opportunity's evaluation panel may evaluate its proponents.";
export const NOT_AT_INDIVIDUAL_EVALUATION =
  "Proponents can be evaluated only while the opportunity's questions are being evaluated individually.";
export const PROPONENT_NOT_UNDER_REVIEW = "This proponent is not being evaluated on its questions.";
export const ONLY_YOUR_OWN_EVALUATION = "You may change only your own evaluation.";
export const SUBMITTED_EVALUATION_FIXED = "A submitted evaluation cannot be changed.";
export const NEW_EVALUATION_IS_A_DRAFT = "A new evaluation can only be started as a draft.";
export const SCORES_ALREADY_SUBMITTED = "Your scores have already been submitted.";
export const NO_PROPONENTS_TO_EVALUATE = "There are no proponents to evaluate.";
export const NO_EVALUATION_THERE = "There is no such evaluation.";

/**
 * The answer to anything but "edit" sent to one evaluation, a request to submit it alone included:
 * the request is unrecognised, since submission is only of the whole set (R-5.26).
 */
export function unrecognisedEvaluationRequest(tag: unknown): string {
  const named = typeof tag === "string" && tag.length > 0 ? `"${tag}"` : "This request";
  return `Unrecognised request: ${named} is not recognised for an evaluation. An evaluation can only be edited here; scores are submitted as a whole set from the opportunity.`;
}
export const PROPOSAL_NOT_OF_OPPORTUNITY = "The evaluation names a different proposal from the one it is sent to.";
/** Where the consensus begins (R-5.27): recorded on the opportunity's history. */
export const MOVED_TO_CONSENSUS_NOTE = "Every evaluator submitted their individual scores, so the consensus stage began.";

// ------------------------------------------------------------------------ the stages

/** The question stages are over: the code challenge, team scenario or challenge, processing, or awarded. */
export function hasPassedQuestions(status: OpportunityStatus): boolean {
  return status === "EVAL_CC" || status === "EVAL_SCENARIO" || status === "EVAL_C" || status === "PROCESSING" || status === "AWARDED";
}

/** The consensus stage has begun, or is over. */
export function hasReachedConsensus(status: OpportunityStatus): boolean {
  return status === "EVAL_QUESTIONS_CONSENSUS" || hasPassedQuestions(status);
}

/** The opportunity has closed and is being evaluated, or has been. */
export function hasClosedForEvaluation(status: OpportunityStatus): boolean {
  return status === "EVAL_QUESTIONS_INDIVIDUAL" || hasReachedConsensus(status);
}

// ------------------------------------------------------------------------ who may do what

const isStaff = (reader: EvaluationReader | null): reader is EvaluationReader => reader?.type === "GOV" || reader?.type === "ADMIN";
const seatOf = (reader: EvaluationReader | null, opportunity: EvaluatedOpportunity) =>
  reader ? opportunity.panel.find((seat) => seat.user === reader.id) : undefined;

export function isOnPanel(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isStaff(reader) && seatOf(reader, opportunity) !== undefined;
}

export function isEvaluatorOn(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isStaff(reader) && seatOf(reader, opportunity)?.evaluator === true;
}

export function isChairOf(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isStaff(reader) && seatOf(reader, opportunity)?.chair === true;
}

const isOwnerOrAdministrator = (reader: EvaluationReader | null, opportunity: EvaluatedOpportunity) =>
  reader?.type === "ADMIN" || (isStaff(reader) && opportunity.createdBy !== null && opportunity.createdBy === reader.id);

/** Only an evaluator on the panel records an evaluation, and only during individual evaluation (R-5.21). */
export function mayRecordIndividualEvaluation(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isEvaluatorOn(reader, opportunity) && opportunity.status === "EVAL_QUESTIONS_INDIVIDUAL";
}

/**
 * Who may read one evaluator's evaluation (R-5.11, R-5.28; decision record 0062): its evaluator at
 * any stage; every panel member once the consensus stage has begun; the opportunity's owner and
 * administrators who are not on the panel once the question stages are over. Nobody else, ever — a
 * public sector employee with no connection to the opportunity included.
 */
export function mayReadIndividualEvaluation(
  reader: EvaluationReader | null,
  evaluatorId: string,
  opportunity: EvaluatedOpportunity,
): boolean {
  if (!isStaff(reader)) return false;
  if (reader.id === evaluatorId) return true;
  if (!hasReachedConsensus(opportunity.status)) return false;
  if (isOnPanel(reader, opportunity)) return true;
  return isOwnerOrAdministrator(reader, opportunity) && hasPassedQuestions(opportunity.status);
}

/** Who may ask for an opportunity's evaluations at all: its panel, its owner and administrators (R-5.11). */
export function mayAskForEvaluations(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isOnPanel(reader, opportunity) || isOwnerOrAdministrator(reader, opportunity);
}

export type EvaluationTab = "instructions" | "evaluation" | "consensus";

/**
 * The evaluation tools the manage page offers a person (R-5.34): the instructions and their own
 * evaluations to an evaluator, and the consensus — once the opportunity has closed — to the chair,
 * the opportunity's owner and administrators. The panel itself is the owner's and administrators'
 * tab, offered with the rest of the manage page. Anybody else is offered none of them.
 */
export function evaluationTabsFor(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): EvaluationTab[] {
  const tabs: EvaluationTab[] = [];
  if (isEvaluatorOn(reader, opportunity)) tabs.push("instructions", "evaluation");
  if (hasClosedForEvaluation(opportunity.status) && (isChairOf(reader, opportunity) || isOwnerOrAdministrator(reader, opportunity))) {
    tabs.push("consensus");
  }
  return tabs;
}

// ------------------------------------------------------------------------ scores

/** A score as it was stored: the kept schema holds a single-precision number, read back as entered. */
export function storedScore(value: number): number {
  return Number(value.toPrecision(7));
}

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) <= 1e-6;

/** One reason an evaluation cannot be submitted, against the field it is about. */
export interface ScoreProblem {
  readonly order: number;
  readonly field: "score" | "notes";
  readonly message: string;
}

/**
 * Why an evaluation is not complete (R-5.22): each question needs a score between zero and its
 * maximum with at most two decimal places, and a comment of at least one word.
 */
export function scoreProblems(questions: readonly ScoredQuestion[], scores: readonly EnteredScore[]): ScoreProblem[] {
  const problems: ScoreProblem[] = [];
  questions.forEach((question, order) => {
    const entry = scores.find((score) => score.order === order);
    const number = order + 1;
    const score = entry?.score;
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > question.score) {
      problems.push({ order, field: "score", message: `Enter a score between 0 and ${question.score} for question ${number}.` });
    } else if (!hasAtMostTwoDecimals(score)) {
      problems.push({ order, field: "score", message: `Enter a score with no more than two decimal places for question ${number}.` });
    }
    if (!entry || entry.notes.trim() === "") {
      problems.push({ order, field: "notes", message: `Enter a comment for question ${number}.` });
    }
  });
  return problems;
}

export function isCompleteEvaluation(questions: readonly ScoredQuestion[], scores: readonly EnteredScore[]): boolean {
  return scoreProblems(questions, scores).length === 0;
}

/**
 * The scores a request carries, as they are to be stored: one entry per question the opportunity
 * asks, in question order, a number or nothing for the score and text for the comment. A draft is
 * kept as entered, out of range or not (R-5.23); anything that is not a question is left out.
 */
export function readEnteredScores(value: unknown, questionCount: number): EnteredScore[] {
  const given = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && Array.isArray((value as { scores?: unknown }).scores)
      ? ((value as { scores: unknown[] }).scores as unknown[])
      : [];
  const byOrder = new Map<number, EnteredScore>();
  given.forEach((item, index) => {
    if (typeof item !== "object" || item === null) return;
    const record = item as Record<string, unknown>;
    const order = typeof record.order === "number" && Number.isInteger(record.order) ? record.order : index;
    if (order < 0 || order >= questionCount || byOrder.has(order)) return;
    const raw = typeof record.score === "string" && record.score.trim() !== "" ? Number(record.score) : record.score;
    const score = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    byOrder.set(order, { order, score, notes: typeof record.notes === "string" ? record.notes : "" });
  });
  return [...byOrder.values()].sort((a, b) => a.order - b.order);
}

/** An evaluation's state in words (the design's status badge). */
export function evaluationStatusLabel(
  evaluation: { readonly status: EvaluationStatus; readonly scores: readonly EnteredScore[] } | null,
  questions: readonly ScoredQuestion[],
): "Not started" | "Draft: incomplete" | "Draft: complete" | "Submitted" {
  if (!evaluation) return "Not started";
  if (evaluation.status === "SUBMITTED") return "Submitted";
  return isCompleteEvaluation(questions, evaluation.scores) ? "Draft: complete" : "Draft: incomplete";
}

// ------------------------------------------------------------------------ moving on

/** One submitted evaluation, as the count of submitted scores reads it. */
export interface SubmittedEvaluation {
  readonly evaluator: string;
  readonly proposal: string;
  /** The question orders it holds a score for. */
  readonly scored: readonly number[];
}

/**
 * Whether individual evaluation is over (R-5.27): the submitted scores number one per question per
 * proponent per evaluator, counted against the panel and the questions of the opportunity's current
 * version, over the proponents still under review of the questions.
 */
export function individualEvaluationIsComplete(input: {
  readonly evaluators: readonly string[];
  readonly proposals: readonly string[];
  readonly questionCount: number;
  readonly submitted: readonly SubmittedEvaluation[];
}): boolean {
  const awaited = input.evaluators.length * input.proposals.length * input.questionCount;
  if (awaited === 0) return false;
  const evaluators = new Set(input.evaluators);
  const proposals = new Set(input.proposals);
  const counted = input.submitted
    .filter((evaluation) => evaluators.has(evaluation.evaluator) && proposals.has(evaluation.proposal))
    .reduce((total, evaluation) => total + new Set(evaluation.scored.filter((order) => order >= 0 && order < input.questionCount)).size, 0);
  return counted === awaited;
}

/** Proponents in their anonymous names' order, "Proponent 2" before "Proponent 10" (R-5.35). */
export function byAnonymousName(a: { readonly anonymousProponentName: string }, b: { readonly anonymousProponentName: string }): number {
  return a.anonymousProponentName.localeCompare(b.anonymousProponentName, "en", { numeric: true });
}
