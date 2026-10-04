import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { DetailedRefusal } from "../common/refusals";
import { FileRecord } from "../files/file";
import { ATTACHMENT_ACCESS, AttachmentAccess } from "../opportunities/attachment-access";
import { CLOCK, Clock } from "../opportunities/cwu-opportunities.service";
import { CalendarDay, OpportunityStatus } from "../rules/opportunities";
import { SWU_PHASES, SwuPhase } from "../rules/other-program-drafts";
import {
  ALREADY_HAVE_PROPOSAL,
  CANNOT_EDIT_NOW,
  CANNOT_SUBMIT_NOW,
  CANNOT_WITHDRAW_NOW,
  NOT_ACCEPTING_PROPOSALS,
  NOT_PERMITTED_TO_CHANGE_PROPOSAL,
  NOT_PERMITTED_TO_START,
  NO_OPPORTUNITY_FOR_PROPOSAL,
  NO_PROPOSAL_THERE,
  ONLY_DRAFTS_DELETED,
  PROPOSALS_NOT_YET_VISIBLE,
  PROPOSAL_ACTION_NOT_AVAILABLE,
  ProposalStanding,
  SELECT_DIFFERENT_ORGANIZATION,
  UNKNOWN_PROPOSAL_STATE,
  hasClosedToProposals,
  hasCurrentTerms,
  isAcceptingProposals,
  mayEditInState,
  mayListOpportunityProposals,
  mayManageProposal,
  mayReadProposal,
  mayStartProposal,
  readAttachments,
} from "../rules/proposals";
import {
  MemberStanding,
  NOT_ACTIVE_MEMBER,
  ORGANIZATION_LOCKED,
  RESOURCE_NOT_FOUND,
  UNIQUE_MEMBERS,
  PHASE_KEYS,
  PHASE_TEAM_NAMED_TWICE,
  ReferenceInput,
  ResponseInput,
  SwuProposalInput,
  TEAM_PROGRAM_NAMES,
  TeamProblem,
  TeamProgram,
  TeamProposalStatus,
  TwuProposalInput,
  draftTeamProblems,
  mayWithdrawTeamProposalFrom,
  organizationIsLocked,
  phaseNamesSomeoneTwice,
  readSwuProposalInput,
  readTwuProposalInput,
  swuBodyOf,
  swuProposalProblems,
  swuTotalCost,
  teamRefusalLine,
  twuBodyOf,
  twuBudgetProblems,
  twuContractCost,
  twuProposalProblems,
} from "../rules/team-proposals";
import { Person } from "./cwu-proposal";
import { ATTACHMENT_NOT_READABLE, ProposalAsker, TaggedChange } from "./cwu-proposals.service";
import {
  StoredTeamProposal,
  TEAM_PROPOSAL_STORE,
  TeamOpportunityOfProposal,
  TeamProposalInput,
  TeamProposalStore,
} from "./team-proposal";

export const TERMS_NOT_ACCEPTED_FOR = (program: TeamProgram) =>
  `Accept the ${TEAM_PROGRAM_NAMES[program]} terms and conditions and the Digital Marketplace terms and conditions to submit a proposal.`;

/** A Sprint With Us phase's team as answered: who is on it, which of them is scrum master, and its cost. */
export interface PhaseTeamAnswer {
  readonly members: readonly { readonly member: Person; readonly scrumMaster: boolean }[];
  readonly proposedCost: number;
}

/** How a Sprint With Us or Team With Us proposal is answered with (decision record 0058). */
export interface TeamProposalAnswer {
  readonly id: string;
  readonly program: TeamProgram;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: Person | null;
  readonly updatedBy: Person | null;
  readonly status: TeamProposalStatus;
  readonly submittedAt: string | null;
  readonly opportunity: {
    readonly id: string;
    readonly title: string;
    readonly status: OpportunityStatus;
    readonly proposalDeadline: CalendarDay;
    readonly totalMaxBudget?: number;
    readonly maxBudget?: number;
  };
  readonly organization: { readonly id: string; readonly legalName: string } | null;
  readonly totalProposedCost: number | null;
  /** Sprint With Us. */
  readonly inceptionPhase?: PhaseTeamAnswer | null;
  readonly prototypePhase?: PhaseTeamAnswer | null;
  readonly implementationPhase?: PhaseTeamAnswer | null;
  readonly teamQuestionResponses?: readonly ResponseInput[];
  readonly references?: readonly (ReferenceInput & { readonly order: number })[];
  /** Team With Us. */
  readonly team?: readonly {
    readonly member: Person;
    readonly resource: { readonly id: string; readonly serviceArea: string | null; readonly targetAllocation: number | null };
    readonly hourlyRate: number;
  }[];
  readonly resourceQuestionResponses?: readonly ResponseInput[];
  readonly attachments: readonly FileRecord[];
  readonly anonymousProponentName: string;
  /** Newest first, to everyone who may read the proposal (R-2.9, R-2.35). */
  readonly history: readonly {
    readonly createdAt: string;
    readonly createdBy: Person | null;
    readonly status: string | null;
    readonly event: string | null;
    readonly note: string | null;
  }[];
}

/**
 * Sprint With Us and Team With Us proposals (decision record 0058): starting one, reading them,
 * changing, submitting, withdrawing and deleting them, by the same rules as Code With Us wherever
 * the rule is about proposals in general.
 *
 * Only a vendor who has accepted the terms at some point starts one (R-2.1), as a draft or a
 * submission and nothing else (R-2.7), one per vendor and one per organization on each opportunity,
 * the second answered with a pointer to the first (R-2.2, R-2.11). A draft keeps whatever it holds,
 * though every file it names is checked (R-2.12, R-8.22); one put forward is judged against its
 * program (R-2.16 to R-2.21), and needs the current terms accepted (R-2.3). Team With Us rates are
 * held to the opportunity's maximum budget on every save, draft or not (R-2.10). Once put forward the
 * organization stays until the proposal is withdrawn (R-2.22). Unlike Code With Us, creating one
 * already submitted is not refused after the deadline (R-2.15); moving a draft to submitted is. A
 * vendor sees their own and their organizations' proposals and no other vendor's, history included
 * (R-2.9, R-2.24); staff see none until the opportunity has closed, and never a draft (R-1.31,
 * R-2.25).
 */
@Injectable()
export class TeamProposalsService {
  constructor(
    @Inject(TEAM_PROPOSAL_STORE) private readonly store: TeamProposalStore,
    @Inject(ATTACHMENT_ACCESS) private readonly files: AttachmentAccess,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(asker: ProposalAsker | null, program: TeamProgram, opportunityId?: string): Promise<TeamProposalAnswer[]> {
    if (!asker) throw new UnauthorizedException("Sign in to see proposals.");
    const managed = await this.managedBy(asker);
    if (asker.type === "VENDOR") {
      const mine = await this.store.forVendor(program, asker.id, managed);
      return mine
        .filter((proposal) => opportunityId === undefined || proposal.opportunity.id === opportunityId.toLowerCase())
        .filter((proposal) => this.mayRead(asker, proposal, managed))
        .map(answerFor);
    }
    if (opportunityId === undefined) return [];
    const opportunity = /^[0-9a-f-]{36}$/i.test(opportunityId) ? await this.store.opportunity(program, opportunityId.toLowerCase()) : null;
    if (!opportunity) throw new NotFoundException(NO_OPPORTUNITY_FOR_PROPOSAL);
    const closed = hasClosedToProposals(opportunity, this.clock());
    if (!mayListOpportunityProposals(asker, { createdBy: opportunity.createdBy, closed })) {
      throw new UnauthorizedException(PROPOSALS_NOT_YET_VISIBLE);
    }
    const all = await this.store.forOpportunity(program, opportunity.id);
    return all.filter((proposal) => this.mayRead(asker, proposal, managed)).map(answerFor);
  }

  async read(asker: ProposalAsker | null, program: TeamProgram, id: string): Promise<TeamProposalAnswer> {
    const { proposal } = await this.readable(asker, program, id);
    return answerFor(proposal);
  }

  /** A new proposal, as a draft or as a submission (R-2.1, R-2.7). */
  async create(asker: ProposalAsker | null, program: TeamProgram, body: unknown): Promise<TeamProposalAnswer> {
    if (!asker || !mayStartProposal(asker)) throw new UnauthorizedException(NOT_PERMITTED_TO_START);
    const given = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
    const requested = given.status ?? "DRAFT";
    if (requested !== "DRAFT" && requested !== "SUBMITTED") throw new BadRequestException([UNKNOWN_PROPOSAL_STATE]);

    const opportunityId = typeof given.opportunity === "string" ? given.opportunity.toLowerCase() : null;
    const opportunity = opportunityId && /^[0-9a-f-]{36}$/.test(opportunityId) ? await this.store.opportunity(program, opportunityId) : null;
    if (!opportunity) throw new BadRequestException([NO_OPPORTUNITY_FOR_PROPOSAL]);
    // Only a published opportunity takes proposals. Creating one already submitted is not held to
    // the deadline in these two programs (R-2.15).
    if (opportunity.status !== "PUBLISHED") throw new BadRequestException([NOT_ACCEPTING_PROPOSALS]);

    const existing = (await this.store.forOpportunity(program, opportunity.id)).find((proposal) => proposal.createdBy?.id === asker.id);
    if (existing) throw new DetailedRefusal(400, [ALREADY_HAVE_PROPOSAL], { existingProposalId: existing.id });
    if (requested === "SUBMITTED" && !hasCurrentTerms(asker)) throw new UnauthorizedException(TERMS_NOT_ACCEPTED_FOR(program));

    const input = inputFrom(program, given);
    await this.checkContent(asker, opportunity, input, requested === "SUBMITTED", null);
    const id = await this.store.create(opportunity.id, input, requested, asker.id);
    return answerFor(await this.mustFind(program, id));
  }

  /** One tagged change: an edit, a submission or a withdrawal. Evaluation's changes come later. */
  async change(asker: ProposalAsker | null, program: TeamProgram, id: string, change: TaggedChange): Promise<TeamProposalAnswer> {
    const { proposal, managed } = await this.readable(asker, program, id);
    if (!asker || !mayManageProposal(asker, this.standingOf(proposal), managesOrganization(proposal, managed))) {
      if (["edit", "submit", "withdraw"].includes(change?.tag as string)) throw new UnauthorizedException(NOT_PERMITTED_TO_CHANGE_PROPOSAL);
      throw new BadRequestException([PROPOSAL_ACTION_NOT_AVAILABLE]);
    }
    switch (change?.tag) {
      case "edit":
        await this.edit(asker, proposal, change.value);
        break;
      case "submit":
        await this.submit(asker, proposal, change.value);
        break;
      case "withdraw":
        if (!mayWithdrawTeamProposalFrom(proposal.status)) throw new BadRequestException([CANNOT_WITHDRAW_NOW]);
        await this.store.changeStatus(program, proposal.id, "WITHDRAWN", asker.id, noteFrom(change.value));
        break;
      default:
        throw new BadRequestException([PROPOSAL_ACTION_NOT_AVAILABLE]);
    }
    return answerFor(await this.mustFind(program, proposal.id));
  }

  /** Deletes a draft for good (R-2.4). */
  async remove(asker: ProposalAsker | null, program: TeamProgram, id: string): Promise<TeamProposalAnswer> {
    const { proposal, managed } = await this.readable(asker, program, id);
    if (!asker || !mayManageProposal(asker, this.standingOf(proposal), managesOrganization(proposal, managed))) {
      throw new UnauthorizedException(NOT_PERMITTED_TO_CHANGE_PROPOSAL);
    }
    if (proposal.status !== "DRAFT") throw new BadRequestException([ONLY_DRAFTS_DELETED]);
    await this.store.remove(program, proposal.id);
    return answerFor(proposal);
  }

  // ---------------------------------------------------------------------- the changes

  /**
   * New content, keeping whatever the request leaves out (surface file-attach-by-identifier). The
   * organization of a proposal put forward stays until it is withdrawn (R-2.22); a submitted one
   * stays complete.
   */
  private async edit(asker: ProposalAsker, proposal: StoredTeamProposal, value: unknown): Promise<void> {
    const accepting = isAcceptingProposals(proposal.opportunity, this.clock());
    if (!mayEditInState(proposal.status, accepting)) {
      throw new BadRequestException([proposal.status === "SUBMITTED" || proposal.status === "WITHDRAWN" ? NOT_ACCEPTING_PROPOSALS : CANNOT_EDIT_NOW]);
    }
    const input = mergedInput(proposal, value);
    const before = proposal.organization?.id ?? "";
    if (organizationIsLocked(proposal.status) && input.content.organization !== before) {
      throw new BadRequestException([teamRefusalLine({ field: "organization", message: ORGANIZATION_LOCKED })]);
    }
    await this.checkContent(asker, proposal.opportunity, input, proposal.status === "SUBMITTED", proposal.id);
    await this.store.update(proposal.id, input, asker.id);
  }

  /** A draft, or a withdrawn proposal, put forward: in time, complete, with the current terms accepted. */
  private async submit(asker: ProposalAsker, proposal: StoredTeamProposal, value: unknown): Promise<void> {
    if (proposal.status !== "DRAFT" && proposal.status !== "WITHDRAWN") throw new BadRequestException([CANNOT_SUBMIT_NOW]);
    if (!isAcceptingProposals(proposal.opportunity, this.clock())) throw new BadRequestException([NOT_ACCEPTING_PROPOSALS]);
    if (!hasCurrentTerms(asker)) throw new UnauthorizedException(TERMS_NOT_ACCEPTED_FOR(proposal.program));
    // The organization's qualification is checked again now, whatever it was when it was named (R-2.16).
    await this.checkContent(asker, proposal.opportunity, storedInput(proposal), true, proposal.id);
    await this.store.changeStatus(proposal.program, proposal.id, "SUBMITTED", asker.id, noteFrom(value));
  }

  // ---------------------------------------------------------------------- checks

  /**
   * What a proposal holds: every file it names must be one the person may read, even in a draft
   * (R-2.12, R-8.22); a Team With Us team within the opportunity's budget, always (R-2.10); an
   * organization named on no other proposal for the opportunity (R-2.11); and, put forward, the
   * program's whole set of rules.
   */
  private async checkContent(
    asker: ProposalAsker,
    opportunity: TeamOpportunityOfProposal,
    input: TeamProposalInput,
    complete: boolean,
    self: string | null,
  ): Promise<void> {
    for (const fileId of input.content.attachments) {
      if (!(await this.files.mayRead(fileId, asker))) throw new BadRequestException([ATTACHMENT_NOT_READABLE]);
    }
    const orgId = input.content.organization;
    const organization = orgId === "" ? null : await this.store.organization(orgId);
    if (orgId !== "" && !organization) throw new BadRequestException(["organization: Choose an organization that exists and is active"]);

    let problems: TeamProblem[];
    if (input.program === "sprint-with-us") {
      const content = input.content;
      const named = SWU_PHASES.flatMap((phase) => (content.phases[phase]?.members ?? []).map((member) => member.member));
      const members = await this.membersOf(orgId, named);
      problems = complete
        ? swuProposalProblems(content, opportunity.swu ?? { totalMaxBudget: 0, phases: [], questions: [] }, organization, members)
        : [
            ...unknownPeople(SWU_PHASES.flatMap((phase) => (content.phases[phase]?.members ?? []).map((member, index) => ({ key: `${PHASE_KEYS[phase]}.members`, index, id: member.member }))), members),
            ...draftTeamProblems(content.responses, "teamQuestionResponses"),
          ];
    } else {
      const content = input.content;
      const twu = opportunity.twu ?? { maxBudget: 0, startDate: null, completionDate: null, resources: [], questions: [] };
      const members = await this.membersOf(orgId, content.team.map((member) => member.member));
      const known = new Set((await this.store.resources(content.team.map((member) => member.resource))).map((resource) => resource.id));
      problems = complete
        ? twuProposalProblems(content, twu, organization, members, known)
        : [
            ...unknownPeople(content.team.map((member, index) => ({ key: `team.${index + 1}.member`, index, id: member.member })), members),
            ...content.team.flatMap((member, index) =>
              known.has(member.resource) ? [] : [{ field: `team.${index + 1}.resource`, message: RESOURCE_NOT_FOUND }],
            ),
            // The kept schema holds a Team With Us team by person, so nobody can be on it twice.
            ...content.team.flatMap((member, index) =>
              content.team.findIndex((other) => other.member === member.member) < index
                ? [{ field: `team.${index + 1}.member`, message: UNIQUE_MEMBERS }]
                : [],
            ),
            ...twuBudgetProblems(content.team, twu),
            ...draftTeamProblems(content.responses, "resourceQuestionResponses"),
          ];
    }
    if (problems.length > 0) throw new BadRequestException(problems.map(teamRefusalLine));

    if (organization) {
      const other = (await this.store.forOpportunity(opportunity.program, opportunity.id)).find(
        (proposal) => proposal.id !== self && proposal.organization?.id === organization.id,
      );
      if (other) {
        throw new DetailedRefusal(400, [`organization: ${SELECT_DIFFERENT_ORGANIZATION}`], {
          existingOrganizationProposal: { proposalId: other.id },
        });
      }
    }
    // The kept schema holds a phase's team by person, so one person twice in a phase cannot be
    // stored; the old service failed the same way, after validating it (R-2.18).
    if (input.program === "sprint-with-us" && phaseNamesSomeoneTwice(input.content)) {
      throw new ServiceUnavailableException(PHASE_TEAM_NAMED_TWICE);
    }
  }

  /** How each person named stands with the organization; somebody with no account is left out. */
  private async membersOf(organizationId: string, accountIds: readonly string[]): Promise<Map<string, MemberStanding>> {
    const ids = [...new Set(accountIds.filter((id) => /^[0-9a-f-]{36}$/.test(id)))];
    const found = ids.length === 0 ? [] : await this.store.members(organizationId === "" ? null : organizationId, ids);
    return new Map(found.map((member) => [member.id, member]));
  }

  private async readable(
    asker: ProposalAsker | null,
    program: TeamProgram,
    id: string,
  ): Promise<{ proposal: StoredTeamProposal; managed: readonly string[] }> {
    const found = /^[0-9a-f-]{36}$/i.test(id) ? await this.store.find(program, id.toLowerCase()) : null;
    const managed = asker ? await this.managedBy(asker) : [];
    if (!found || !this.mayRead(asker, found, managed)) throw new NotFoundException(NO_PROPOSAL_THERE);
    return { proposal: found, managed };
  }

  private mayRead(asker: ProposalAsker | null, proposal: StoredTeamProposal, managed: readonly string[]): boolean {
    return mayReadProposal(asker, this.standingOf(proposal), managesOrganization(proposal, managed));
  }

  private standingOf(proposal: StoredTeamProposal): ProposalStanding {
    return {
      status: proposal.status,
      createdBy: proposal.createdBy?.id ?? null,
      organization: proposal.organization?.id ?? null,
      opportunity: { createdBy: proposal.opportunity.createdBy, closed: hasClosedToProposals(proposal.opportunity, this.clock()) },
    };
  }

  private async managedBy(asker: ProposalAsker): Promise<string[]> {
    return asker.type === "VENDOR" ? this.store.managedOrganizations(asker.id) : [];
  }

  private async mustFind(program: TeamProgram, id: string): Promise<StoredTeamProposal> {
    const found = await this.store.find(program, id);
    if (!found) throw new NotFoundException(NO_PROPOSAL_THERE);
    return found;
  }
}

/**
 * A draft keeps whatever it holds (R-2.12), but a team can name only people who have an account:
 * the kept schema refers to each by their account.
 */
function unknownPeople(
  named: readonly { readonly key: string; readonly index: number; readonly id: string }[],
  members: ReadonlyMap<string, MemberStanding>,
): TeamProblem[] {
  return named.filter((entry) => !members.has(entry.id)).map((entry) => ({ field: entry.key, message: NOT_ACTIVE_MEMBER }));
}

const noteFrom = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

function managesOrganization(proposal: StoredTeamProposal, managed: readonly string[]): boolean {
  return proposal.organization !== null && managed.includes(proposal.organization.id);
}

function inputFrom(program: TeamProgram, body: unknown): TeamProposalInput {
  return program === "sprint-with-us"
    ? { program, content: readSwuProposalInput(body) }
    : { program, content: readTwuProposalInput(body) };
}

/** The proposal's content as it is stored, in the shape a request gives it. */
export function storedInput(proposal: StoredTeamProposal): TeamProposalInput {
  const organization = proposal.organization?.id ?? "";
  const attachments = proposal.attachments.map((file) => file.id);
  if (proposal.program === "sprint-with-us") {
    const phases: SwuProposalInput["phases"] = {};
    for (const phase of SWU_PHASES) {
      const team = proposal.phases[phase];
      if (team) {
        phases[phase] = {
          members: team.members.map((member) => ({ member: member.member.id, scrumMaster: member.scrumMaster })),
          proposedCost: team.proposedCost,
        };
      }
    }
    return { program: "sprint-with-us", content: { organization, phases, responses: proposal.responses, references: proposal.references, attachments } };
  }
  const content: TwuProposalInput = {
    organization,
    team: proposal.team.map((member) => ({ member: member.member.id, resource: member.resourceId, hourlyRate: member.hourlyRate })),
    responses: proposal.responses,
    attachments,
  };
  return { program: "team-with-us", content };
}

/** The stored content, overlaid with what a change names; what it leaves out stays as it was. */
export function mergedInput(proposal: StoredTeamProposal, value: unknown): TeamProposalInput {
  const stored = storedInput(proposal);
  const given = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const body = stored.program === "sprint-with-us" ? swuBodyOf(stored.content) : twuBodyOf(stored.content);
  for (const [key, entry] of Object.entries(given)) {
    if (key === "status" || key === "opportunity") continue;
    body[key] = key === "attachments" ? readAttachments(entry) : entry;
  }
  return inputFrom(proposal.program, body);
}

function phaseAnswer(team: StoredTeamProposal["phases"][SwuPhase]): PhaseTeamAnswer | null {
  if (!team) return null;
  return { members: team.members.map((member) => ({ member: member.member, scrumMaster: member.scrumMaster })), proposedCost: team.proposedCost };
}

/** A proposal as it is answered with. Scores are not answered until evaluation is built. */
export function answerFor(proposal: StoredTeamProposal): TeamProposalAnswer {
  const { opportunity } = proposal;
  const sprint = proposal.program === "sprint-with-us";
  const twu = opportunity.twu;
  const teamCost = twu
    ? twuContractCost(
        proposal.team.map((member) => ({ member: member.member.id, resource: member.resourceId, hourlyRate: member.hourlyRate })),
        { ...twu, resources: [...twu.resources, ...proposal.team.flatMap((member) => (member.resource ? [member.resource] : []))] },
      )
    : null;
  const programContent: Partial<TeamProposalAnswer> = sprint
    ? {
        ...Object.fromEntries(SWU_PHASES.map((phase) => [PHASE_KEYS[phase], phaseAnswer(proposal.phases[phase])])),
        teamQuestionResponses: proposal.responses,
        references: proposal.references.map((reference, order) => ({ ...reference, order })),
      }
    : {
        team: proposal.team.map((member) => ({
          member: member.member,
          resource: {
            id: member.resourceId,
            serviceArea: member.resource?.serviceArea ?? null,
            targetAllocation: member.resource?.targetAllocation ?? null,
          },
          hourlyRate: member.hourlyRate,
        })),
        resourceQuestionResponses: proposal.responses,
      };
  return {
    id: proposal.id,
    program: proposal.program,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    createdBy: proposal.createdBy,
    updatedBy: proposal.updatedBy,
    status: proposal.status,
    submittedAt: proposal.submittedAt?.toISOString() ?? null,
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      status: opportunity.status,
      proposalDeadline: opportunity.proposalDeadline,
      ...(sprint ? { totalMaxBudget: opportunity.budget } : { maxBudget: opportunity.budget }),
    },
    organization: proposal.organization ? { id: proposal.organization.id, legalName: proposal.organization.legalName } : null,
    totalProposedCost: sprint ? swuTotalCost(storedInput(proposal).content as SwuProposalInput) : teamCost,
    ...programContent,
    attachments: proposal.attachments,
    anonymousProponentName: proposal.anonymousProponentName,
    history: proposal.history.map((entry) => ({
      createdAt: entry.createdAt.toISOString(),
      createdBy: entry.createdBy,
      status: entry.status,
      event: entry.event,
      note: entry.note,
    })),
  };
}
