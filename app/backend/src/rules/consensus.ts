import type { OtherProgram } from "./other-program-drafts";
import {
  EnteredScore,
  EvaluatedOpportunity,
  EvaluationReader,
  EvaluationStatus,
  ScoredQuestion,
  hasPassedQuestions,
  hasReachedConsensus,
  isChairOf,
  isCompleteEvaluation,
  isOnPanel,
  scoreProblems,
} from "./individual-evaluation";

/**
 * The consensus stage of a Sprint With Us or Team With Us opportunity (decision record 0063): the
 * panel's chair records one agreed score and comment per question for each proponent, submits the
 * set, may change and submit it again until it is finalised, and the opportunity's owner or an
 * administrator finalises it — the one way out of the stage — which screens in the highest-scoring
 * proponents that met every minimum and moves the opportunity on. The two programs run it alike
 * and differ only in what their questions are called, how many proponents go forward and what the
 * next stage is called (R-5.36).
 *
 * Plain rules with no framework in them, read by the service and by the screens alike.
 */

/** What each program calls a consensus (R-5.36). */
export const CONSENSUS_NOUN: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "team question consensus",
  "team-with-us": "resource question consensus",
};

/** How many proponents finalising may carry forward (R-5.32). */
export const SCREEN_IN_LIMIT: Readonly<Record<OtherProgram, number>> = { "sprint-with-us": 4, "team-with-us": 3 };

/** The stage that follows the questions, as the opportunity holds it (R-5.36). */
export const NEXT_STAGE: Readonly<Record<OtherProgram, "EVAL_CC" | "EVAL_C">> = { "sprint-with-us": "EVAL_CC", "team-with-us": "EVAL_C" };

/** Where a screened-in proponent goes (R-5.32). */
export const NEXT_PROPOSAL_STAGE: Readonly<Record<OtherProgram, "UNDER_REVIEW_CODE_CHALLENGE" | "UNDER_REVIEW_CHALLENGE">> = {
  "sprint-with-us": "UNDER_REVIEW_CODE_CHALLENGE",
  "team-with-us": "UNDER_REVIEW_CHALLENGE",
};

/** The next stage by name, as a person reads it: the Code Challenge or the Challenge (R-5.10). */
export const NEXT_STAGE_NAME: Readonly<Record<OtherProgram, string>> = { "sprint-with-us": "Code Challenge", "team-with-us": "Challenge" };

/** The event written on each proponent's history when the agreed scores are recorded (R-5.32, R-2.35). */
export const QUESTIONS_SCORE_ENTERED = "QUESTIONS_SCORE_ENTERED";

// ------------------------------------------------------------------------ the service's words

/** R-5.29's duplicate, worded as R-5.3's is (design gap 9). */
export function duplicateConsensusRefusal(program: OtherProgram): string {
  return `You already have a ${CONSENSUS_NOUN[program]} for this proposal.`;
}

/** R-5.4's sentence, kept for R-5.13 and R-1.41. */
export const NOT_ALL_CONSENSUSES_SUBMITTED = "Not all consensuses have been submitted.";

/** R-5.4's other sentence, naming the stage that actually follows (R-5.10). */
export function noScreenableProponentRefusal(program: OtherProgram): string {
  return `You must have at least one proponent that can be screened into the ${NEXT_STAGE_NAME[program]}.`;
}

export const NOT_THE_CHAIR = "Only the chair of the opportunity's evaluation panel may record its consensus.";
export const NOT_AT_CONSENSUS = "The consensus can be recorded only while the opportunity is at the consensus stage.";
export const ONLY_THE_CHAIRS_CONSENSUS = "Only the chair may change the consensus.";
export const NEW_CONSENSUS_IS_A_DRAFT = "A new consensus can only be started as a draft.";
export const NO_CONSENSUS_THERE = "There is no such consensus.";
export const INCOMPLETE_CONSENSUS =
  "The consensus scores could not be submitted because they are incomplete. Please complete and save a consensus for every proponent before trying to submit them again.";
export const NOT_PERMITTED_TO_FINALIZE = "Only the opportunity's owner or an administrator may finalize the consensus scores.";
export const FINALIZE_NOT_AT_CONSENSUS = "The consensus scores can be finalized only while the opportunity is at the consensus stage.";
/** The one way out of the consensus stage is finalising it (R-1.50). */
export const ONLY_FINALIZING_LEAVES_CONSENSUS =
  "The opportunity leaves the consensus stage only when the consensus scores are finalized.";
/** Said to an owner who is not on the panel while the consensus is being agreed (R-5.12). */
export function consensusWithheld(program: OtherProgram): string {
  return `While the consensus is being agreed, only the evaluation panel can see it, and you are not on this opportunity's panel. The agreed scores appear here once the opportunity moves to the ${NEXT_STAGE_NAME[program].toLowerCase()}.`;
}
/** The note on the history rows finalising writes. */
export const FINALIZED_NOTE = "Consensus scores finalized.";

// ------------------------------------------------------------------------ who may do what

const isOwner = (reader: EvaluationReader | null, opportunity: EvaluatedOpportunity) =>
  (reader?.type === "GOV" || reader?.type === "ADMIN") && opportunity.createdBy !== null && opportunity.createdBy === reader.id;

/** Only the chair records and changes the consensus, and only while the opportunity is at consensus (R-5.29, R-5.30). */
export function mayRecordConsensus(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isChairOf(reader, opportunity) && opportunity.status === "EVAL_QUESTIONS_CONSENSUS";
}

/**
 * Who reads the consensus (R-5.12, R-5.28; decision record 0063): an administrator at any stage;
 * every member of the panel once the consensus stage has begun; the opportunity's owner once it has
 * begun if they sit on the panel, and otherwise only once the question stages are over. Nobody else.
 */
export function mayReadConsensus(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  if (reader?.type === "ADMIN") return true;
  if (!hasReachedConsensus(opportunity.status)) return false;
  if (isOnPanel(reader, opportunity)) return true;
  return isOwner(reader, opportunity) && hasPassedQuestions(opportunity.status);
}

/** The owner off the panel, while the consensus is being agreed: told why, not shown an empty list (R-5.12). */
export function isConsensusWithheldFrom(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return isOwner(reader, opportunity) && hasReachedConsensus(opportunity.status) && !mayReadConsensus(reader, opportunity);
}

/** The single finalise action belongs to the opportunity's owner and administrators (R-5.14). */
export function mayFinalizeConsensus(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return reader?.type === "ADMIN" || isOwner(reader, opportunity);
}

/** Whether the finalise action is offered now: to whoever may finalise, at the consensus stage (R-1.50, R-5.14). */
export function offersFinalize(reader: EvaluationReader | null, opportunity: EvaluatedOpportunity): boolean {
  return mayFinalizeConsensus(reader, opportunity) && opportunity.status === "EVAL_QUESTIONS_CONSENSUS";
}

// ------------------------------------------------------------------------ the chair's set

/** One proponent's consensus as the screening reads it. */
export interface ConsensusOf {
  readonly proposal: string;
  readonly anonymousProponentName: string;
  readonly status: EvaluationStatus;
  readonly scores: readonly EnteredScore[];
}

/** A consensus's state in words, as an evaluation's is. */
export function consensusStatusLabel(
  consensus: { readonly status: EvaluationStatus; readonly scores: readonly EnteredScore[] } | null,
  questions: readonly ScoredQuestion[],
): "Not started" | "Draft: incomplete" | "Draft: complete" | "Submitted" {
  if (!consensus) return "Not started";
  if (consensus.status === "SUBMITTED") return "Submitted";
  return isCompleteEvaluation(questions, consensus.scores) ? "Draft: complete" : "Draft: incomplete";
}

/** A consensus is scored against the same rules as an individual evaluation (R-5.29 note). */
export const consensusProblems = scoreProblems;

/**
 * Whether the chair may submit the set (R-5.13, R-5.29): every proponent still under review of the
 * questions has a consensus, and each is complete.
 */
export function maySubmitConsensusSet(
  questions: readonly ScoredQuestion[],
  awaited: readonly string[],
  consensuses: readonly ConsensusOf[],
): boolean {
  if (awaited.length === 0) return false;
  return awaited.every((proposal) => {
    const found = consensuses.find((consensus) => consensus.proposal === proposal);
    return found !== undefined && isCompleteEvaluation(questions, found.scores);
  });
}

// ------------------------------------------------------------------------ finalising

/** A question with a minimum score, as screening reads it. */
export interface ScreenedQuestion extends ScoredQuestion {
  readonly minimumScore: number | null;
}

/** Whether agreed scores meet the minimum of every question that sets one (R-1.41, R-2.29). */
export function meetsEveryMinimum(questions: readonly ScreenedQuestion[], scores: readonly EnteredScore[]): boolean {
  return questions.every((question, order) => {
    if (question.minimumScore === null) return true;
    const score = scores.find((entry) => entry.order === order)?.score;
    return typeof score === "number" && score >= question.minimumScore;
  });
}

/** The sum of the agreed scores. */
export function agreedTotal(scores: readonly EnteredScore[]): number {
  return scores.reduce((sum, entry) => sum + (typeof entry.score === "number" ? entry.score : 0), 0);
}

export type FinalizeOutcome =
  | { readonly kind: "refused"; readonly reason: string }
  /** The proponents carried forward, highest first, and every proponent's agreed scores. */
  | { readonly kind: "finalized"; readonly screenedIn: readonly string[]; readonly recorded: readonly ConsensusOf[] };

/**
 * What finalising does with the consensus (R-1.41, R-5.13, R-5.32, R-2.29): refused unless every
 * proponent still under review of the questions has a submitted consensus, and unless at least one
 * of them met every minimum; otherwise those that met every minimum are ranked by their agreed
 * total and the highest few — four for Sprint With Us, three for Team With Us — are screened in. A
 * proponent no longer under review of the questions is passed over. Equal totals keep the
 * anonymous order.
 */
export function finalizeOutcome(
  program: OtherProgram,
  questions: readonly ScreenedQuestion[],
  awaited: readonly { readonly id: string; readonly anonymousProponentName: string }[],
  consensuses: readonly ConsensusOf[],
): FinalizeOutcome {
  const recorded: ConsensusOf[] = [];
  for (const proponent of awaited) {
    const found = consensuses.find((consensus) => consensus.proposal === proponent.id);
    if (!found || found.status !== "SUBMITTED") return { kind: "refused", reason: NOT_ALL_CONSENSUSES_SUBMITTED };
    recorded.push(found);
  }
  if (recorded.length === 0) return { kind: "refused", reason: NOT_ALL_CONSENSUSES_SUBMITTED };
  const eligible = recorded
    .filter((consensus) => meetsEveryMinimum(questions, consensus.scores))
    .sort(
      (a, b) =>
        agreedTotal(b.scores) - agreedTotal(a.scores) ||
        a.anonymousProponentName.localeCompare(b.anonymousProponentName, "en", { numeric: true }),
    );
  if (eligible.length === 0) return { kind: "refused", reason: noScreenableProponentRefusal(program) };
  return { kind: "finalized", screenedIn: eligible.slice(0, SCREEN_IN_LIMIT[program]).map((consensus) => consensus.proposal), recorded };
}

/** A score as written in a history note: as entered, without trailing zeros. */
const scoreWords = (score: number | null) => (typeof score === "number" ? String(Number(score.toFixed(2))) : "none");

/**
 * The note on a proponent's history once the agreed scores are recorded (R-5.32): "Team question
 * scores were entered. Q1: 5; Q2: 5; Q3: 5; Q4: 5."
 */
export function questionsScoreNote(program: OtherProgram, questionCount: number, scores: readonly EnteredScore[]): string {
  const noun = program === "sprint-with-us" ? "Team question" : "Resource question";
  const parts = Array.from({ length: questionCount }, (_, order) => `Q${order + 1}: ${scoreWords(scores.find((entry) => entry.order === order)?.score ?? null)}`);
  return `${noun} scores were entered. ${parts.join("; ")}.`;
}
