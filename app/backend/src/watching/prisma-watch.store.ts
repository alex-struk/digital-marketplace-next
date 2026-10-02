import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { OpportunityStanding, OpportunityStatus, Program, isStatusOf } from "../rules/opportunities";
import { WatchStore } from "./watching";

type Latest = { createdBy: string | null; statuses: { status: string | null }[] } | null;

/**
 * The three programs' watcher tables (`cwuOpportunitySubscribers` and its two siblings), one row
 * per person watching an opportunity, keyed by the pair so nobody watches one twice (R-1.5).
 */
@Injectable()
export class PrismaWatchStore implements WatchStore {
  constructor(private readonly prisma: PrismaService) {}

  async standing(program: Program, opportunityId: string): Promise<OpportunityStanding | null> {
    // The state is the last change of state in the history; event rows carry none.
    const statuses = { where: { status: { not: null } }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } as const;
    let found: Latest;
    if (program === "code-with-us") {
      const row = await this.prisma.cwuOpportunities.findUnique({
        where: { id: opportunityId },
        select: { createdBy: true, cwuOpportunityStatuses: statuses },
      });
      found = row && { createdBy: row.createdBy, statuses: row.cwuOpportunityStatuses };
    } else if (program === "sprint-with-us") {
      const row = await this.prisma.swuOpportunities.findUnique({
        where: { id: opportunityId },
        select: { createdBy: true, swuOpportunityStatuses: statuses },
      });
      found = row && { createdBy: row.createdBy, statuses: row.swuOpportunityStatuses };
    } else {
      const row = await this.prisma.twuOpportunities.findUnique({
        where: { id: opportunityId },
        select: { createdBy: true, twuOpportunityStatuses: statuses },
      });
      found = row && { createdBy: row.createdBy, statuses: row.twuOpportunityStatuses };
    }
    const status = found?.statuses[0]?.status;
    if (!found || !isStatusOf(program, status)) return null;
    return { status: status as OpportunityStatus, createdBy: found.createdBy };
  }

  async watch(program: Program, opportunity: string, user: string, createdAt: Date): Promise<boolean> {
    const data = { opportunity, user, createdAt };
    // Asked first, so the ordinary second watch is a reading rather than a failed write.
    if ((await this.watchedBy(program, user)).has(opportunity)) return false;
    try {
      if (program === "code-with-us") await this.prisma.cwuOpportunitySubscribers.create({ data });
      else if (program === "sprint-with-us") await this.prisma.swuOpportunitySubscribers.create({ data });
      else await this.prisma.twuOpportunitySubscribers.create({ data });
      return true;
    } catch (error) {
      // The pair is the key: a second watch is the same row again.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
      throw error;
    }
  }

  async unwatch(program: Program, opportunity: string, user: string): Promise<boolean> {
    const where = { opportunity, user };
    const { count } =
      program === "code-with-us"
        ? await this.prisma.cwuOpportunitySubscribers.deleteMany({ where })
        : program === "sprint-with-us"
          ? await this.prisma.swuOpportunitySubscribers.deleteMany({ where })
          : await this.prisma.twuOpportunitySubscribers.deleteMany({ where });
    return count > 0;
  }

  async watchedBy(program: Program, user: string): Promise<ReadonlySet<string>> {
    const select = { opportunity: true } as const;
    const rows =
      program === "code-with-us"
        ? await this.prisma.cwuOpportunitySubscribers.findMany({ where: { user }, select })
        : program === "sprint-with-us"
          ? await this.prisma.swuOpportunitySubscribers.findMany({ where: { user }, select })
          : await this.prisma.twuOpportunitySubscribers.findMany({ where: { user }, select });
    return new Set(rows.map((row) => row.opportunity));
  }

  async watcherCount(program: Program, opportunity: string): Promise<number> {
    const where = { opportunity };
    return program === "code-with-us"
      ? this.prisma.cwuOpportunitySubscribers.count({ where })
      : program === "sprint-with-us"
        ? this.prisma.swuOpportunitySubscribers.count({ where })
        : this.prisma.twuOpportunitySubscribers.count({ where });
  }
}
