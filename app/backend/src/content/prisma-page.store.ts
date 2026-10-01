import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AddressInUse, Author, Authorship, Page, PageStore, PageWording } from "./page";

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

interface StoredAuthor {
  readonly id: string;
  readonly name: string;
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

  async authorshipOf(pageId: string): Promise<Authorship> {
    const row = await this.prisma.content.findUnique({
      where: { id: pageId },
      select: {
        users: { select: { id: true, name: true } },
        contentVersions: {
          orderBy: { id: "desc" },
          take: 1,
          select: { users: { select: { id: true, name: true } } },
        },
      },
    });
    return {
      createdBy: asAuthor(row?.users ?? null),
      // The author of the current wording, not of the page (R-7.27 note).
      updatedBy: asAuthor(row?.contentVersions[0]?.users ?? null),
    };
  }

  async list(): Promise<Page[]> {
    const rows = await this.prisma.content.findMany({ include: PrismaPageStore.currentVersion });
    return rows.map(asPage).filter((page): page is Page => page !== null);
  }

  async create(wording: PageWording): Promise<Page> {
    const id = randomUUID();
    const now = new Date();
    try {
      await this.prisma.$transaction(async (transaction) => {
        if (await transaction.content.findUnique({ where: { slug: wording.slug }, select: { id: true } })) {
          throw new AddressInUse(wording.slug);
        }
        await transaction.content.create({
          data: { id, createdAt: now, createdBy: wording.author, slug: wording.slug, fixed: false },
        });
        await transaction.contentVersions.create({
          data: {
            id: 1,
            contentId: id,
            title: wording.title,
            body: wording.body,
            createdAt: now,
            createdBy: wording.author,
          },
        });
      });
    } catch (error) {
      throw asAddressInUse(error, wording.slug);
    }
    return (await this.findByIdentifier(id)) as Page;
  }

  async publish(pageId: string, wording: PageWording): Promise<Page> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        const page = await transaction.content.findUnique({ where: { id: pageId }, select: { slug: true } });
        if (!page) throw new Error(`No page is held at ${pageId}.`);
        if (page.slug !== wording.slug) {
          const holder = await transaction.content.findUnique({
            where: { slug: wording.slug },
            select: { id: true },
          });
          if (holder) throw new AddressInUse(wording.slug);
          // Moved at once; nothing is left at the old address and nothing records it (R-7.24).
          await transaction.content.update({ where: { id: pageId }, data: { slug: wording.slug } });
        }
        // The submission names no version it was based on, so this is simply the next one. Two
        // publishes that read the same latest version collide on the version key here, and the
        // second is refused as a fault rather than silently winning (R-7.28).
        const latest = await transaction.contentVersions.aggregate({
          where: { contentId: pageId },
          _max: { id: true },
        });
        await transaction.contentVersions.create({
          data: {
            id: (latest._max.id ?? 0) + 1,
            contentId: pageId,
            title: wording.title,
            body: wording.body,
            createdAt: new Date(),
            createdBy: wording.author,
          },
        });
      });
    } catch (error) {
      throw asAddressInUse(error, wording.slug);
    }
    return (await this.findByIdentifier(pageId)) as Page;
  }

  async remove(pageId: string): Promise<void> {
    // Every version goes with the page; nothing of its wording survives (R-7.9).
    await this.prisma.$transaction([
      this.prisma.contentVersions.deleteMany({ where: { contentId: pageId } }),
      this.prisma.content.deleteMany({ where: { id: pageId } }),
    ]);
  }
}

/**
 * Two publishes racing for one address both pass the check, and the second meets the address's
 * unique key. That is the same clash as one found by the check (R-7.22).
 */
function asAddressInUse(error: unknown, slug: string): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes("slug")
  ) {
    return new AddressInUse(slug);
  }
  return error;
}

function asAuthor(row: StoredAuthor | null): Author | null {
  return row ? { id: row.id, name: row.name } : null;
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
