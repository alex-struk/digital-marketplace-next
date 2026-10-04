import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FINALIZED_NOTE, NEXT_PROPOSAL_STAGE, NEXT_STAGE, QUESTIONS_SCORE_ENTERED } from "../rules/consensus";
import type { EnteredScore } from "../rules/individual-evaluation";
import type { OtherProgram } from "../rules/other-program-drafts";
import { ConsensusStore, Finalizing } from "./consensus";
import type { StoredEvaluation } from "./individual-evaluation";
import { ScoreTables, readScoreSets, replaceScores, tablesOf, writeScores, writeStatus } from "./prisma-individual-evaluation.store";

const chairTables = (program: OtherProgram): ScoreTables => {
  const t = tablesOf(program);
  return { scores: t.consensuses, statuses: t.consensusStatuses };
};

/**
 * The chair's consensus over the kept schema (decision record 0063): the chair evaluation tables,
 * a status history — DRAFT when started, SUBMITTED each time the set is submitted — and one row
 * per question, as an individual evaluation is kept.
 */
@Injectable()
export class PrismaConsensusStore implements ConsensusStore {
  constructor(private readonly prisma: PrismaService) {}

  consensuses(program: OtherProgram, of: { readonly proposal: string } | { readonly opportunity: string }): Promise<StoredEvaluation[]> {
    return readScoreSets(this.prisma, program, chairTables(program), of);
  }

  async create(program: OtherProgram, proposalId: string, chairId: string, scores: readonly EnteredScore[], at: Date): Promise<boolean> {
    const t = tablesOf(program);
    const tables = chairTables(program);
    return this.prisma.$transaction(async (tx) => {
      // Held until the draft is saved, so two attempts at once cannot both start one.
      await tx.$queryRawUnsafe(`SELECT "id" FROM ${t.proposals} WHERE "id" = $1::uuid FOR UPDATE`, proposalId);
      const [held] = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*)::int AS "count" FROM ${tables.statuses} WHERE "proposal" = $1::uuid`,
        proposalId,
      );
      if ((held?.count ?? 0) > 0) return false;
      await writeScores(tx, tables.scores, proposalId, chairId, scores, at, at);
      await writeStatus(tx, tables.statuses, proposalId, chairId, "DRAFT", at);
      return true;
    });
  }

  async update(program: OtherProgram, proposalId: string, chairId: string, scores: readonly EnteredScore[], at: Date): Promise<void> {
    await this.prisma.$transaction((tx) => replaceScores(tx, chairTables(program), proposalId, chairId, scores, at));
  }

  async submit(program: OtherProgram, proposalIds: readonly string[], chairId: string, at: Date): Promise<void> {
    const tables = chairTables(program);
    await this.prisma.$transaction(async (tx) => {
      for (const proposalId of proposalIds) await writeStatus(tx, tables.statuses, proposalId, chairId, "SUBMITTED", at);
    });
  }

  async finalize(program: OtherProgram, opportunityId: string, finalizing: Finalizing, by: string, at: Date): Promise<boolean> {
    const t = tablesOf(program);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT "id" FROM ${t.opportunities} WHERE "id" = $1::uuid FOR UPDATE`, opportunityId);
      const [current] = await tx.$queryRawUnsafe<{ status: string | null }[]>(
        `SELECT "status" FROM ${t.opportunityStatuses} WHERE "opportunity" = $1::uuid AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
        opportunityId,
      );
      if (current?.status !== "EVAL_QUESTIONS_CONSENSUS") return false;
      const moment = at.toISOString();
      for (const entry of finalizing.recorded) {
        await tx.$executeRawUnsafe(
          `INSERT INTO ${t.proposalStatuses} ("id", "createdAt", "createdBy", "proposal", "status", "event", "note")
           VALUES ($1::uuid, $2::timestamptz, $3::uuid, $4::uuid, NULL, $5, $6)`,
          randomUUID(),
          moment,
          by,
          entry.proposal,
          QUESTIONS_SCORE_ENTERED,
          entry.note,
        );
      }
      for (const proposal of finalizing.screenedIn) {
        await tx.$executeRawUnsafe(
          `INSERT INTO ${t.proposalStatuses} ("id", "createdAt", "createdBy", "proposal", "status", "event", "note")
           VALUES ($1::uuid, $2::timestamptz, $3::uuid, $4::uuid, $5, NULL, $6)`,
          randomUUID(),
          moment,
          by,
          proposal,
          NEXT_PROPOSAL_STAGE[program],
          FINALIZED_NOTE,
        );
      }
      await tx.$executeRawUnsafe(
        `INSERT INTO ${t.opportunityStatuses} ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
         VALUES ($1::uuid, $2::timestamptz, $3::uuid, $4::uuid, $5, NULL, $6)`,
        randomUUID(),
        moment,
        by,
        opportunityId,
        NEXT_STAGE[program],
        FINALIZED_NOTE,
      );
      return true;
    });
  }
}
