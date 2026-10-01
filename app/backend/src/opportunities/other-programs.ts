import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import { Person } from "./cwu-opportunity";

/** The two programs whose opportunities slice 10 makes; until then they are only listed. */
export type OtherProgram = "sprint-with-us" | "team-with-us";

/**
 * A Sprint With Us or Team With Us opportunity as the list needs it: who made it, its state, and
 * its current version's title, place, deadline and budget — the total maximum budget for Sprint
 * With Us, the maximum budget for Team With Us.
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
  readonly proposalDeadline: CalendarDay;
  readonly budget: number;
}

export interface OtherProgramsStore {
  /** Every opportunity of the program, newest first. */
  list(program: OtherProgram): Promise<StoredSummary[]>;
}

export const OTHER_PROGRAMS_STORE = Symbol("OtherProgramsStore");

/** How a listed Sprint With Us or Team With Us opportunity is answered with (decision record 0034). */
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
  readonly proposalDeadline: CalendarDay;
  /** Sprint With Us. */
  readonly totalMaxBudget?: number;
  /** Team With Us. */
  readonly maxBudget?: number;
  /** Whether the person asking watches it; false for a visitor (R-1.5). */
  readonly subscribed: boolean;
}
