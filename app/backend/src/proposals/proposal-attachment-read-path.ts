import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { FileReadPath } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { FileReader } from "../rules/files";
import { Program, isStatusOf, pacificDayOf } from "../rules/opportunities";
import { hasClosedToProposals, mayReadProposal } from "../rules/proposals";

/**
 * The tables each program keeps a proposal's attachments in, with the proposal, its history and its
 * opportunity's. The names are this file's own constants and are the only identifiers ever written
 * into a statement; every value is bound.
 */
const PROGRAMS: readonly {
  readonly program: Program;
  readonly attachments: string;
  readonly proposals: string;
  readonly organization: string;
  readonly proposalHistory: string;
  readonly opportunities: string;
  readonly opportunityHistory: string;
  readonly opportunityVersions: string;
}[] = [
  {
    program: "code-with-us",
    attachments: "cwuProposalAttachments",
    proposals: "cwuProposals",
    organization: "proponentOrganization",
    proposalHistory: "cwuProposalStatuses",
    opportunities: "cwuOpportunities",
    opportunityHistory: "cwuOpportunityStatuses",
    opportunityVersions: "cwuOpportunityVersions",
  },
  {
    program: "sprint-with-us",
    attachments: "swuProposalAttachments",
    proposals: "swuProposals",
    organization: "organization",
    proposalHistory: "swuProposalStatuses",
    opportunities: "swuOpportunities",
    opportunityHistory: "swuOpportunityStatuses",
    opportunityVersions: "swuOpportunityVersions",
  },
  {
    program: "team-with-us",
    attachments: "twuProposalAttachments",
    proposals: "twuProposals",
    organization: "organization",
    proposalHistory: "twuProposalStatuses",
    opportunities: "twuOpportunities",
    opportunityHistory: "twuOpportunityStatuses",
    opportunityVersions: "twuOpportunityVersions",
  },
];

const name = (identifier: string) => Prisma.raw(`"${identifier}"`);

interface AttachedRow {
  program: Program;
  createdBy: string | null;
  organization: string | null;
  status: string | null;
  opportunityCreatedBy: string | null;
  opportunityStatus: string | null;
  proposalDeadline: Date | null;
}

/**
 * A file attached to a proposal is readable by whoever may read the proposal (R-8.20, R-8.25): the
 * vendor who wrote it and those who own or administer its organization, and staff once the
 * opportunity has closed — by one rule, `mayReadProposal`, in every program that attaches files to
 * proposals. Nothing is recorded against the file itself; the proposal is asked every time, so
 * taking the file off the proposal, or deleting the proposal, ends this way of reading it (R-8.31).
 */
@Injectable()
export class ProposalAttachmentReadPath implements FileReadPath {
  constructor(private readonly prisma: PrismaService) {}

  async mayRead(fileId: string, reader: FileReader | null): Promise<boolean> {
    if (!reader) return false;
    const [rows, managed] = await Promise.all([this.attachedTo(fileId), this.managedBy(reader)]);
    const now = new Date();
    return rows.some((row) => {
      if (!isStatusOf(row.program, row.opportunityStatus) || !row.status || !row.proposalDeadline) return false;
      const closed = hasClosedToProposals({ status: row.opportunityStatus, proposalDeadline: pacificDayOf(row.proposalDeadline) }, now);
      return mayReadProposal(
        reader,
        {
          status: row.status,
          createdBy: row.createdBy,
          organization: row.organization,
          opportunity: { createdBy: row.opportunityCreatedBy, closed },
        },
        row.organization !== null && managed.has(row.organization),
      );
    });
  }

  /** Every proposal, in any program, the file is attached to, with what reading it turns on. */
  private async attachedTo(fileId: string): Promise<AttachedRow[]> {
    const parts = PROGRAMS.map(
      (tables) => Prisma.sql`
        SELECT ${tables.program}::text AS "program", p."createdBy", p.${name(tables.organization)} AS "organization",
          (SELECT s."status" FROM ${name(tables.proposalHistory)} s
            WHERE s."proposal" = p."id" AND s."status" IS NOT NULL ORDER BY s."createdAt" DESC LIMIT 1) AS "status",
          o."createdBy" AS "opportunityCreatedBy",
          (SELECT s."status" FROM ${name(tables.opportunityHistory)} s
            WHERE s."opportunity" = o."id" AND s."status" IS NOT NULL ORDER BY s."createdAt" DESC LIMIT 1) AS "opportunityStatus",
          (SELECT v."proposalDeadline" FROM ${name(tables.opportunityVersions)} v
            WHERE v."opportunity" = o."id" ORDER BY v."createdAt" DESC LIMIT 1) AS "proposalDeadline"
        FROM ${name(tables.attachments)} a
        JOIN ${name(tables.proposals)} p ON p."id" = a."proposal"
        JOIN ${name(tables.opportunities)} o ON o."id" = p."opportunity"
        WHERE a."file" = ${fileId}::uuid`,
    );
    return this.prisma.$queryRaw<AttachedRow[]>(Prisma.join(parts, " UNION ALL "));
  }

  /** The organizations a vendor owns or administers, by an active membership. */
  private async managedBy(reader: FileReader): Promise<ReadonlySet<string>> {
    if (reader.type !== "VENDOR") return new Set();
    const rows = await this.prisma.affiliations.findMany({
      where: { user: reader.id, membershipStatus: "ACTIVE", membershipType: { in: ["OWNER", "ADMIN"] } },
      select: { organization: true },
    });
    return new Set(rows.map((row) => row.organization));
  }
}
