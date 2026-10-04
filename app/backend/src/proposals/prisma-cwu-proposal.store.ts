import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { asFileRecord } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { CwuStatus, isStatusOf, pacificDayOf } from "../rules/opportunities";
import { CwuProposalInput, CwuProposalStatus, IndividualProponent, isCwuProposalStatus } from "../rules/proposals";
import {
  CwuProposalStore,
  OpportunityOfProposal,
  ProposalHistoryEntry,
  ProposalOrganization,
  StoredCwuProposal,
  StoredProponent,
} from "./cwu-proposal";

const person = { select: { id: true, name: true } } as const;

const latestVersion = {
  orderBy: { createdAt: "desc" },
  take: 1,
  select: { title: true, proposalDeadline: true, reward: true },
} as const;

const latestStatus = {
  where: { status: { not: null } },
  orderBy: { createdAt: "desc" },
  take: 1,
  select: { status: true },
} as const;

const opportunityParts = {
  select: { id: true, createdBy: true, cwuOpportunityVersions: latestVersion, cwuOpportunityStatuses: latestStatus },
} as const;

const withEverything = {
  users_cwuProposals_createdByTousers: person,
  users_cwuProposals_updatedByTousers: person,
  cwuProponents: true,
  organizations: { select: { id: true, legalName: true, active: true } },
  cwuProposalAttachments: { include: { files: true } },
  cwuProposalStatuses: { orderBy: { createdAt: "desc" }, include: { users: person } },
  cwuOpportunities: opportunityParts,
} satisfies Prisma.cwuProposalsInclude;

type Row = Prisma.cwuProposalsGetPayload<{ include: typeof withEverything }>;
type OpportunityRow = Prisma.cwuOpportunitiesGetPayload<typeof opportunityParts>;

/**
 * Code With Us proposals as the kept schema holds them: one row for the proposal, one for an
 * individual proponent's details (an organization is named by its identifier instead), one row for
 * each change of state in its history, and a pair for each file attached to it
 * (`cwuProposalAttachments`). Its state is the last change of state recorded.
 */
@Injectable()
export class PrismaCwuProposalStore implements CwuProposalStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(opportunityId: string, content: CwuProposalInput, status: CwuProposalStatus, by: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const individual =
        content.proponent.tag === "individual" ? await this.writeIndividual(tx, null, content.proponent.value, by, now) : null;
      await tx.cwuProposals.create({
        data: {
          id,
          createdAt: now,
          createdBy: by,
          updatedAt: now,
          updatedBy: by,
          proposalText: content.proposalText,
          additionalComments: content.additionalComments,
          proponentIndividual: individual,
          proponentOrganization: organizationOf(content),
          opportunity: opportunityId,
        },
      });
      await this.writeAttachments(tx, id, content.attachments);
      await tx.cwuProposalStatuses.create({
        data: { id: randomUUID(), createdAt: now, createdBy: by, proposal: id, status, event: null, note: null },
      });
    });
    return id;
  }

  async find(id: string): Promise<StoredCwuProposal | null> {
    const row = await this.prisma.cwuProposals.findUnique({ where: { id }, include: withEverything });
    return row ? asProposal(row) : null;
  }

  async forOpportunity(opportunityId: string): Promise<StoredCwuProposal[]> {
    const rows = await this.prisma.cwuProposals.findMany({
      where: { opportunity: opportunityId },
      include: withEverything,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(asProposal).filter((row): row is StoredCwuProposal => row !== null);
  }

  async forVendor(accountId: string, organizationIds: readonly string[]): Promise<StoredCwuProposal[]> {
    const rows = await this.prisma.cwuProposals.findMany({
      where: {
        OR: [{ createdBy: accountId }, ...(organizationIds.length > 0 ? [{ proponentOrganization: { in: [...organizationIds] } }] : [])],
      },
      include: withEverything,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(asProposal).filter((row): row is StoredCwuProposal => row !== null);
  }

  async update(id: string, content: CwuProposalInput, by: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.cwuProposals.findUniqueOrThrow({ where: { id }, select: { proponentIndividual: true } });
      let individual: string | null = null;
      if (content.proponent.tag === "individual") {
        individual = await this.writeIndividual(tx, current.proponentIndividual, content.proponent.value, by, now);
      }
      await tx.cwuProposals.update({
        where: { id },
        data: {
          updatedAt: now,
          updatedBy: by,
          proposalText: content.proposalText,
          additionalComments: content.additionalComments,
          proponentIndividual: individual,
          proponentOrganization: organizationOf(content),
        },
      });
      // An individual's details given up for an organization are no longer anybody's.
      if (individual === null && current.proponentIndividual) {
        await tx.cwuProponents.delete({ where: { id: current.proponentIndividual } });
      }
      await tx.cwuProposalAttachments.deleteMany({ where: { proposal: id } });
      await this.writeAttachments(tx, id, content.attachments);
    });
  }

  async changeStatus(id: string, status: CwuProposalStatus, by: string, note: string | null = null): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.cwuProposalStatuses.create({
        data: { id: randomUUID(), createdAt: now, createdBy: by, proposal: id, status, event: null, note },
      }),
      this.prisma.cwuProposals.update({ where: { id }, data: { updatedAt: now, updatedBy: by } }),
    ]);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const found = await tx.cwuProposals.findUnique({ where: { id }, select: { proponentIndividual: true } });
      if (!found) return;
      // Its history and its attachment pairs go with it; the stored files stay (R-8.31).
      await tx.cwuProposals.delete({ where: { id } });
      if (found.proponentIndividual) await tx.cwuProponents.delete({ where: { id: found.proponentIndividual } });
    });
  }

  async opportunity(id: string): Promise<OpportunityOfProposal | null> {
    const row = await this.prisma.cwuOpportunities.findUnique({ where: { id }, ...opportunityParts });
    return row ? asOpportunity(row) : null;
  }

  async organization(id: string): Promise<ProposalOrganization | null> {
    return this.prisma.organizations.findUnique({ where: { id }, select: { id: true, legalName: true, active: true } });
  }

  async managedOrganizations(accountId: string): Promise<string[]> {
    const rows = await this.prisma.affiliations.findMany({
      where: { user: accountId, membershipStatus: "ACTIVE", membershipType: { in: ["OWNER", "ADMIN"] } },
      select: { organization: true },
    });
    return [...new Set(rows.map((row) => row.organization))];
  }

  /** An individual's details: the record the proposal already has, changed, or a new one. */
  private async writeIndividual(
    tx: Prisma.TransactionClient,
    existing: string | null,
    individual: IndividualProponent,
    by: string,
    at: Date,
  ): Promise<string> {
    const details = {
      updatedAt: at,
      updatedBy: by,
      legalName: individual.legalName.trim(),
      email: individual.email.trim(),
      phone: individual.phone.trim() || null,
      street1: individual.street1.trim(),
      street2: individual.street2.trim() || null,
      city: individual.city.trim(),
      region: individual.region.trim(),
      mailCode: individual.mailCode.trim(),
      country: individual.country.trim(),
    };
    if (existing) {
      await tx.cwuProponents.update({ where: { id: existing }, data: details });
      return existing;
    }
    const id = randomUUID();
    await tx.cwuProponents.create({ data: { id, createdAt: at, createdBy: by, ...details } });
    return id;
  }

  private async writeAttachments(tx: Prisma.TransactionClient, proposal: string, files: readonly string[]): Promise<void> {
    if (files.length === 0) return;
    await tx.cwuProposalAttachments.createMany({ data: files.map((file) => ({ proposal, file })) });
  }
}

function asOpportunity(row: OpportunityRow): OpportunityOfProposal | null {
  const version = row.cwuOpportunityVersions[0];
  const status = row.cwuOpportunityStatuses[0]?.status;
  if (!version || !isStatusOf("code-with-us", status)) return null;
  return {
    id: row.id,
    title: version.title,
    status: status as CwuStatus,
    createdBy: row.createdBy,
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    reward: version.reward,
  };
}

/**
 * The organization a proposal names, or none: a draft kept with "An organization" chosen but no
 * organization picked holds "" (R-2.12), which is no organization, not an identifier.
 */
export function organizationOf(content: CwuProposalInput): string | null {
  return content.proponent.tag === "organization" && content.proponent.value !== "" ? content.proponent.value : null;
}

function proponentOf(row: Row): StoredProponent {
  if (row.organizations) return { tag: "organization", value: row.organizations };
  const individual = row.cwuProponents;
  return {
    tag: "individual",
    value: {
      legalName: individual?.legalName ?? "",
      email: individual?.email ?? "",
      phone: individual?.phone ?? "",
      street1: individual?.street1 ?? "",
      street2: individual?.street2 ?? "",
      city: individual?.city ?? "",
      region: individual?.region ?? "",
      mailCode: individual?.mailCode ?? "",
      country: individual?.country ?? "",
    },
  };
}

function asProposal(row: Row): StoredCwuProposal | null {
  const opportunity = asOpportunity(row.cwuOpportunities);
  const states = row.cwuProposalStatuses.filter((entry) => isCwuProposalStatus(entry.status));
  const status = states[0]?.status;
  if (!opportunity || !isCwuProposalStatus(status)) return null;
  const history: ProposalHistoryEntry[] = row.cwuProposalStatuses.map((entry) => ({
    createdAt: entry.createdAt,
    createdBy: entry.users ? { id: entry.users.id, name: entry.users.name } : null,
    status: isCwuProposalStatus(entry.status) ? entry.status : null,
    event: entry.event,
    note: entry.note,
  }));
  const submitted = states.find((entry) => entry.status === "SUBMITTED");
  return {
    id: row.id,
    createdAt: row.createdAt,
    createdBy: row.users_cwuProposals_createdByTousers,
    updatedAt: row.updatedAt,
    updatedBy: row.users_cwuProposals_updatedByTousers,
    status,
    submittedAt: submitted?.createdAt ?? null,
    proposalText: row.proposalText,
    additionalComments: row.additionalComments,
    proponent: proponentOf(row),
    score: row.score,
    anonymousProponentName: row.anonymousProponentName,
    attachments: row.cwuProposalAttachments
      .map((attachment) => asFileRecord({ ...attachment.files, createdAt: attachment.files.createdAt.toISOString() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    history,
    opportunity,
  };
}
