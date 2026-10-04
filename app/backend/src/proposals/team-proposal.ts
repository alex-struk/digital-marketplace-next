import { FileRecord } from "../files/file";
import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import { SwuPhase } from "../rules/other-program-drafts";
import {
  MemberStanding,
  OrganizationForProposal,
  QuestionForProposal,
  ReferenceInput,
  ResourceForProposal,
  ResponseInput,
  SwuOpportunityForProposal,
  SwuProposalInput,
  TeamProgram,
  TeamProposalStatus,
  TwuOpportunityForProposal,
  TwuProposalInput,
} from "../rules/team-proposals";
import { Person, ProposalOrganization } from "./cwu-proposal";

/** The opportunity a Sprint With Us or Team With Us proposal answers, as far as proposals are concerned. */
export interface TeamOpportunityOfProposal {
  readonly program: TeamProgram;
  readonly id: string;
  readonly title: string;
  readonly status: OpportunityStatus;
  readonly createdBy: string | null;
  readonly proposalDeadline: CalendarDay;
  /** The total maximum budget (Sprint With Us) or the maximum budget (Team With Us). */
  readonly budget: number;
  readonly questions: readonly QuestionForProposal[];
  /** Sprint With Us. */
  readonly swu: SwuOpportunityForProposal | null;
  /** Team With Us. */
  readonly twu: TwuOpportunityForProposal | null;
}

/** One person on a Sprint With Us phase's team, as they stand now. */
export interface StoredPhaseMember {
  readonly member: Person;
  readonly scrumMaster: boolean;
}

export interface StoredPhaseTeam {
  readonly members: readonly StoredPhaseMember[];
  readonly proposedCost: number;
}

/** One person on a Team With Us team, with the resource they are named against. */
export interface StoredTwuMember {
  readonly member: Person;
  readonly resource: ResourceForProposal | null;
  readonly resourceId: string;
  readonly hourlyRate: number;
}

/** A change of state in a proposal's history (R-2.9, R-2.35). */
export interface TeamHistoryEntry {
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly status: string | null;
  readonly event: string | null;
  readonly note: string | null;
}

/**
 * A Sprint With Us or Team With Us proposal as the kept schema holds it: the proposal, the
 * organization it names, its state (the last change in its history), its team, its answers, its
 * references (Sprint With Us), its attachments, and the opportunity it answers.
 */
export interface StoredTeamProposal {
  readonly program: TeamProgram;
  readonly id: string;
  readonly createdAt: Date;
  readonly createdBy: Person | null;
  readonly updatedAt: Date;
  readonly updatedBy: Person | null;
  readonly status: TeamProposalStatus;
  readonly submittedAt: Date | null;
  readonly organization: ProposalOrganization | null;
  /** Sprint With Us: a team for each phase given. */
  readonly phases: Partial<Record<SwuPhase, StoredPhaseTeam>>;
  readonly references: readonly ReferenceInput[];
  /** Team With Us. */
  readonly team: readonly StoredTwuMember[];
  readonly responses: readonly ResponseInput[];
  readonly attachments: readonly FileRecord[];
  readonly anonymousProponentName: string;
  /** Newest first. */
  readonly history: readonly TeamHistoryEntry[];
  readonly opportunity: TeamOpportunityOfProposal;
}

export type TeamProposalInput =
  | { readonly program: "sprint-with-us"; readonly content: SwuProposalInput }
  | { readonly program: "team-with-us"; readonly content: TwuProposalInput };

/**
 * Where Sprint With Us and Team With Us proposals are kept, and what about their opportunities,
 * organizations, members and resources the rules turn on. The service is written against this,
 * so the rules about proposing can be tested without a database.
 */
export interface TeamProposalStore {
  create(opportunityId: string, input: TeamProposalInput, status: "DRAFT" | "SUBMITTED", by: string): Promise<string>;
  find(program: TeamProgram, id: string): Promise<StoredTeamProposal | null>;
  forOpportunity(program: TeamProgram, opportunityId: string): Promise<StoredTeamProposal[]>;
  /** Every proposal written by an account, or put forward for one of the organizations named. */
  forVendor(program: TeamProgram, accountId: string, organizationIds: readonly string[]): Promise<StoredTeamProposal[]>;
  /** Replaces the content; its state is unchanged. */
  update(id: string, input: TeamProposalInput, by: string): Promise<void>;
  changeStatus(program: TeamProgram, id: string, status: TeamProposalStatus, by: string, note?: string | null): Promise<void>;
  /** Removes the proposal with everything it holds; the files stay stored (R-8.31). */
  remove(program: TeamProgram, id: string): Promise<void>;
  opportunity(program: TeamProgram, id: string): Promise<TeamOpportunityOfProposal | null>;
  organization(id: string): Promise<(OrganizationForProposal & ProposalOrganization) | null>;
  /** How each account stands with an organization, by identifier; an account with no record is left out. */
  members(organizationId: string | null, accountIds: readonly string[]): Promise<MemberStanding[]>;
  /** The Team With Us resources held at these identifiers, in any opportunity. */
  resources(ids: readonly string[]): Promise<ResourceForProposal[]>;
  managedOrganizations(accountId: string): Promise<string[]>;
}

export const TEAM_PROPOSAL_STORE = Symbol("TeamProposalStore");
