import { FileRecord } from "../files/file";
import { OpportunityEvent, OpportunityStatus, Program } from "../rules/opportunities";
import { Person, Recipient } from "./cwu-opportunity";

/** One addendum, as it was added (R-1.32). */
export interface StoredAddendum {
  readonly id: string;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly description: string;
}

/** One entry in an opportunity's history, with the files a note carries (R-1.30, R-1.33). */
export interface RecordedEntry {
  readonly id: string;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly status: OpportunityStatus | null;
  readonly event: OpportunityEvent | null;
  readonly note: string | null;
  readonly attachments: readonly FileRecord[];
}

/** The figures reported to an opportunity's author and administrators (R-1.30). */
export interface ReportingFigures {
  readonly numViews: number;
  readonly numWatchers: number;
  readonly numProposals: number;
}

/**
 * What an opportunity gathers once it is under way, in any of the three programs: its addenda, its
 * history with the files notes carry, the people who are told about it, and the figures reported
 * to its author and administrators. The service is written against this rather than against
 * Prisma, so the rules about running an opportunity can be tested without a database.
 */
export interface OpportunityRecordsStore {
  /** Oldest first, as they were appended. */
  addenda(program: Program, opportunityId: string): Promise<StoredAddendum[]>;
  /** Appends an addendum and records it in the history, as one change (R-1.32). */
  addAddendum(program: Program, opportunityId: string, description: string, by: string): Promise<void>;
  /** Records a note in the history with the files it carries, as one change (R-1.33). */
  addNote(program: Program, opportunityId: string, note: string, files: readonly string[], by: string): Promise<void>;
  /** Records a change of state in the history, with an optional note. */
  changeStatus(program: Program, opportunityId: string, status: OpportunityStatus, by: string, note: string | null): Promise<void>;
  /** Every change of state and every event, newest first. */
  history(program: Program, opportunityId: string): Promise<RecordedEntry[]>;
  /** Everyone watching the opportunity whose account is active (R-1.35, R-1.36, R-6.17). */
  watcherRecipients(program: Program, opportunityId: string): Promise<Recipient[]>;
  /** The author of every proposal submitted to it, whose account is active (R-1.35, R-1.36, R-6.17). */
  proponentRecipients(program: Program, opportunityId: string): Promise<Recipient[]>;
  /**
   * How often its public page has been opened, how many people watch it, and how many proposals
   * have been submitted to it — any that is neither a draft nor withdrawn (R-1.30).
   */
  reportingFigures(program: Program, opportunityId: string): Promise<ReportingFigures>;
  /** An account's address, if the account is active (R-6.17). */
  recipient(accountId: string): Promise<Recipient | null>;
}

export const OPPORTUNITY_RECORDS_STORE = Symbol("OpportunityRecordsStore");
