import type { EnteredScore, EvaluationStatus, SubmittedEvaluation } from "../rules/individual-evaluation";
import type { OtherProgram } from "../rules/other-program-drafts";

/** A proposal as an evaluation names it: by its anonymous name only (R-5.35). */
export interface Proponent {
  readonly id: string;
  readonly opportunity: string;
  readonly anonymousProponentName: string;
  /** Its current state, as its history names it. */
  readonly status: string | null;
  /** Its answer to each question, in question order. */
  readonly responses: readonly { readonly order: number; readonly response: string }[];
}

/** One evaluator's scores for one proponent, as they are kept. */
export interface StoredEvaluation {
  readonly proposal: { readonly id: string; readonly anonymousProponentName: string };
  readonly evaluator: { readonly id: string; readonly name: string };
  readonly status: EvaluationStatus;
  readonly scores: readonly EnteredScore[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * The individual evaluations of Sprint With Us team questions and Team With Us resource questions,
 * over the kept schema's tables for them (decision record 0062). The service is written against
 * this rather than Prisma, so its rules can be tested without a database.
 */
export interface IndividualEvaluationStore {
  /** Every proposal of the opportunity that has been given an anonymous name, with its answers. */
  proponents(program: OtherProgram, opportunityId: string): Promise<Proponent[]>;
  /** One proposal, or null when none is held at that identifier. */
  proponent(program: OtherProgram, proposalId: string): Promise<Proponent | null>;
  /** Every evaluation of one proposal, or of every proposal of one opportunity. */
  evaluations(program: OtherProgram, of: { readonly proposal: string } | { readonly opportunity: string }): Promise<StoredEvaluation[]>;
  /**
   * Starts an evaluator's draft of one proposal with the scores given; false, and nothing written,
   * when they already hold one (R-5.3).
   */
  create(program: OtherProgram, proposalId: string, evaluatorId: string, scores: readonly EnteredScore[], at: Date): Promise<boolean>;
  /** Replaces the scores of an evaluator's draft. */
  update(program: OtherProgram, proposalId: string, evaluatorId: string, scores: readonly EnteredScore[], at: Date): Promise<void>;
  /**
   * Submits the evaluator's evaluations of these proposals, as one change, and then — still within
   * it, the opportunity held so two last submissions cannot both miss the moment — asks `isOver`
   * of every submitted evaluation of the opportunity; if it answers yes, moves the opportunity to
   * consensus. Answers whether it did.
   */
  submit(
    program: OtherProgram,
    opportunityId: string,
    proposalIds: readonly string[],
    evaluatorId: string,
    at: Date,
    isOver: (submitted: readonly SubmittedEvaluation[]) => boolean,
  ): Promise<{ readonly movedToConsensus: boolean }>;
}

export const INDIVIDUAL_EVALUATION_STORE = Symbol("IndividualEvaluationStore");
