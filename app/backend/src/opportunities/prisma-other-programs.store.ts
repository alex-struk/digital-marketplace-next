import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OpportunityStatus, isStatusOf, pacificDayOf } from "../rules/opportunities";
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
        proposalDeadline: Date;
        budget: number;
      }
    | undefined;
}

/**
 * Sprint With Us and Team With Us opportunities, read for the list: the opportunity, its newest
 * version and the changes of state in its history. Their own screens and changes are slice 10's.
 */
@Injectable()
export class PrismaOtherProgramsStore implements OtherProgramsStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(program: OtherProgram): Promise<StoredSummary[]> {
    const rows: Row[] =
      program === "sprint-with-us"
        ? (
            await this.prisma.swuOpportunities.findMany({
              include: { users: person, swuOpportunityVersions: latestVersion, swuOpportunityStatuses: history },
              orderBy: { createdAt: "desc" },
            })
          ).map((row) => {
            const version = row.swuOpportunityVersions[0];
            return {
              id: row.id,
              createdAt: row.createdAt,
              users: row.users,
              statuses: row.swuOpportunityStatuses,
              version: version && { ...version, budget: version.totalMaxBudget },
            };
          })
        : (
            await this.prisma.twuOpportunities.findMany({
              include: { users: person, twuOpportunityVersions: latestVersion, twuOpportunityStatuses: history },
              orderBy: { createdAt: "desc" },
            })
          ).map((row) => {
            const version = row.twuOpportunityVersions[0];
            return {
              id: row.id,
              createdAt: row.createdAt,
              users: row.users,
              statuses: row.twuOpportunityStatuses,
              version: version && { ...version, budget: version.maxBudget },
            };
          });
    return rows.map((row) => asSummary(program, row)).filter((row): row is StoredSummary => row !== null);
  }
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
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    budget: version.budget,
  };
}
