import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Program, pacificDayOf } from "../rules/opportunities";
import {
  FIRST_EVALUATION_STAGE,
  FIRST_REVIEW_STAGE,
  OPPORTUNITY_CLOSED_NOTE,
  PROPOSAL_CLOSED_NOTE,
  anonymizesProponents,
  anonymousProponentName,
} from "../rules/proposal-evaluation";
import { deadlineHasPassed } from "../rules/proposals";
import { ClosedOpportunity, ClosingStore } from "./closing";

/** The kept schema names each program's tables with the same prefix. */
const PREFIX: Readonly<Record<Program, string>> = { "code-with-us": "cwu", "sprint-with-us": "swu", "team-with-us": "twu" };

/** The tables of one program, quoted for SQL; every name is this file's own constant. */
function tablesOf(program: Program) {
  const p = PREFIX[program];
  return {
    opportunities: `"${p}Opportunities"`,
    statuses: `"${p}OpportunityStatuses"`,
    versions: `"${p}OpportunityVersions"`,
    proposals: `"${p}Proposals"`,
    proposalStatuses: `"${p}ProposalStatuses"`,
    panel: program === "code-with-us" ? null : `"${p}EvaluationPanelMembers"`,
  };
}

/**
 * Closing, over the kept schema: the same tables in each program, so one set of statements serves
 * all three. An opportunity's state is the newest history row that names one, and its deadline its
 * newest version's, as everywhere else in the service.
 */
@Injectable()
export class PrismaClosingStore implements ClosingStore {
  constructor(private readonly prisma: PrismaService) {}

  async lapsed(program: Program, now: Date): Promise<string[]> {
    const t = tablesOf(program);
    const rows = await this.prisma.$queryRawUnsafe<{ id: string; deadline: Date | null }[]>(
      `SELECT o."id"::text AS "id",
              (SELECT v."proposalDeadline" FROM ${t.versions} v
                WHERE v."opportunity" = o."id" ORDER BY v."createdAt" DESC LIMIT 1) AS "deadline"
         FROM ${t.opportunities} o
        WHERE (SELECT s."status" FROM ${t.statuses} s
                WHERE s."opportunity" = o."id" AND s."status" IS NOT NULL
                ORDER BY s."createdAt" DESC LIMIT 1) = 'PUBLISHED'`,
    );
    return rows.filter((row) => row.deadline !== null && hasLapsed(row.deadline, now)).map((row) => row.id);
  }

  async close(program: Program, id: string, now: Date): Promise<ClosedOpportunity | null> {
    const t = tablesOf(program);
    return this.prisma.$transaction(async (tx) => {
      // Held until the change is saved, so a second run, here or in another replica, finds it closed.
      await tx.$queryRawUnsafe(`SELECT "id" FROM ${t.opportunities} WHERE "id" = $1::uuid FOR UPDATE`, id);
      const [opportunity] = await tx.$queryRawUnsafe<{ createdBy: string | null; status: string | null }[]>(
        `SELECT o."createdBy"::text AS "createdBy",
                (SELECT s."status" FROM ${t.statuses} s
                  WHERE s."opportunity" = o."id" AND s."status" IS NOT NULL
                  ORDER BY s."createdAt" DESC LIMIT 1) AS "status"
           FROM ${t.opportunities} o WHERE o."id" = $1::uuid`,
        id,
      );
      const [version] = await tx.$queryRawUnsafe<{ id: string; title: string; proposalDeadline: Date }[]>(
        `SELECT "id"::text AS "id", "title", "proposalDeadline" FROM ${t.versions}
          WHERE "opportunity" = $1::uuid ORDER BY "createdAt" DESC LIMIT 1`,
        id,
      );
      if (!opportunity || opportunity.status !== "PUBLISHED" || !version || !hasLapsed(version.proposalDeadline, now)) return null;

      await insertStatus(tx, t.statuses, "opportunity", id, FIRST_EVALUATION_STAGE[program], OPPORTUNITY_CLOSED_NOTE, now);

      // The submitted proposals, in the order they were made; drafts and withdrawn ones stay as they are (R-2.5).
      const submitted = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT p."id"::text AS "id" FROM ${t.proposals} p
          WHERE p."opportunity" = $1::uuid
            AND (SELECT s."status" FROM ${t.proposalStatuses} s
                  WHERE s."proposal" = p."id" AND s."status" IS NOT NULL
                  ORDER BY s."createdAt" DESC LIMIT 1) = 'SUBMITTED'
          ORDER BY p."createdAt" ASC, p."id" ASC`,
        id,
      );
      for (const [index, proposal] of submitted.entries()) {
        await insertStatus(tx, t.proposalStatuses, "proposal", proposal.id, FIRST_REVIEW_STAGE[program], PROPOSAL_CLOSED_NOTE, now);
        if (anonymizesProponents(program)) {
          await tx.$executeRawUnsafe(
            `UPDATE ${t.proposals} SET "anonymousProponentName" = $2 WHERE "id" = $1::uuid`,
            proposal.id,
            anonymousProponentName(index),
          );
        }
      }

      const evaluators = t.panel
        ? await tx.$queryRawUnsafe<{ user: string }[]>(
            `SELECT "user"::text AS "user" FROM ${t.panel}
              WHERE "opportunityVersion" = $1::uuid AND "evaluator" = TRUE ORDER BY "order" ASC`,
            version.id,
          )
        : [];
      return {
        program,
        id,
        title: version.title,
        createdBy: opportunity.createdBy,
        evaluators: evaluators.map((row) => row.user),
        reviewed: submitted.map((row) => row.id),
      };
    });
  }

  async addressesOf(accountIds: readonly string[]): Promise<(string | null)[]> {
    if (accountIds.length === 0) return [];
    const accounts = await this.prisma.users.findMany({
      where: { id: { in: [...accountIds] }, status: "ACTIVE" },
      select: { id: true, email: true },
    });
    const byId = new Map(accounts.map((account) => [account.id, account.email]));
    // A deactivated account is told nothing (R-6.17).
    return accountIds.filter((accountId) => byId.has(accountId)).map((accountId) => byId.get(accountId) ?? null);
  }
}

/** Proposals close at 4:00 p.m. Pacific time on the deadline's day, as everywhere else (R-2.15). */
function hasLapsed(deadline: Date, now: Date): boolean {
  return deadlineHasPassed(pacificDayOf(deadline), now);
}

async function insertStatus(
  tx: Prisma.TransactionClient,
  table: string,
  parent: "opportunity" | "proposal",
  parentId: string,
  status: string,
  note: string,
  at: Date,
): Promise<void> {
  // Made by nobody: the service closed it, not a person (shown as "System").
  await tx.$executeRawUnsafe(
    `INSERT INTO ${table} ("id", "createdAt", "createdBy", "${parent}", "status", "event", "note")
     VALUES ($1::uuid, $2::timestamptz, NULL, $3::uuid, $4, NULL, $5)`,
    randomUUID(),
    at.toISOString(),
    parentId,
    status,
    note,
  );
}
