import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { FileReadPath } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { FileReader } from "../rules/files";
import { Program, isStatusOf, mayReadOpportunity } from "../rules/opportunities";

/**
 * The tables each program keeps an opportunity's attachments in, with its versions and history.
 * The names are this file's own constants and are the only identifiers ever written into a
 * statement; every value is bound.
 */
const PROGRAMS: readonly {
  readonly program: Program;
  readonly attachments: string;
  readonly versions: string;
  readonly opportunities: string;
  readonly history: string;
}[] = [
  {
    program: "code-with-us",
    attachments: "cwuOpportunityAttachments",
    versions: "cwuOpportunityVersions",
    opportunities: "cwuOpportunities",
    history: "cwuOpportunityStatuses",
  },
  {
    program: "sprint-with-us",
    attachments: "swuOpportunityAttachments",
    versions: "swuOpportunityVersions",
    opportunities: "swuOpportunities",
    history: "swuOpportunityStatuses",
  },
  {
    program: "team-with-us",
    attachments: "twuOpportunityAttachments",
    versions: "twuOpportunityVersions",
    opportunities: "twuOpportunities",
    history: "twuOpportunityStatuses",
  },
];

const name = (identifier: string) => Prisma.raw(`"${identifier}"`);

interface AttachedRow {
  program: Program;
  createdBy: string | null;
  status: string | null;
}

/**
 * A file attached to an opportunity is readable by whoever may read the opportunity — anyone once
 * it is published, and before then its creator and administrators — by one rule,
 * `mayReadOpportunity`, in all three programs (R-8.20, R-8.25; decision record 0055). Only an
 * opportunity's current version counts, so a file taken off it stops being readable through it.
 * Nothing is recorded against the file itself (R-8.19): the opportunity is asked every time, so the
 * file becomes readable exactly when the opportunity does.
 */
@Injectable()
export class OpportunityAttachmentReadPath implements FileReadPath {
  constructor(private readonly prisma: PrismaService) {}

  async mayRead(fileId: string, reader: FileReader | null): Promise<boolean> {
    const rows = await this.attachedTo(fileId);
    return rows.some(
      (row) => isStatusOf(row.program, row.status) && mayReadOpportunity(reader, { status: row.status, createdBy: row.createdBy }),
    );
  }

  /** Every opportunity, in any program, whose current version carries the file. */
  private async attachedTo(fileId: string): Promise<AttachedRow[]> {
    const parts = PROGRAMS.map(
      (tables) => Prisma.sql`
        SELECT ${tables.program}::text AS "program", o."createdBy",
          (SELECT s."status" FROM ${name(tables.history)} s
            WHERE s."opportunity" = o."id" AND s."status" IS NOT NULL ORDER BY s."createdAt" DESC LIMIT 1) AS "status"
        FROM ${name(tables.attachments)} a
        JOIN ${name(tables.versions)} v ON v."id" = a."opportunityVersion"
        JOIN ${name(tables.opportunities)} o ON o."id" = v."opportunity"
        WHERE a."file" = ${fileId}::uuid
          AND v."id" = (SELECT c."id" FROM ${name(tables.versions)} c WHERE c."opportunity" = o."id" ORDER BY c."createdAt" DESC LIMIT 1)`,
    );
    return this.prisma.$queryRaw<AttachedRow[]>(Prisma.join(parts, " UNION ALL "));
  }
}
