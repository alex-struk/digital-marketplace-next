import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import { OtherProgram, OtherProgramDraft } from "../rules/other-program-drafts";
import { Person } from "./cwu-opportunity";

/** The two programs whose opportunities slice 10 completes; until then they are listed, read and drafted. */
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
}

export interface OtherProgramsStore {
  /** Every opportunity of the program, newest first. */
  list(program: OtherProgram): Promise<StoredSummary[]>;
  /** One opportunity of the program, or null when none is held at that identifier. */
  find(program: OtherProgram, id: string): Promise<StoredSummary | null>;
  /** A new draft, with its first version and its first state; answers with its identifier. */
  createDraft(program: OtherProgram, draft: OtherProgramDraft, by: string): Promise<string>;
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
}
