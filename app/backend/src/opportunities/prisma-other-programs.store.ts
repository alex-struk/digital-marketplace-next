import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OpportunityStatus, isStatusOf, pacificDayOf, recordedInstantOf } from "../rules/opportunities";
import { OtherProgramDraft } from "../rules/other-program-drafts";
import { Person } from "./cwu-opportunity";
import { OtherProgram, OtherProgramsStore, StoredSummary } from "./other-programs";

const person = { select: { id: true, name: true } } as const;

const latestVersion = {
  orderBy: { createdAt: "desc" },
  take: 1,
  include: { users: person },
} as const;

const history = { where: { status: { not: null } }, orderBy: { createdAt: "desc" }, select: { status: true, createdAt: true } } as const;

interface Row {
  id: string;
  createdAt: Date;
  users: Person | null;
  statuses: { status: string | null; createdAt: Date }[];
  version:
    | {
        createdAt: Date;
        users: Person | null;
        title: string;
        teaser: string;
        location: string;
        remoteOk: boolean;
        remoteDesc: string;
        description: string;
        proposalDeadline: Date;
        assignmentDate: Date;
        startDate: Date | null;
        completionDate: Date | null;
        budget: number;
      }
    | undefined;
}

const swuInclude = { users: person, swuOpportunityVersions: latestVersion, swuOpportunityStatuses: history } as const;
const twuInclude = { users: person, twuOpportunityVersions: latestVersion, twuOpportunityStatuses: history } as const;

/**
 * Sprint With Us and Team With Us opportunities, read for the list and drafted from their interim
 * create screens: the opportunity, its newest version and the changes of state in its history.
 * Their full content and their other changes are slice 10's.
 */
@Injectable()
export class PrismaOtherProgramsStore implements OtherProgramsStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(program: OtherProgram): Promise<StoredSummary[]> {
    const rows: Row[] =
      program === "sprint-with-us"
        ? (await this.prisma.swuOpportunities.findMany({ include: swuInclude, orderBy: { createdAt: "desc" } })).map(swuRow)
        : (await this.prisma.twuOpportunities.findMany({ include: twuInclude, orderBy: { createdAt: "desc" } })).map(twuRow);
    return rows.map((row) => asSummary(program, row)).filter((row): row is StoredSummary => row !== null);
  }

  async find(program: OtherProgram, id: string): Promise<StoredSummary | null> {
    if (program === "sprint-with-us") {
      const row = await this.prisma.swuOpportunities.findUnique({ where: { id }, include: swuInclude });
      return row ? asSummary(program, swuRow(row)) : null;
    }
    const row = await this.prisma.twuOpportunities.findUnique({ where: { id }, include: twuInclude });
    return row ? asSummary(program, twuRow(row)) : null;
  }

  async createDraft(program: OtherProgram, draft: OtherProgramDraft, by: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    const common = {
      id: randomUUID(),
      createdAt: now,
      createdBy: by,
      opportunity: id,
      title: draft.title,
      teaser: draft.teaser,
      remoteOk: draft.remoteOk,
      remoteDesc: draft.remoteDesc,
      location: draft.location,
      description: draft.description,
      proposalDeadline: recordedInstantOf(draft.proposalDeadline),
      assignmentDate: recordedInstantOf(draft.assignmentDate),
    };
    const status = { id: randomUUID(), createdAt: now, createdBy: by, opportunity: id, status: "DRAFT", event: null, note: null };
    await this.prisma.$transaction(async (tx) => {
      if (program === "sprint-with-us") {
        await tx.swuOpportunities.create({ data: { id, createdAt: now, createdBy: by } });
        // The weights are the program's to set with its questions and phases (slice 10); a draft
        // holds none.
        await tx.swuOpportunityVersions.create({
          data: { ...common, totalMaxBudget: draft.budget, questionsWeight: 0, codeChallengeWeight: 0, scenarioWeight: 0, priceWeight: 0 },
        });
        await tx.swuOpportunityStatuses.create({ data: status });
      } else {
        await tx.twuOpportunities.create({ data: { id, createdAt: now, createdBy: by } });
        await tx.twuOpportunityVersions.create({
          data: {
            ...common,
            maxBudget: draft.budget,
            startDate: recordedInstantOf(draft.startDate ?? draft.assignmentDate),
            completionDate: draft.completionDate ? recordedInstantOf(draft.completionDate) : null,
            questionsWeight: 0,
            challengeWeight: 0,
            priceWeight: 0,
          },
        });
        await tx.twuOpportunityStatuses.create({ data: status });
      }
    });
    return id;
  }
}

type SwuRecord = {
  id: string;
  createdAt: Date;
  users: Person | null;
  swuOpportunityStatuses: { status: string | null; createdAt: Date }[];
  swuOpportunityVersions: (Omit<NonNullable<Row["version"]>, "budget" | "startDate" | "completionDate"> & { totalMaxBudget: number })[];
};

type TwuRecord = {
  id: string;
  createdAt: Date;
  users: Person | null;
  twuOpportunityStatuses: { status: string | null; createdAt: Date }[];
  twuOpportunityVersions: (Omit<NonNullable<Row["version"]>, "budget"> & { maxBudget: number })[];
};

function swuRow(row: SwuRecord): Row {
  const version = row.swuOpportunityVersions[0];
  return {
    id: row.id,
    createdAt: row.createdAt,
    users: row.users,
    statuses: row.swuOpportunityStatuses,
    version: version && { ...version, budget: version.totalMaxBudget, startDate: null, completionDate: null },
  };
}

function twuRow(row: TwuRecord): Row {
  const version = row.twuOpportunityVersions[0];
  return {
    id: row.id,
    createdAt: row.createdAt,
    users: row.users,
    statuses: row.twuOpportunityStatuses,
    version: version && { ...version, budget: version.maxBudget },
  };
}

function asSummary(program: OtherProgram, row: Row): StoredSummary | null {
  const current = row.statuses[0];
  const { version } = row;
  if (!version || !current || !isStatusOf(program, current.status)) return null;
  const firstPublished = [...row.statuses].reverse().find((entry) => entry.status === "PUBLISHED");
  return {
    id: row.id,
    program,
    createdAt: row.createdAt,
    createdBy: row.users ? { id: row.users.id, name: row.users.name } : null,
    updatedAt: version.createdAt,
    updatedBy: version.users ? { id: version.users.id, name: version.users.name } : null,
    status: current.status as OpportunityStatus,
    publishedAt: firstPublished?.createdAt ?? null,
    title: version.title,
    teaser: version.teaser,
    location: version.location,
    remoteOk: version.remoteOk,
    remoteDesc: version.remoteDesc,
    description: version.description,
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    assignmentDate: pacificDayOf(version.assignmentDate),
    startDate: version.startDate ? pacificDayOf(version.startDate) : null,
    completionDate: version.completionDate ? pacificDayOf(version.completionDate) : null,
    budget: version.budget,
  };
}
