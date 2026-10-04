import type { FileRecord } from "../files/file";
import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import {
  CreationState,
  OtherProgram,
  OtherProgramDraft,
  PanelMemberDraft,
  QuestionDraft,
  SwuPhase,
  WeightsDraft,
} from "../rules/other-program-drafts";
import { Person } from "./cwu-opportunity";
import type { RunningAnswer } from "./opportunity-running.service";

/** The two programs with an evaluation panel: Sprint With Us and Team With Us. */
export type { OtherProgram } from "../rules/other-program-drafts";

/**
 * A Sprint With Us or Team With Us opportunity as the list and its screens need it: who
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
  /** Each resource with its identifier, which a Team With Us proposal names its team against (R-2.20). */
  readonly resources: readonly { readonly id: string; readonly serviceArea: string; readonly targetAllocation: number }[];
  readonly weights: WeightsDraft;
  readonly panel: readonly { readonly user: Person; readonly evaluator: boolean; readonly chair: boolean }[];
  /** The files the current version carries (decision record 0055). */
  readonly attachments: readonly FileRecord[];
}

export interface StoredPhase {
  readonly phase: SwuPhase;
  readonly startDate: CalendarDay;
  readonly completionDate: CalendarDay;
  readonly maxBudget: number;
  /** What the phase's team must hold between them (R-2.19); empty when none is recorded. */
  readonly requiredCapabilities: readonly string[];
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
  /**
   * A new version of its content with the panel given, recorded in its history as an edit, as one
   * change (R-1.4, R-5.16). The panel is kept as given; whether it may stand is the service's
   * question.
   */
  addVersion(program: OtherProgram, id: string, content: OtherProgramDraft, panel: readonly PanelMemberDraft[], by: string): Promise<void>;
  /** Removes the opportunity with its versions, history and addenda (R-1.53). */
  remove(program: OtherProgram, id: string): Promise<void>;
  /** The accounts held at these identifiers, for judging a panel that names them (R-5.1). */
  accounts(ids: readonly string[]): Promise<PanelAccount[]>;
}

/** An account a panel names, as the panel's rules need it. */
export interface PanelAccount {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: string;
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
  readonly resources?: readonly { readonly id: string; readonly serviceArea: string; readonly targetAllocation: number; readonly order: number }[];
  readonly resourceQuestions?: readonly (QuestionDraft & { readonly order: number })[];
  readonly challengeWeight?: number;
  /** Both. */
  readonly questionsWeight?: number;
  readonly priceWeight?: number;
  readonly evaluationPanel?: readonly { readonly user: Person; readonly evaluator: boolean; readonly chair: boolean; readonly order: number }[];
  /** The files it carries, readable by whoever may read it (R-8.20, R-8.25). */
  readonly attachments?: readonly FileRecord[];
  // On reading one opportunity, what running it has gathered (decision record 0043).
  /** Every addendum, oldest first (R-1.32). */
  readonly addenda?: RunningAnswer["addenda"];
  /** The author and administrators only (R-1.30). */
  readonly history?: RunningAnswer["history"];
  /** The author and administrators only, once it has been published (R-1.30). */
  readonly reporting?: RunningAnswer["reporting"];
}
