import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { FileRecord, asFileRecord } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { OpportunityStatus, isStatusOf, pacificDayOf } from "../rules/opportunities";
import { qualifiesForSprintWithUs, qualifiesForTeamWithUs } from "../rules/organizations";
import { SWU_PHASES, SwuPhase } from "../rules/other-program-drafts";
import {
  MemberStanding,
  OrganizationForProposal,
  ResourceForProposal,
  TeamProgram,
  TeamProposalStatus,
  isTeamProposalStatus,
} from "../rules/team-proposals";
import { Person, ProposalOrganization } from "./cwu-proposal";
import {
  StoredPhaseTeam,
  StoredTeamProposal,
  TeamHistoryEntry,
  TeamOpportunityOfProposal,
  TeamProposalInput,
  TeamProposalStore,
} from "./team-proposal";

const person = { select: { id: true, name: true } } as const;
const latestStatus = { where: { status: { not: null } }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } as const;
const questions = { orderBy: { order: "asc" }, select: { order: true, question: true, wordLimit: true } } as const;
const organization = { select: { id: true, legalName: true, active: true } } as const;
const history = { orderBy: { createdAt: "desc" }, include: { users: person } } as const;

const swuOpportunityParts = {
  select: {
    id: true,
    createdBy: true,
    swuOpportunityStatuses: latestStatus,
    swuOpportunityVersions: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: {
        title: true,
        proposalDeadline: true,
        totalMaxBudget: true,
        swuTeamQuestions: questions,
        swuOpportunityPhases: { select: { phase: true, maxBudget: true, swuPhaseCapabilities: { select: { capability: true } } } },
      },
    },
  },
} as const satisfies Prisma.swuOpportunitiesDefaultArgs;

const twuOpportunityParts = {
  select: {
    id: true,
    createdBy: true,
    twuOpportunityStatuses: latestStatus,
    twuOpportunityVersions: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: {
        title: true,
        proposalDeadline: true,
        maxBudget: true,
        startDate: true,
        completionDate: true,
        twuResourceQuestions: questions,
        twuResources: { orderBy: { order: "asc" }, select: { id: true, targetAllocation: true, serviceAreas: { select: { serviceArea: true } } } },
      },
    },
  },
} as const satisfies Prisma.twuOpportunitiesDefaultArgs;

const swuEverything = {
  users_swuProposals_createdByTousers: person,
  users_swuProposals_updatedByTousers: person,
  organizations: organization,
  swuProposalStatuses: history,
  swuProposalPhases: { include: { swuProposalTeamMembers: { include: { users: person } } } },
  swuProposalReferences: { orderBy: { order: "asc" } },
  swuTeamQuestionResponses: { orderBy: { order: "asc" } },
  swuProposalAttachments: { include: { files: true } },
  swuOpportunities: swuOpportunityParts,
} as const satisfies Prisma.swuProposalsInclude;

const twuEverything = {
  users_twuProposals_createdByTousers: person,
  users_twuProposals_updatedByTousers: person,
  organizations: organization,
  twuProposalStatuses: history,
  twuProposalMember: { include: { users: person, twuResources: { select: { id: true, targetAllocation: true, serviceAreas: { select: { serviceArea: true } } } } } },
  twuResourceQuestionResponses: { orderBy: { order: "asc" } },
  twuProposalAttachments: { include: { files: true } },
  twuOpportunities: twuOpportunityParts,
} as const satisfies Prisma.twuProposalsInclude;

type SwuRow = Prisma.swuProposalsGetPayload<{ include: typeof swuEverything }>;
type TwuRow = Prisma.twuProposalsGetPayload<{ include: typeof twuEverything }>;
type SwuOpportunityRow = Prisma.swuOpportunitiesGetPayload<typeof swuOpportunityParts>;
type TwuOpportunityRow = Prisma.twuOpportunitiesGetPayload<typeof twuOpportunityParts>;

const isPhase = (value: string): value is SwuPhase => (SWU_PHASES as readonly string[]).includes(value);

/**
 * Sprint With Us and Team With Us proposals as the kept schema holds them: for Sprint With Us the
 * proposal, a row for each phase it gives a team to, a row for each person on that phase's team
 * (scrum master or not), its references and its answers; for Team With Us the proposal, a row for
 * each person named against a resource at an hourly rate, and its answers; for both, its history and
 * a pair for each file attached to it. Its state is the last change of state recorded.
 */
@Injectable()
export class PrismaTeamProposalStore implements TeamProposalStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(opportunityId: string, input: TeamProposalInput, status: "DRAFT" | "SUBMITTED", by: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    const organizationId = input.content.organization === "" ? null : input.content.organization;
    const proposal = { id, createdAt: now, createdBy: by, updatedAt: now, updatedBy: by, opportunity: opportunityId, organization: organizationId };
    const statusRow = { id: randomUUID(), createdAt: now, createdBy: by, proposal: id, status, event: null, note: null };
    await this.prisma.$transaction(async (tx) => {
      if (input.program === "sprint-with-us") {
        await tx.swuProposals.create({ data: proposal });
        await tx.swuProposalStatuses.create({ data: statusRow });
      } else {
        await tx.twuProposals.create({ data: proposal });
        await tx.twuProposalStatuses.create({ data: statusRow });
      }
      await writeContent(tx, id, input);
    });
    return id;
  }

  async find(program: TeamProgram, id: string): Promise<StoredTeamProposal | null> {
    if (program === "sprint-with-us") {
      const row = await this.prisma.swuProposals.findUnique({ where: { id }, include: swuEverything });
      return row ? swuProposalOf(row) : null;
    }
    const row = await this.prisma.twuProposals.findUnique({ where: { id }, include: twuEverything });
    return row ? twuProposalOf(row) : null;
  }

  async forOpportunity(program: TeamProgram, opportunityId: string): Promise<StoredTeamProposal[]> {
    return this.findMany(program, { opportunity: opportunityId }, "asc");
  }

  async forVendor(program: TeamProgram, accountId: string, organizationIds: readonly string[]): Promise<StoredTeamProposal[]> {
    const where = {
      OR: [{ createdBy: accountId }, ...(organizationIds.length > 0 ? [{ organization: { in: [...organizationIds] } }] : [])],
    };
    return this.findMany(program, where, "desc");
  }

  async update(id: string, input: TeamProposalInput, by: string): Promise<void> {
    const now = new Date();
    const data = { updatedAt: now, updatedBy: by, organization: input.content.organization === "" ? null : input.content.organization };
    await this.prisma.$transaction(async (tx) => {
      if (input.program === "sprint-with-us") {
        await tx.swuProposals.update({ where: { id }, data });
        // A phase's team goes with the phase.
        await tx.swuProposalPhases.deleteMany({ where: { proposal: id } });
        await tx.swuProposalReferences.deleteMany({ where: { proposal: id } });
        await tx.swuTeamQuestionResponses.deleteMany({ where: { proposal: id } });
        await tx.swuProposalAttachments.deleteMany({ where: { proposal: id } });
      } else {
        await tx.twuProposals.update({ where: { id }, data });
        await tx.twuProposalMember.deleteMany({ where: { proposal: id } });
        await tx.twuResourceQuestionResponses.deleteMany({ where: { proposal: id } });
        await tx.twuProposalAttachments.deleteMany({ where: { proposal: id } });
      }
      await writeContent(tx, id, input);
    });
  }

  async changeStatus(program: TeamProgram, id: string, status: TeamProposalStatus, by: string, note: string | null = null): Promise<void> {
    const now = new Date();
    const row = { id: randomUUID(), createdAt: now, createdBy: by, proposal: id, status, event: null, note };
    const touched = { where: { id }, data: { updatedAt: now, updatedBy: by } };
    if (program === "sprint-with-us") {
      await this.prisma.$transaction([this.prisma.swuProposalStatuses.create({ data: row }), this.prisma.swuProposals.update(touched)]);
    } else {
      await this.prisma.$transaction([this.prisma.twuProposalStatuses.create({ data: row }), this.prisma.twuProposals.update(touched)]);
    }
  }

  async remove(program: TeamProgram, id: string): Promise<void> {
    // Everything the proposal holds goes with it; the stored files stay (R-8.31).
    if (program === "sprint-with-us") await this.prisma.swuProposals.deleteMany({ where: { id } });
    else await this.prisma.twuProposals.deleteMany({ where: { id } });
  }

  async opportunity(program: TeamProgram, id: string): Promise<TeamOpportunityOfProposal | null> {
    if (program === "sprint-with-us") {
      const row = await this.prisma.swuOpportunities.findUnique({ where: { id }, ...swuOpportunityParts });
      return row ? swuOpportunityOf(row) : null;
    }
    const row = await this.prisma.twuOpportunities.findUnique({ where: { id }, ...twuOpportunityParts });
    return row ? twuOpportunityOf(row) : null;
  }

  /** The organization with whether it qualifies for each program now (R-2.16, R-2.17). */
  async organization(id: string): Promise<(OrganizationForProposal & ProposalOrganization) | null> {
    const row = await this.prisma.organizations.findUnique({
      where: { id },
      select: {
        id: true,
        legalName: true,
        active: true,
        acceptedSWUTerms: true,
        acceptedTWUTerms: true,
        affiliations: { where: { membershipStatus: "ACTIVE" }, select: { users: { select: { capabilities: true } } } },
        twuOrganizationServiceAreas: { select: { serviceAreas: { select: { serviceArea: true } } } },
      },
    });
    if (!row) return null;
    const serviceAreas = row.twuOrganizationServiceAreas.map((entry) => entry.serviceAreas.serviceArea);
    const acceptedSWU = row.acceptedSWUTerms?.toISOString() ?? null;
    const acceptedTWU = row.acceptedTWUTerms?.toISOString() ?? null;
    return {
      id: row.id,
      legalName: row.legalName,
      active: row.active,
      swuQualified: qualifiesForSprintWithUs(row.affiliations.map((entry) => entry.users.capabilities), acceptedSWU),
      twuQualified: qualifiesForTeamWithUs(serviceAreas.length, acceptedTWU),
      serviceAreas,
    };
  }

  async members(organizationId: string | null, accountIds: readonly string[]): Promise<MemberStanding[]> {
    const rows = await this.prisma.users.findMany({
      where: { id: { in: [...accountIds] } },
      select: {
        id: true,
        name: true,
        capabilities: true,
        affiliations: { where: { organization: organizationId ?? undefined }, select: { membershipStatus: true, organization: true } },
      },
    });
    return rows.map((row) => {
      // With no organization named, nobody is a member of it.
      const statuses = organizationId ? row.affiliations.map((entry) => entry.membershipStatus) : [];
      const membershipStatus = statuses.includes("ACTIVE") ? "ACTIVE" : statuses.includes("PENDING") ? "PENDING" : statuses.length > 0 ? "INACTIVE" : null;
      return { id: row.id, name: row.name, membershipStatus, capabilities: row.capabilities };
    });
  }

  async resources(ids: readonly string[]): Promise<ResourceForProposal[]> {
    const valid = ids.filter((id) => /^[0-9a-f-]{36}$/.test(id));
    if (valid.length === 0) return [];
    const rows = await this.prisma.twuResources.findMany({
      where: { id: { in: valid } },
      select: { id: true, targetAllocation: true, serviceAreas: { select: { serviceArea: true } } },
    });
    return rows.map(resourceOf);
  }

  async managedOrganizations(accountId: string): Promise<string[]> {
    const rows = await this.prisma.affiliations.findMany({
      where: { user: accountId, membershipStatus: "ACTIVE", membershipType: { in: ["OWNER", "ADMIN"] } },
      select: { organization: true },
    });
    return [...new Set(rows.map((row) => row.organization))];
  }

  private async findMany(
    program: TeamProgram,
    where: Prisma.swuProposalsWhereInput & Prisma.twuProposalsWhereInput,
    order: "asc" | "desc",
  ): Promise<StoredTeamProposal[]> {
    const found =
      program === "sprint-with-us"
        ? (await this.prisma.swuProposals.findMany({ where, include: swuEverything, orderBy: { updatedAt: order } })).map(swuProposalOf)
        : (await this.prisma.twuProposals.findMany({ where, include: twuEverything, orderBy: { updatedAt: order } })).map(twuProposalOf);
    return found.filter((proposal): proposal is StoredTeamProposal => proposal !== null);
  }
}

/** The team, answers, references and attachments of a proposal, written afresh. */
async function writeContent(tx: Prisma.TransactionClient, proposal: string, input: TeamProposalInput): Promise<void> {
  const attachments = [...new Set(input.content.attachments)].map((file) => ({ proposal, file }));
  const responses = dedupedResponses(input.content.responses).map((response) => ({ proposal, order: response.order, response: response.response }));
  if (input.program === "sprint-with-us") {
    const { content } = input;
    for (const phase of SWU_PHASES) {
      const team = content.phases[phase];
      if (!team) continue;
      const phaseId = randomUUID();
      await tx.swuProposalPhases.create({ data: { id: phaseId, proposal, phase, proposedCost: Math.max(team.proposedCost ?? 0, 0) } });
      if (team.members.length > 0) {
        await tx.swuProposalTeamMembers.createMany({
          data: team.members.map((member) => ({ member: member.member, phase: phaseId, scrumMaster: member.scrumMaster })),
        });
      }
    }
    if (content.references.length > 0) {
      await tx.swuProposalReferences.createMany({ data: content.references.map((reference, order) => ({ proposal, order, ...reference })) });
    }
    if (responses.length > 0) await tx.swuTeamQuestionResponses.createMany({ data: responses });
    if (attachments.length > 0) await tx.swuProposalAttachments.createMany({ data: attachments });
    return;
  }
  const { content } = input;
  if (content.team.length > 0) {
    await tx.twuProposalMember.createMany({
      data: content.team.map((member) => ({ proposal, member: member.member, resource: member.resource, hourlyRate: Math.max(member.hourlyRate ?? 0, 0) })),
    });
  }
  if (responses.length > 0) await tx.twuResourceQuestionResponses.createMany({ data: responses });
  if (attachments.length > 0) await tx.twuProposalAttachments.createMany({ data: attachments });
}

/** One answer per question order, the last given for it, as the kept schema keys them. */
function dedupedResponses<T extends { readonly order: number }>(responses: readonly T[]): T[] {
  return [...new Map(responses.map((response) => [response.order, response])).values()];
}

function resourceOf(row: { id: string; targetAllocation: number; serviceAreas: { serviceArea: string } }): ResourceForProposal {
  return { id: row.id, serviceArea: row.serviceAreas.serviceArea, targetAllocation: row.targetAllocation };
}

function attachmentOf(row: { files: { id: string; name: string; createdAt: Date; createdBy: string | null; fileBlob: string } }): FileRecord {
  return asFileRecord({ ...row.files, createdAt: row.files.createdAt.toISOString() });
}

function swuOpportunityOf(row: SwuOpportunityRow): TeamOpportunityOfProposal | null {
  const version = row.swuOpportunityVersions[0];
  const status = row.swuOpportunityStatuses[0]?.status;
  if (!version || !isStatusOf("sprint-with-us", status)) return null;
  const questionsOf = version.swuTeamQuestions;
  return {
    program: "sprint-with-us",
    id: row.id,
    title: version.title,
    status: status as OpportunityStatus,
    createdBy: row.createdBy,
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    budget: version.totalMaxBudget,
    questions: questionsOf,
    swu: {
      totalMaxBudget: version.totalMaxBudget,
      phases: version.swuOpportunityPhases
        .filter((phase): phase is typeof phase & { phase: SwuPhase } => isPhase(phase.phase))
        .sort((a, b) => SWU_PHASES.indexOf(a.phase) - SWU_PHASES.indexOf(b.phase))
        .map((phase) => ({
          phase: phase.phase,
          maxBudget: phase.maxBudget,
          requiredCapabilities: phase.swuPhaseCapabilities.map((capability) => capability.capability),
        })),
      questions: questionsOf,
    },
    twu: null,
  };
}

function twuOpportunityOf(row: TwuOpportunityRow): TeamOpportunityOfProposal | null {
  const version = row.twuOpportunityVersions[0];
  const status = row.twuOpportunityStatuses[0]?.status;
  if (!version || !isStatusOf("team-with-us", status)) return null;
  return {
    program: "team-with-us",
    id: row.id,
    title: version.title,
    status: status as OpportunityStatus,
    createdBy: row.createdBy,
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    budget: version.maxBudget,
    questions: version.twuResourceQuestions,
    swu: null,
    twu: {
      maxBudget: version.maxBudget,
      startDate: pacificDayOf(version.startDate),
      completionDate: version.completionDate ? pacificDayOf(version.completionDate) : null,
      resources: version.twuResources.map(resourceOf),
      questions: version.twuResourceQuestions,
    },
  };
}

function historyOf(rows: readonly { createdAt: Date; users: Person | null; status: string | null; event: string | null; note: string | null }[]): TeamHistoryEntry[] {
  return rows.map((entry) => ({ createdAt: entry.createdAt, createdBy: entry.users, status: entry.status, event: entry.event, note: entry.note }));
}

function stateOf(program: TeamProgram, rows: readonly { status: string | null; createdAt: Date }[]) {
  const states = rows.filter((entry) => isTeamProposalStatus(program, entry.status));
  const status = states[0]?.status;
  const submitted = states.find((entry) => entry.status === "SUBMITTED");
  return { status: isTeamProposalStatus(program, status) ? status : null, submittedAt: submitted?.createdAt ?? null };
}

function swuProposalOf(row: SwuRow): StoredTeamProposal | null {
  const opportunity = swuOpportunityOf(row.swuOpportunities);
  const { status, submittedAt } = stateOf("sprint-with-us", row.swuProposalStatuses);
  if (!opportunity || !status) return null;
  const phases: Partial<Record<SwuPhase, StoredPhaseTeam>> = {};
  for (const phase of row.swuProposalPhases) {
    if (!isPhase(phase.phase)) continue;
    phases[phase.phase] = {
      members: phase.swuProposalTeamMembers
        .map((member) => ({ member: member.users, scrumMaster: member.scrumMaster }))
        .sort((a, b) => a.member.name.localeCompare(b.member.name, "en-CA")),
      proposedCost: phase.proposedCost,
    };
  }
  return {
    program: "sprint-with-us",
    id: row.id,
    createdAt: row.createdAt,
    createdBy: row.users_swuProposals_createdByTousers,
    updatedAt: row.updatedAt,
    updatedBy: row.users_swuProposals_updatedByTousers,
    status,
    submittedAt,
    organization: row.organizations,
    phases,
    references: row.swuProposalReferences.map((reference) => ({
      name: reference.name,
      company: reference.company,
      phone: reference.phone,
      email: reference.email,
    })),
    team: [],
    responses: row.swuTeamQuestionResponses.map((response) => ({ order: response.order, response: response.response })),
    attachments: row.swuProposalAttachments.map(attachmentOf).sort((a, b) => a.name.localeCompare(b.name)),
    anonymousProponentName: row.anonymousProponentName,
    history: historyOf(row.swuProposalStatuses),
    opportunity,
  };
}

function twuProposalOf(row: TwuRow): StoredTeamProposal | null {
  const opportunity = twuOpportunityOf(row.twuOpportunities);
  const { status, submittedAt } = stateOf("team-with-us", row.twuProposalStatuses);
  if (!opportunity || !status) return null;
  const order = new Map((opportunity.twu?.resources ?? []).map((resource, index) => [resource.id, index]));
  return {
    program: "team-with-us",
    id: row.id,
    createdAt: row.createdAt,
    createdBy: row.users_twuProposals_createdByTousers,
    updatedAt: row.updatedAt,
    updatedBy: row.users_twuProposals_updatedByTousers,
    status,
    submittedAt,
    organization: row.organizations,
    phases: {},
    references: [],
    team: row.twuProposalMember
      .map((member) => ({ member: member.users, resource: resourceOf(member.twuResources), resourceId: member.resource, hourlyRate: member.hourlyRate }))
      .sort((a, b) => (order.get(a.resourceId) ?? 99) - (order.get(b.resourceId) ?? 99) || a.member.name.localeCompare(b.member.name, "en-CA")),
    responses: row.twuResourceQuestionResponses.map((response) => ({ order: response.order, response: response.response })),
    attachments: row.twuProposalAttachments.map(attachmentOf).sort((a, b) => a.name.localeCompare(b.name)),
    anonymousProponentName: row.anonymousProponentName,
    history: historyOf(row.twuProposalStatuses),
    opportunity,
  };
}
