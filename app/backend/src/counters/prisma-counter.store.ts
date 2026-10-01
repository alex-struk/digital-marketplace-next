import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CounterStore } from "./counters";

@Injectable()
export class PrismaCounterStore implements CounterStore {
  constructor(private readonly prisma: PrismaService) {}

  async read(names: readonly string[]): Promise<ReadonlyMap<string, number>> {
    const rows = await this.prisma.viewCounters.findMany({ where: { name: { in: [...names] } } });
    return new Map(rows.map((row) => [row.name, row.count]));
  }

  async increment(name: string): Promise<number> {
    const once = () =>
      this.prisma.viewCounters.upsert({
        where: { name },
        create: { name, count: 1 },
        update: { count: { increment: 1 } },
      });
    try {
      return (await once()).count;
    } catch (error) {
      // Two first views at once: the second to start the count finds it started, and adds to it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return (await once()).count;
      throw error;
    }
  }
}
