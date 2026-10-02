import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import {
  CreationState,
  OtherProgram,
  OtherProgramDraft,
  QuestionDraft,
  SwuPhase,
  WeightsDraft,
} from "../rules/other-program-drafts";
import { Person } from "./cwu-opportunity";

/** The two programs whose opportunities slice 10 completes; until then they are listed, read and created. */
export type { OtherProgram } from "../rules/other-program-drafts";

/**
 * A Sprint With Us or Team With Us opportunity as the list and its interim screens need it: who
 * made it, its state, and its current version's title, place, dates, description and budget — the
 * total maximum budget for Sprint With Us, the maximum budget for Team With Us.
 */
export interface StoredSummary {
  readonly id: string;
  readonly program: OtherProgram;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly updatedAt: Date;
  readonly updatedBy: Person | null;
  readonly status: OpportunityStatus;
  readonly publishedAt: Date | null;
  readonly title: string;
  readonly teaser: string;
  readonly location: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly description: string;
  readonly proposalDeadline: CalendarDay;
  readonly assignmentDate: CalendarDay;
  /** Team With Us only; Sprint With Us keeps these on its phases. */
  readonly startDate: CalendarDay | null;
  readonly completionDate: CalendarDay | null;
  readonly budget: number;
  /** What the program itself holds, read for one opportunity and not for the list. */
  readonly details?: StoredDetails;
}

/**
 * A Sprint With Us opportunity's skills, phases and team questions, or a Team With Us
 * opportunity's resources and resource questions; and either's weights and evaluation panel.
 */
export interface StoredDetails {
  readonly skills: readonly string[];
  readonly phases: readonly StoredPhase[];
  readonly questions: readonly QuestionDraft[];
  readonly resources: readonly { readonly serviceArea: string; readonly targetAllocation: number }[];
  readonly weights: WeightsDraft;
  readonly panel: readonly { readonly user: Person; readonly evaluator: boolean; readonly chair: boolean }[];
}

export interface StoredPhase {
  readonly phase: SwuPhase;
  readonly startDate: CalendarDay;
  readonly completionDate: CalendarDay;
  readonly maxBudget: number;
}

export interface OtherProgramsStore {
  /** Every opportunity of the program, newest first. */
  list(program: OtherProgram): Promise<StoredSummary[]>;
  /** One opportunity of the program, or null when none is held at that identifier. */
  find(program: OtherProgram, id: string): Promise<StoredSummary | null>;
  /**
   * A new opportunity, with its first version, what its program holds and its first state; answers
   * with its identifier. Panel members who are not public sector staff are left off, and a panel
   * that names nobody is the author alone, as chair and evaluator.
   */
  create(program: OtherProgram, content: OtherProgramDraft, status: CreationState, by: string): Promise<string>;
}

export const OTHER_PROGRAMS_STORE = Symbol("OtherProgramsStore");

/** How a Sprint With Us or Team With Us opportunity is answered with (decision records 0034, 0035). */
export interface SummaryAnswer {
  readonly id: string;
  readonly program: OtherProgram;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Present only for an administrator and for the people named (R-1.29). */
  readonly createdBy?: Person | null;
  readonly updatedBy?: Person | null;
  readonly status: OpportunityStatus;
  readonly publishedAt: string | null;
  readonly title: string;
  readonly teaser: string;
  readonly location: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly description: string;
  readonly proposalDeadline: CalendarDay;
  readonly assignmentDate: CalendarDay;
  /** Team With Us. */
  readonly startDate?: CalendarDay;
  readonly completionDate?: CalendarDay | null;
  /** Sprint With Us. */
  readonly totalMaxBudget?: number;
  /** Team With Us. */
  readonly maxBudget?: number;
  /** Whether the person asking watches it; false for a visitor (R-1.5). */
  readonly subscribed: boolean;
  // On reading one opportunity, what its program holds, named as the old service named it.
  /** Sprint With Us. */
  readonly mandatorySkills?: readonly string[];
  readonly inceptionPhase?: StoredPhase | null;
  readonly prototypePhase?: StoredPhase | null;
  readonly implementationPhase?: StoredPhase | null;
  readonly teamQuestions?: readonly (QuestionDraft & { readonly order: number })[];
  readonly codeChallengeWeight?: number;
  readonly scenarioWeight?: number;
  /** Team With Us. */
  readonly resources?: readonly { readonly serviceArea: string; readonly targetAllocation: number; readonly order: number }[];
  readonly resourceQuestions?: readonly (QuestionDraft & { readonly order: number })[];
  readonly challengeWeight?: number;
  /** Both. */
  readonly questionsWeight?: number;
  readonly priceWeight?: number;
  readonly evaluationPanel?: readonly { readonly user: Person; readonly evaluator: boolean; readonly chair: boolean; readonly order: number }[];
}
