import type { EnteredScore } from "../rules/individual-evaluation";
import type { OtherProgram } from "../rules/other-program-drafts";
import type { StoredEvaluation } from "./individual-evaluation";

/** What finalising writes (R-5.32): each proponent's agreed scores, and who goes forward. */
export interface Finalizing {
  /** One history note per proponent whose agreed scores are recorded. */
  readonly recorded: readonly { readonly proposal: string; readonly note: string }[];
  /** The proponents screened into the next stage. */
  readonly screenedIn: readonly string[];
}

/**
 * The chair's consensus of Sprint With Us team questions and Team With Us resource questions, over
 * the kept schema's chair tables (decision record 0063). Read back in the same shape as an
 * individual evaluation, the chair as its panel member.
 */
export interface ConsensusStore {
  /** Every consensus of one proposal, or of every proposal of one opportunity. */
  consensuses(program: OtherProgram, of: { readonly proposal: string } | { readonly opportunity: string }): Promise<StoredEvaluation[]>;
  /**
   * Starts the chair's draft consensus of one proposal; false, and nothing written, when the
   * proposal already has a consensus (R-5.29: one per proponent).
   */
  create(program: OtherProgram, proposalId: string, chairId: string, scores: readonly EnteredScore[], at: Date): Promise<boolean>;
  /** Replaces the agreed scores; a submitted consensus stays submitted (R-5.30). */
  update(program: OtherProgram, proposalId: string, chairId: string, scores: readonly EnteredScore[], at: Date): Promise<void>;
  /** Records each of these consensuses as submitted, afresh for one already submitted (R-5.30). */
  submit(program: OtherProgram, proposalIds: readonly string[], chairId: string, at: Date): Promise<void>;
  /**
   * As one change, with the opportunity held: writes each proponent's agreed scores on its history,
   * moves the screened-in proponents to the next stage and the opportunity with them. False, and
   * nothing written, when the opportunity is no longer at consensus by then.
   */
  finalize(program: OtherProgram, opportunityId: string, finalizing: Finalizing, by: string, at: Date): Promise<boolean>;
}

export const CONSENSUS_STORE = Symbol("ConsensusStore");
