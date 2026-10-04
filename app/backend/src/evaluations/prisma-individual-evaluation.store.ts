import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EnteredScore, EvaluationStatus, MOVED_TO_CONSENSUS_NOTE, SubmittedEvaluation, storedScore } from "../rules/individual-evaluation";
import type { OtherProgram } from "../rules/other-program-drafts";
import { IndividualEvaluationStore, Proponent, StoredEvaluation } from "./individual-evaluation";

/** The kept schema's tables for each program, quoted for SQL; every name is this file's own constant. */
function tablesOf(program: OtherProgram) {
  const p = program === "sprint-with-us" ? "swu" : "twu";
  const questions = program === "sprint-with-us" ? "TeamQuestion" : "ResourceQuestion";
  return {
    opportunities: `"${p}Opportunities"`,
    opportunityStatuses: `"${p}OpportunityStatuses"`,
    proposals: `"${p}Proposals"`,
    proposalStatuses: `"${p}ProposalStatuses"`,
    responses: `"${p}${questions}Responses"`,
    evaluations: `"${p}${questions}ResponseEvaluatorEvaluations"`,
    evaluationStatuses: `"${p}${questions}ResponseEvaluatorEvaluationStatuses"`,
  };
}

/**
 * The schema keeps a score as a number that cannot be empty, so a draft question with a comment and
 * no score yet is kept as "not a number", and read back as no score.
 */
const scoreParameter = (score: number | null) => (score === null ? "NaN" : String(score));

interface EvaluationRow {
  proposal: string;
  anonymousProponentName: string;
  member: string;
  name: string;
  questionOrder: number | null;
  score: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  status: string;
  statusAt: Date;
}

/**
 * Individual evaluations over the kept schema (decision record 0062). An evaluation is its status
 * history — DRAFT when started, SUBMITTED once submitted, the newest row standing — and one row
 * per question it holds a score or comment for.
 */
@Injectable()
export class PrismaIndividualEvaluationStore implements IndividualEvaluationStore {
  constructor(private readonly prisma: PrismaService) {}

  async proponents(program: OtherProgram, opportunityId: string): Promise<Proponent[]> {
    return this.readProponents(program, `p."opportunity" = $1::uuid AND p."anonymousProponentName" <> ''`, opportunityId);
  }

  async proponent(program: OtherProgram, proposalId: string): Promise<Proponent | null> {
    const [found] = await this.readProponents(program, `p."id" = $1::uuid`, proposalId);
    return found ?? null;
  }

  async evaluations(program: OtherProgram, of: { readonly proposal: string } | { readonly opportunity: string }): Promise<StoredEvaluation[]> {
    const t = tablesOf(program);
    const where = "proposal" in of ? `s."proposal" = $1::uuid` : `p."opportunity" = $1::uuid`;
    const rows = await this.prisma.$queryRawUnsafe<EvaluationRow[]>(
      `SELECT s."proposal"::text AS "proposal", p."anonymousProponentName", s."evaluationPanelMember"::text AS "member",
              u."name", e."questionOrder",
              CASE WHEN e."score" = 'NaN'::real THEN NULL ELSE e."score"::float8 END AS "score",
              e."notes", e."createdAt", e."updatedAt", s."status", s."createdAt" AS "statusAt"
         FROM (SELECT DISTINCT ON ("proposal", "evaluationPanelMember") "proposal", "evaluationPanelMember", "status", "createdAt"
                 FROM ${t.evaluationStatuses}
                ORDER BY "proposal", "evaluationPanelMember", "createdAt" DESC) s
         JOIN ${t.proposals} p ON p."id" = s."proposal"
         JOIN "users" u ON u."id" = s."evaluationPanelMember"
         LEFT JOIN ${t.evaluations} e ON e."proposal" = s."proposal" AND e."evaluationPanelMember" = s."evaluationPanelMember"
        WHERE ${where}
        ORDER BY s."proposal", s."evaluationPanelMember", e."questionOrder"`,
      "proposal" in of ? of.proposal : of.opportunity,
    );
    type Gathering = { -readonly [K in keyof StoredEvaluation]: StoredEvaluation[K] } & { scores: EnteredScore[] };
    const evaluations = new Map<string, Gathering>();
    for (const row of rows) {
      const key = `${row.proposal}/${row.member}`;
      let evaluation = evaluations.get(key);
      if (!evaluation) {
        evaluation = {
          proposal: { id: row.proposal, anonymousProponentName: row.anonymousProponentName },
          evaluator: { id: row.member, name: row.name },
          status: row.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
          scores: [],
          createdAt: row.createdAt ?? row.statusAt,
          updatedAt: row.updatedAt ?? row.statusAt,
        };
        evaluations.set(key, evaluation);
      }
      if (row.questionOrder === null) continue;
      evaluation.scores.push({
        order: row.questionOrder,
        score: row.score === null || !Number.isFinite(row.score) ? null : storedScore(row.score),
        notes: row.notes ?? "",
      });
      if (row.createdAt && row.createdAt < evaluation.createdAt) evaluation.createdAt = row.createdAt;
      if (row.updatedAt && row.updatedAt > evaluation.updatedAt) evaluation.updatedAt = row.updatedAt;
    }
    return [...evaluations.values()];
  }

  async create(program: OtherProgram, proposalId: string, evaluatorId: string, scores: readonly EnteredScore[], at: Date): Promise<boolean> {
    const t = tablesOf(program);
    return this.prisma.$transaction(async (tx) => {
      // Held until the draft is saved, so two attempts at once cannot both start one.
      await tx.$queryRawUnsafe(`SELECT "id" FROM ${t.proposals} WHERE "id" = $1::uuid FOR UPDATE`, proposalId);
      const [held] = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*)::int AS "count" FROM ${t.evaluationStatuses} WHERE "proposal" = $1::uuid AND "evaluationPanelMember" = $2::uuid`,
        proposalId,
        evaluatorId,
      );
      if ((held?.count ?? 0) > 0) return false;
      await writeScores(tx, t.evaluations, proposalId, evaluatorId, scores, at, at);
      await writeStatus(tx, t.evaluationStatuses, proposalId, evaluatorId, "DRAFT", at);
      return true;
    });
  }

  async update(program: OtherProgram, proposalId: string, evaluatorId: string, scores: readonly EnteredScore[], at: Date): Promise<void> {
    const t = tablesOf(program);
    await this.prisma.$transaction(async (tx) => {
      const [first] = await tx.$queryRawUnsafe<{ createdAt: Date | null }[]>(
        `SELECT min("createdAt") AS "createdAt" FROM ${t.evaluationStatuses} WHERE "proposal" = $1::uuid AND "evaluationPanelMember" = $2::uuid`,
        proposalId,
        evaluatorId,
      );
      await tx.$executeRawUnsafe(
        `DELETE FROM ${t.evaluations} WHERE "proposal" = $1::uuid AND "evaluationPanelMember" = $2::uuid`,
        proposalId,
        evaluatorId,
      );
      await writeScores(tx, t.evaluations, proposalId, evaluatorId, scores, first?.createdAt ?? at, at);
    });
  }

  async submit(
    program: OtherProgram,
    opportunityId: string,
    proposalIds: readonly string[],
    evaluatorId: string,
    at: Date,
    isOver: (submitted: readonly SubmittedEvaluation[]) => boolean,
  ): Promise<{ readonly movedToConsensus: boolean }> {
    const t = tablesOf(program);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT "id" FROM ${t.opportunities} WHERE "id" = $1::uuid FOR UPDATE`, opportunityId);
      for (const proposalId of proposalIds) await writeStatus(tx, t.evaluationStatuses, proposalId, evaluatorId, "SUBMITTED", at);

      const rows = await tx.$queryRawUnsafe<{ proposal: string; member: string; questionOrder: number }[]>(
        `SELECT s."proposal"::text AS "proposal", s."evaluationPanelMember"::text AS "member", e."questionOrder"
           FROM (SELECT DISTINCT ON ("proposal", "evaluationPanelMember") "proposal", "evaluationPanelMember", "status"
                   FROM ${t.evaluationStatuses}
                  ORDER BY "proposal", "evaluationPanelMember", "createdAt" DESC) s
           JOIN ${t.proposals} p ON p."id" = s."proposal"
           JOIN ${t.evaluations} e ON e."proposal" = s."proposal" AND e."evaluationPanelMember" = s."evaluationPanelMember"
          WHERE p."opportunity" = $1::uuid AND s."status" = 'SUBMITTED' AND e."score" <> 'NaN'::real`,
        opportunityId,
      );
      const submitted = new Map<string, { evaluator: string; proposal: string; scored: number[] }>();
      for (const row of rows) {
        const key = `${row.proposal}/${row.member}`;
        const entry = submitted.get(key) ?? { evaluator: row.member, proposal: row.proposal, scored: [] };
        entry.scored.push(row.questionOrder);
        submitted.set(key, entry);
      }
      if (!isOver([...submitted.values()])) return { movedToConsensus: false };

      const [current] = await tx.$queryRawUnsafe<{ status: string | null }[]>(
        `SELECT "status" FROM ${t.opportunityStatuses} WHERE "opportunity" = $1::uuid AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
        opportunityId,
      );
      if (current?.status !== "EVAL_QUESTIONS_INDIVIDUAL") return { movedToConsensus: false };
      // Made by nobody: the service moved it on, not a person (shown as "System").
      await tx.$executeRawUnsafe(
        `INSERT INTO ${t.opportunityStatuses} ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
         VALUES ($1::uuid, $2::timestamptz, NULL, $3::uuid, 'EVAL_QUESTIONS_CONSENSUS', NULL, $4)`,
        randomUUID(),
        at.toISOString(),
        opportunityId,
        MOVED_TO_CONSENSUS_NOTE,
      );
      return { movedToConsensus: true };
    });
  }

  private async readProponents(program: OtherProgram, where: string, parameter: string): Promise<Proponent[]> {
    const t = tablesOf(program);
    const rows = await this.prisma.$queryRawUnsafe<{ id: string; opportunity: string; anonymousProponentName: string; status: string | null }[]>(
      `SELECT p."id"::text AS "id", p."opportunity"::text AS "opportunity", p."anonymousProponentName",
              (SELECT s."status" FROM ${t.proposalStatuses} s
                WHERE s."proposal" = p."id" AND s."status" IS NOT NULL
                ORDER BY s."createdAt" DESC LIMIT 1) AS "status"
         FROM ${t.proposals} p WHERE ${where}`,
      parameter,
    );
    if (rows.length === 0) return [];
    const responses = await this.prisma.$queryRawUnsafe<{ proposal: string; order: number; response: string }[]>(
      `SELECT "proposal"::text AS "proposal", "order", "response" FROM ${t.responses}
        WHERE "proposal" = ANY($1::uuid[]) ORDER BY "order"`,
      rows.map((row) => row.id),
    );
    return rows.map((row) => ({
      ...row,
      responses: responses.filter((response) => response.proposal === row.id).map(({ order, response }) => ({ order, response })),
    }));
  }
}

async function writeScores(
  tx: Prisma.TransactionClient,
  table: string,
  proposalId: string,
  evaluatorId: string,
  scores: readonly EnteredScore[],
  createdAt: Date,
  updatedAt: Date,
): Promise<void> {
  for (const entry of scores) {
    await tx.$executeRawUnsafe(
      `INSERT INTO ${table} ("proposal", "questionOrder", "evaluationPanelMember", "createdAt", "updatedAt", "score", "notes")
       VALUES ($1::uuid, $2::int, $3::uuid, $4::timestamptz, $5::timestamptz, $6::real, $7)`,
      proposalId,
      entry.order,
      evaluatorId,
      createdAt.toISOString(),
      updatedAt.toISOString(),
      scoreParameter(entry.score),
      entry.notes,
    );
  }
}

async function writeStatus(
  tx: Prisma.TransactionClient,
  table: string,
  proposalId: string,
  evaluatorId: string,
  status: EvaluationStatus,
  at: Date,
): Promise<void> {
  await tx.$executeRawUnsafe(
    `INSERT INTO ${table} ("proposal", "evaluationPanelMember", "status", "note", "createdAt")
     VALUES ($1::uuid, $2::uuid, $3, NULL, $4::timestamptz)`,
    proposalId,
    evaluatorId,
    status,
    at.toISOString(),
  );
}
