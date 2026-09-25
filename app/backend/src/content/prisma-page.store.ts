import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Page, PageStore } from "./page";

interface StoredVersion {
  readonly title: string;
  readonly body: string;
  readonly createdAt: Date;
}

interface StoredPage {
  readonly id: string;
  readonly createdAt: Date;
  readonly slug: string;
  readonly fixed: boolean;
  readonly contentVersions: readonly StoredVersion[];
}

/**
 * Pages as the kept schema holds them: one row for the page and one row for each successive
 * version of its title and body. The current wording is the last version; the earlier ones
 * are kept and nothing in the service shows them (R-7.8, R-7.23).
 */
@Injectable()
export class PrismaPageStore implements PageStore {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly currentVersion = {
    contentVersions: {
      orderBy: { id: "desc" },
      take: 1,
      select: { title: true, body: true, createdAt: true },
    },
  } as const;

  async findByIdentifier(identifier: string): Promise<Page | null> {
    const row = await this.prisma.content.findUnique({
      where: { id: identifier },
      include: PrismaPageStore.currentVersion,
    });
    return asPage(row);
  }

  async findByAddress(address: string): Promise<Page | null> {
    const row = await this.prisma.content.findUnique({
      where: { slug: address },
      include: PrismaPageStore.currentVersion,
    });
    return asPage(row);
  }
}

export function asPage(row: StoredPage | null): Page | null {
  if (!row) return null;
  const current = row.contentVersions[0];
  // A page with no wording behind it has nothing to show, so it answers as no page does.
  if (!current) return null;
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: current.createdAt.toISOString(),
    slug: row.slug,
    title: current.title,
    body: current.body,
    fixed: row.fixed,
  };
}
