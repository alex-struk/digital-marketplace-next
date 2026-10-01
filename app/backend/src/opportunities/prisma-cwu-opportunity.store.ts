import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { asFileRecord } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import {
  CwuContent,
  CwuStatus,
  OpportunityEvent,
  isStatusOf,
  pacificDayOf,
  recordedInstantOf,
} from "../rules/opportunities";
import { CwuOpportunityStore, HistoryEntry, Person, Recipient, StoredCwuOpportunity } from "./cwu-opportunity";

const person = { select: { id: true, name: true } } as const;

const withEverything = {
  users: person,
  cwuOpportunityVersions: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      users: person,
      cwuOpportunityAttachments: { include: { files: true } },
    },
  },
  cwuOpportunityStatuses: {
    orderBy: { createdAt: "desc" },
    include: { users: person },
  },
} satisfies Prisma.cwuOpportunitiesInclude;

type Row = Prisma.cwuOpportunitiesGetPayload<{ include: typeof withEverything }>;

const EVENTS: readonly OpportunityEvent[] = ["EDITED", "ADDENDUM_ADDED", "NOTE_ADDED"];

/**
 * Code With Us opportunities as the kept schema holds them: one row for the opportunity, one row
 * for each version of its content (the newest is current, the earlier ones are kept, R-1.4), one
 * row for each change of state or event in its history, and the files each version carries.
 * Dates are kept as the instant 4:00 p.m. Pacific time on the day chosen (R-1.14).
 */
@Injectable()
export class PrismaCwuOpportunityStore implements CwuOpportunityStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(content: CwuContent, status: CwuStatus, by: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.cwuOpportunities.create({ data: { id, createdAt: now, createdBy: by } });
      await this.writeVersion(tx, id, content, by, now);
      await tx.cwuOpportunityStatuses.create({
        data: { id: randomUUID(), createdAt: now, createdBy: by, opportunity: id, status, event: null, note: null },
      });
    });
    return id;
  }

  async find(id: string): Promise<StoredCwuOpportunity | null> {
    const row = await this.prisma.cwuOpportunities.findUnique({ where: { id }, include: withEverything });
    return row ? asOpportunity(row) : null;
  }

  async list(): Promise<StoredCwuOpportunity[]> {
    const rows = await this.prisma.cwuOpportunities.findMany({ include: withEverything, orderBy: { createdAt: "desc" } });
    return rows.map(asOpportunity).filter((row): row is StoredCwuOpportunity => row !== null);
  }

  async addVersion(id: string, content: CwuContent, by: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.writeVersion(tx, id, content, by, now);
      await tx.cwuOpportunityStatuses.create({
        data: { id: randomUUID(), createdAt: now, createdBy: by, opportunity: id, status: null, event: "EDITED", note: null },
      });
    });
  }

  async changeStatus(id: string, status: CwuStatus, by: string, note: string | null = null): Promise<void> {
    await this.prisma.cwuOpportunityStatuses.create({
      data: { id: randomUUID(), createdAt: new Date(), createdBy: by, opportunity: id, status, event: null, note },
    });
  }

  async remove(id: string): Promise<void> {
    // Versions, history and attachments go with it; the stored files themselves stay (R-8.26).
    await this.prisma.cwuOpportunities.delete({ where: { id } });
  }

  async newOpportunityNoticeRecipients(): Promise<Recipient[]> {
    return this.prisma.users.findMany({
      where: { notificationsOn: { not: null }, status: "ACTIVE" },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async activeAdministrators(): Promise<Recipient[]> {
    return this.prisma.users.findMany({
      where: { type: "ADMIN", status: "ACTIVE" },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async recipient(accountId: string): Promise<Recipient | null> {
    const found = await this.prisma.users.findUnique({ where: { id: accountId }, select: { email: true, status: true } });
    // A deactivated account is sent nothing (R-6.17).
    return found && found.status === "ACTIVE" ? { email: found.email } : null;
  }

  private async writeVersion(
    tx: Prisma.TransactionClient,
    opportunity: string,
    content: CwuContent,
    by: string,
    at: Date,
  ): Promise<void> {
    const version = randomUUID();
    await tx.cwuOpportunityVersions.create({
      data: {
        id: version,
        createdAt: at,
        createdBy: by,
        opportunity,
        title: content.title,
        teaser: content.teaser,
        remoteOk: content.remoteOk,
        remoteDesc: content.remoteDesc,
        location: content.location,
        reward: content.reward,
        skills: [...content.skills],
        description: content.description,
        proposalDeadline: recordedInstantOf(content.proposalDeadline),
        assignmentDate: recordedInstantOf(content.assignmentDate),
        startDate: recordedInstantOf(content.startDate),
        completionDate: content.completionDate ? recordedInstantOf(content.completionDate) : null,
        submissionInfo: content.submissionInfo,
        acceptanceCriteria: content.acceptanceCriteria,
        evaluationCriteria: content.evaluationCriteria,
      },
    });
    if (content.attachments.length > 0) {
      await tx.cwuOpportunityAttachments.createMany({
        data: content.attachments.map((file) => ({ opportunityVersion: version, file })),
      });
    }
  }
}

function asPerson(user: { id: string; name: string } | null | undefined): Person | null {
  return user ? { id: user.id, name: user.name } : null;
}

function asOpportunity(row: Row): StoredCwuOpportunity | null {
  const version = row.cwuOpportunityVersions[0];
  // The history is newest first; the state is the last change of state recorded in it.
  const changes = row.cwuOpportunityStatuses.filter((entry) => isStatusOf("code-with-us", entry.status));
  const current = changes[0];
  if (!version || !current) return null;
  const firstPublished = [...changes].reverse().find((entry) => entry.status === "PUBLISHED");
  const history: HistoryEntry[] = row.cwuOpportunityStatuses.map((entry) => ({
    createdAt: entry.createdAt,
    createdBy: asPerson(entry.users),
    status: isStatusOf("code-with-us", entry.status) ? (entry.status as CwuStatus) : null,
    event: EVENTS.includes(entry.event as OpportunityEvent) ? (entry.event as OpportunityEvent) : null,
    note: entry.note,
  }));
  return {
    id: row.id,
    createdAt: row.createdAt,
    createdBy: asPerson(row.users),
    updatedAt: version.createdAt,
    updatedBy: asPerson(version.users),
    status: current.status as CwuStatus,
    publishedAt: firstPublished?.createdAt ?? null,
    content: {
      title: version.title,
      teaser: version.teaser,
      remoteOk: version.remoteOk,
      remoteDesc: version.remoteDesc,
      location: version.location,
      reward: version.reward,
      skills: version.skills,
      description: version.description,
      proposalDeadline: pacificDayOf(version.proposalDeadline),
      assignmentDate: pacificDayOf(version.assignmentDate),
      startDate: pacificDayOf(version.startDate),
      completionDate: version.completionDate ? pacificDayOf(version.completionDate) : null,
      submissionInfo: version.submissionInfo,
      acceptanceCriteria: version.acceptanceCriteria,
      evaluationCriteria: version.evaluationCriteria,
      attachments: version.cwuOpportunityAttachments.map((attachment) => attachment.file),
    },
    attachments: version.cwuOpportunityAttachments.map((attachment) =>
      asFileRecord({
        id: attachment.files.id,
        name: attachment.files.name,
        createdAt: attachment.files.createdAt.toISOString(),
        createdBy: attachment.files.createdBy,
        fileBlob: attachment.files.fileBlob,
      }),
    ),
    history,
  };
}
