import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { asFileRecord } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { OPPORTUNITY_EVENTS, OpportunityEvent, OpportunityStatus, Program, isStatusOf } from "../rules/opportunities";
import { counterName } from "../rules/opportunity-list";
import { Recipient } from "./cwu-opportunity";
import { OpportunityRecordsStore, RecordedEntry, ReportingFigures, StoredAddendum } from "./opportunity-records";

/**
 * The tables each program keeps an opportunity's running record in. The names are this file's own
 * constants and are the only identifiers ever written into a statement; every value is bound.
 */
const TABLES: Readonly<
  Record<Program, { history: string; addenda: string; noteAttachments: string | null; watchers: string; proposals: string; proposalHistory: string }>
> = {
  "code-with-us": {
    history: "cwuOpportunityStatuses",
    addenda: "cwuOpportunityAddenda",
    noteAttachments: "cwuOpportunityNoteAttachments",
    watchers: "cwuOpportunitySubscribers",
    proposals: "cwuProposals",
    proposalHistory: "cwuProposalStatuses",
  },
  "sprint-with-us": {
    history: "swuOpportunityStatuses",
    addenda: "swuOpportunityAddenda",
    noteAttachments: "swuOpportunityNoteAttachments",
    watchers: "swuOpportunitySubscribers",
    proposals: "swuProposals",
    proposalHistory: "swuProposalStatuses",
  },
  "team-with-us": {
    history: "twuOpportunityStatuses",
    addenda: "twuOpportunityAddenda",
    noteAttachments: null,
    watchers: "twuOpportunitySubscribers",
    proposals: "twuProposals",
    proposalHistory: "twuProposalStatuses",
  },
};

const table = (name: string) => Prisma.raw(`"${name}"`);

/** A proposal counts as submitted unless it is still a draft or has been withdrawn (R-1.30). */
const NOT_SUBMITTED = ["DRAFT", "WITHDRAWN"];

/**
 * The submitted proposals of an opportunity: each proposal's state is the last change of state in
 * its own history.
 */
function submittedProposals(program: Program, opportunityId: string): Prisma.Sql {
  const { proposals, proposalHistory } = TABLES[program];
  return Prisma.sql`
    SELECT p."id", p."createdBy" FROM ${table(proposals)} p
    WHERE p."opportunity" = ${opportunityId}::uuid
      AND (
        SELECT s."status" FROM ${table(proposalHistory)} s
        WHERE s."proposal" = p."id" AND s."status" IS NOT NULL
        ORDER BY s."createdAt" DESC LIMIT 1
      ) NOT IN (${Prisma.join(NOT_SUBMITTED)})`;
}

interface PersonRow {
  createdById: string | null;
  createdByName: string | null;
}

const personOf = (row: PersonRow) => (row.createdById ? { id: row.createdById, name: row.createdByName ?? "" } : null);

@Injectable()
export class PrismaOpportunityRecordsStore implements OpportunityRecordsStore {
  constructor(private readonly prisma: PrismaService) {}

  async addenda(program: Program, opportunityId: string): Promise<StoredAddendum[]> {
    const rows = await this.prisma.$queryRaw<(PersonRow & { id: string; createdAt: Date; description: string })[]>`
      SELECT a."id", a."createdAt", a."description", u."id" AS "createdById", u."name" AS "createdByName"
      FROM ${table(TABLES[program].addenda)} a LEFT JOIN "users" u ON u."id" = a."createdBy"
      WHERE a."opportunity" = ${opportunityId}::uuid
      ORDER BY a."createdAt" ASC`;
    return rows.map((row) => ({ id: row.id, createdAt: row.createdAt, createdBy: personOf(row), description: row.description }));
  }

  async addAddendum(program: Program, opportunityId: string, description: string, by: string): Promise<void> {
    const now = new Date();
    const { addenda, history } = TABLES[program];
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        INSERT INTO ${table(addenda)} ("id", "opportunity", "description", "createdAt", "createdBy")
        VALUES (${randomUUID()}::uuid, ${opportunityId}::uuid, ${description}, ${now}, ${by}::uuid)`,
      this.prisma.$executeRaw`
        INSERT INTO ${table(history)} ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
        VALUES (${randomUUID()}::uuid, ${now}, ${by}::uuid, ${opportunityId}::uuid, NULL, 'ADDENDUM_ADDED', NULL)`,
    ]);
  }

  async addNote(program: Program, opportunityId: string, note: string, files: readonly string[], by: string): Promise<void> {
    const { history, noteAttachments } = TABLES[program];
    if (!noteAttachments) throw new Error(`The ${program} program keeps no notes.`);
    const event = randomUUID();
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        INSERT INTO ${table(history)} ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
        VALUES (${event}::uuid, ${new Date()}, ${by}::uuid, ${opportunityId}::uuid, NULL, 'NOTE_ADDED', ${note})`,
      ...files.map(
        (file) => this.prisma.$executeRaw`
          INSERT INTO ${table(noteAttachments)} ("event", "file") VALUES (${event}::uuid, ${file}::uuid)`,
      ),
    ]);
  }

  async changeStatus(
    program: Program,
    opportunityId: string,
    status: OpportunityStatus,
    by: string,
    note: string | null,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO ${table(TABLES[program].history)} ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
      VALUES (${randomUUID()}::uuid, ${new Date()}, ${by}::uuid, ${opportunityId}::uuid, ${status}, NULL, ${note})`;
  }

  async history(program: Program, opportunityId: string): Promise<RecordedEntry[]> {
    const { history, noteAttachments } = TABLES[program];
    const rows = await this.prisma.$queryRaw<
      (PersonRow & { id: string; createdAt: Date; status: string | null; event: string | null; note: string | null })[]
    >`
      SELECT h."id", h."createdAt", h."status", h."event", h."note", u."id" AS "createdById", u."name" AS "createdByName"
      FROM ${table(history)} h LEFT JOIN "users" u ON u."id" = h."createdBy"
      WHERE h."opportunity" = ${opportunityId}::uuid
      ORDER BY h."createdAt" DESC, h."id" DESC`;
    const files = new Map<string, RecordedEntry["attachments"][number][]>();
    if (noteAttachments && rows.length > 0) {
      const attached = await this.prisma.$queryRaw<
        { event: string; id: string; name: string; createdAt: Date; createdBy: string | null; fileBlob: string }[]
      >`
        SELECT n."event", f."id", f."name", f."createdAt", f."createdBy", f."fileBlob"
        FROM ${table(noteAttachments)} n JOIN "files" f ON f."id" = n."file"
        WHERE n."event" IN (${Prisma.join(rows.map((row) => Prisma.sql`${row.id}::uuid`))})
        ORDER BY f."name" ASC`;
      for (const file of attached) {
        const record = asFileRecord({ ...file, createdAt: file.createdAt.toISOString() });
        files.set(file.event, [...(files.get(file.event) ?? []), record]);
      }
    }
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      createdBy: personOf(row),
      status: isStatusOf(program, row.status) ? (row.status as OpportunityStatus) : null,
      event: (OPPORTUNITY_EVENTS as readonly string[]).includes(row.event ?? "") ? (row.event as OpportunityEvent) : null,
      note: row.note,
      attachments: files.get(row.id) ?? [],
    }));
  }

  async watcherRecipients(program: Program, opportunityId: string): Promise<Recipient[]> {
    return this.prisma.$queryRaw<Recipient[]>`
      SELECT u."email" FROM ${table(TABLES[program].watchers)} w JOIN "users" u ON u."id" = w."user"
      WHERE w."opportunity" = ${opportunityId}::uuid AND u."status" = 'ACTIVE'
      ORDER BY w."createdAt" ASC`;
  }

  async proponentRecipients(program: Program, opportunityId: string): Promise<Recipient[]> {
    return this.prisma.$queryRaw<Recipient[]>`
      SELECT DISTINCT u."email" FROM (${submittedProposals(program, opportunityId)}) p
      JOIN "users" u ON u."id" = p."createdBy"
      WHERE u."status" = 'ACTIVE'`;
  }

  async reportingFigures(program: Program, opportunityId: string): Promise<ReportingFigures> {
    const [row] = await this.prisma.$queryRaw<{ views: bigint | number | null; watchers: bigint | number; proposals: bigint | number }[]>`
      SELECT
        (SELECT c."count" FROM "viewCounters" c WHERE c."name" = ${counterName(program, opportunityId, "views")}) AS "views",
        (SELECT COUNT(*) FROM ${table(TABLES[program].watchers)} w WHERE w."opportunity" = ${opportunityId}::uuid) AS "watchers",
        (SELECT COUNT(*) FROM (${submittedProposals(program, opportunityId)}) p) AS "proposals"`;
    return { numViews: Number(row?.views ?? 0), numWatchers: Number(row?.watchers ?? 0), numProposals: Number(row?.proposals ?? 0) };
  }

  async recipient(accountId: string): Promise<Recipient | null> {
    const found = await this.prisma.users.findUnique({ where: { id: accountId }, select: { email: true, status: true } });
    // A deactivated account is sent nothing (R-6.17).
    return found && found.status === "ACTIVE" ? { email: found.email } : null;
  }
}
