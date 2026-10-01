import { FileRecord } from "../files/file";
import { CwuContent, CwuStatus, OpportunityEvent } from "../rules/opportunities";

/** A person named against an opportunity: who created it, who last changed it. */
export interface Person {
  readonly id: string;
  readonly name: string;
}

/** One entry in an opportunity's history: a change of state, or an event such as an edit. */
export interface HistoryEntry {
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly status: CwuStatus | null;
  readonly event: OpportunityEvent | null;
  readonly note: string | null;
}

/**
 * A Code With Us opportunity as the kept schema holds it: the opportunity, its current version
 * (the last one saved; the earlier ones are kept, R-1.4), its state (the last change recorded in
 * its history), and the files its current version carries.
 */
export interface StoredCwuOpportunity {
  readonly id: string;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  /** When the current version was saved, and by whom. */
  readonly updatedAt: Date;
  readonly updatedBy: Person | null;
  readonly status: CwuStatus;
  /** The moment it was first published, however often it has been published since (R-1.23). */
  readonly publishedAt: Date | null;
  readonly content: CwuContent;
  readonly attachments: readonly FileRecord[];
  /** Newest first. */
  readonly history: readonly HistoryEntry[];
}

/** Who is to be told about something: an address, or none known. */
export interface Recipient {
  readonly email: string | null;
}

/**
 * Where Code With Us opportunities are kept. The service is written against this rather than
 * against Prisma, so the rules about saving, publishing and deleting can be tested without a
 * database.
 */
export interface CwuOpportunityStore {
  /** Makes the opportunity, its first version and its first state, as one change. */
  create(content: CwuContent, status: CwuStatus, by: string): Promise<string>;
  find(id: string): Promise<StoredCwuOpportunity | null>;
  /** Every opportunity, newest first. */
  list(): Promise<StoredCwuOpportunity[]>;
  /** Saves a new version and records the edit in the history, as one change (R-1.4). */
  addVersion(id: string, content: CwuContent, by: string): Promise<void>;
  /** Records a change of state in the history. */
  changeStatus(id: string, status: CwuStatus, by: string, note?: string | null): Promise<void>;
  /** Removes the opportunity with its versions, history and attachments; the files stay (R-8.26). */
  remove(id: string): Promise<void>;
  /** Everyone who asked for new-opportunity notices and whose account is active (R-1.34, R-6.17). */
  newOpportunityNoticeRecipients(): Promise<Recipient[]>;
  /** Every active administrator (R-1.37). */
  activeAdministrators(): Promise<Recipient[]>;
  /** An account's address, for a confirmation to an opportunity's author. */
  recipient(accountId: string): Promise<Recipient | null>;
}

export const CWU_OPPORTUNITY_STORE = Symbol("CwuOpportunityStore");

/** How a Code With Us opportunity is answered with (decision record 0029). */
export interface CwuOpportunityAnswer {
  readonly id: string;
  readonly program: "code-with-us";
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Present only for an administrator and for the people named (R-1.29). */
  readonly createdBy?: Person | null;
  readonly updatedBy?: Person | null;
  readonly status: CwuStatus;
  readonly publishedAt: string | null;
  readonly title: string;
  readonly teaser: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  readonly reward: number;
  readonly skills: readonly string[];
  readonly description: string;
  /** Each a calendar day, YYYY-MM-DD; proposals close at 4:00 p.m. Pacific time on the deadline. */
  readonly proposalDeadline: string;
  readonly assignmentDate: string;
  readonly startDate: string;
  readonly completionDate: string | null;
  readonly submissionInfo: string;
  readonly acceptanceCriteria: string;
  readonly evaluationCriteria: string;
  readonly attachments: readonly FileRecord[];
  readonly addenda: readonly never[];
  /** Present only for the author and administrators (R-1.30). */
  readonly history?: readonly {
    readonly createdAt: string;
    readonly createdBy: Person | null;
    readonly status: CwuStatus | null;
    readonly event: OpportunityEvent | null;
    readonly note: string | null;
  }[];
}
