import { FileRecord } from "../files/file";
import { CalendarDay, CwuStatus } from "../rules/opportunities";
import { CwuProposalInput, CwuProposalStatus, IndividualProponent } from "../rules/proposals";

/** A person named against a proposal: who wrote it, who last changed it, who moved it on. */
export interface Person {
  readonly id: string;
  readonly name: string;
}

/** The organization a proposal is put forward for, as it stands now. */
export interface ProposalOrganization {
  readonly id: string;
  readonly legalName: string;
  readonly active: boolean;
}

export type StoredProponent =
  | { readonly tag: "individual"; readonly value: IndividualProponent }
  | { readonly tag: "organization"; readonly value: ProposalOrganization };

/** One entry in a proposal's history: a change of state, with who made it, when and any note (R-2.35). */
export interface ProposalHistoryEntry {
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly status: CwuProposalStatus | null;
  readonly event: string | null;
  readonly note: string | null;
}

/** The opportunity a proposal answers, as far as proposals are concerned. */
export interface OpportunityOfProposal {
  readonly id: string;
  readonly title: string;
  readonly status: CwuStatus;
  readonly createdBy: string | null;
  readonly proposalDeadline: CalendarDay;
  readonly reward: number;
}

/**
 * A Code With Us proposal as the kept schema holds it: the proposal, its proponent (an individual's
 * own record, or an organization), its state (the last change recorded in its history), the files
 * attached to it, and the opportunity it answers.
 */
export interface StoredCwuProposal {
  readonly id: string;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly updatedAt: Date;
  readonly updatedBy: Person | null;
  readonly status: CwuProposalStatus;
  /** When it was last put forward, or null if it never was. */
  readonly submittedAt: Date | null;
  readonly proposalText: string;
  readonly additionalComments: string;
  readonly proponent: StoredProponent;
  readonly score: number | null;
  readonly anonymousProponentName: string;
  readonly attachments: readonly FileRecord[];
  /** Newest first. */
  readonly history: readonly ProposalHistoryEntry[];
  readonly opportunity: OpportunityOfProposal;
}

/**
 * Where Code With Us proposals are kept, and what about their opportunities, organizations and
 * memberships the rules turn on. The service is written against this rather than against Prisma,
 * so the rules about proposing can be tested without a database.
 */
export interface CwuProposalStore {
  /** Makes the proposal, its proponent, its attachments and its first state, as one change. */
  create(opportunityId: string, content: CwuProposalInput, status: CwuProposalStatus, by: string): Promise<string>;
  find(id: string): Promise<StoredCwuProposal | null>;
  /** Every proposal against an opportunity. */
  forOpportunity(opportunityId: string): Promise<StoredCwuProposal[]>;
  /** Every proposal written by an account, or put forward for one of the organizations named. */
  forVendor(accountId: string, organizationIds: readonly string[]): Promise<StoredCwuProposal[]>;
  /** Replaces the content, proponent and attachments; its state is unchanged. */
  update(id: string, content: CwuProposalInput, by: string): Promise<void>;
  /** Records a change of state in the history. */
  changeStatus(id: string, status: CwuProposalStatus, by: string, note?: string | null): Promise<void>;
  /** Removes the proposal with its history and attachments; the files stay stored (R-8.31). */
  remove(id: string): Promise<void>;
  /** The Code With Us opportunity a proposal would answer. */
  opportunity(id: string): Promise<OpportunityOfProposal | null>;
  organization(id: string): Promise<ProposalOrganization | null>;
  /** The organizations an account owns or administers, by an active membership. */
  managedOrganizations(accountId: string): Promise<string[]>;
}

export const CWU_PROPOSAL_STORE = Symbol("CwuProposalStore");

/** How a Code With Us proposal is answered with (decision record 0055). */
export interface CwuProposalAnswer {
  readonly id: string;
  readonly program: "code-with-us";
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: Person | null;
  readonly updatedBy: Person | null;
  readonly status: CwuProposalStatus;
  readonly submittedAt: string | null;
  readonly opportunity: {
    readonly id: string;
    readonly title: string;
    readonly status: CwuStatus;
    readonly proposalDeadline: CalendarDay;
    readonly reward: number;
  };
  readonly proposalText: string;
  readonly additionalComments: string;
  readonly proponent:
    | { readonly tag: "individual"; readonly value: IndividualProponent }
    | { readonly tag: "organization"; readonly value: { readonly id: string; readonly legalName: string } };
  readonly attachments: readonly FileRecord[];
  readonly anonymousProponentName: string;
  /** Present for staff, and for the vendor once the proposal is awarded or not awarded. */
  readonly score?: number | null;
  /** Newest first, to everyone who may read the proposal (R-2.9, R-2.35). */
  readonly history: readonly {
    readonly createdAt: string;
    readonly createdBy: Person | null;
    readonly status: CwuProposalStatus | null;
    readonly event: string | null;
    readonly note: string | null;
  }[];
}
