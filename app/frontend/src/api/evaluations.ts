import type { EnteredScore, EvaluationStatus } from "@rules/individual-evaluation";
import type { OtherProgram } from "@rules/other-program-drafts";
import { api } from "./client";
import type { Person } from "./opportunities";
import { reasonsIn } from "./opportunities";
import { OtherProgramSaveAnswer, readOtherProgramOpportunity } from "./other-programs";

/**
 * One evaluator's individual evaluation of one proponent (decision record 0062), as the service
 * answers with it. Answers are read defensively rather than trusted.
 */
export interface Evaluation {
  readonly proposal: { readonly id: string; readonly anonymousProponentName: string };
  readonly evaluator: Person;
  readonly status: EvaluationStatus;
  readonly scores: readonly EnteredScore[];
}

export type { Proponent } from "./other-programs";

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];

export function readEvaluation(value: unknown): Evaluation | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const proposal = record.proposal as Record<string, unknown> | null | undefined;
  const member = record.evaluationPanelMember as Record<string, unknown> | null | undefined;
  if (typeof proposal?.id !== "string" || typeof member?.id !== "string") return null;
  return {
    proposal: { id: proposal.id, anonymousProponentName: text(proposal.anonymousProponentName) },
    evaluator: { id: member.id, name: text(member.name) },
    status: record.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    scores: records(record.scores).map((score) => ({
      order: typeof score.order === "number" ? score.order : 0,
      score: typeof score.score === "number" ? score.score : null,
      notes: text(score.notes),
    })),
  };
}

/** The person's own evaluations across the opportunity's proponents; null when they cannot be read. */
export async function fetchOwnEvaluations(program: OtherProgram, opportunityId: string): Promise<Evaluation[] | null> {
  try {
    const params = { params: { path: { opportunityId } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/opportunity/sprint-with-us/{opportunityId}/team-questions/evaluations", params)
        : await api.GET("/api/opportunity/team-with-us/{opportunityId}/resource-questions/evaluations", params);
    if (!response.ok || !Array.isArray(data)) return null;
    return (data as unknown[]).map(readEvaluation).filter((evaluation): evaluation is Evaluation => evaluation !== null);
  } catch {
    return null;
  }
}

export type EvaluationAnswer =
  | { readonly kind: "found"; readonly evaluation: Evaluation }
  /** None there, or none this person may read: the same to a person (R-5.11). */
  | { readonly kind: "missing" }
  | { readonly kind: "failed" };

export async function fetchEvaluation(program: OtherProgram, proposalId: string, evaluatorId: string): Promise<EvaluationAnswer> {
  try {
    const params = { params: { path: { proposalId, id: evaluatorId } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/proposal/sprint-with-us/{proposalId}/team-questions/evaluations/{id}", params)
        : await api.GET("/api/proposal/team-with-us/{proposalId}/resource-questions/evaluations/{id}", params);
    if (response.status === 404 || response.status === 401) return { kind: "missing" };
    const evaluation = response.ok ? readEvaluation(data) : null;
    return evaluation ? { kind: "found", evaluation } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

export type EvaluationSaveAnswer =
  | { readonly kind: "saved"; readonly evaluation: Evaluation }
  /** The person already holds an evaluation of this proponent (R-5.3), in the service's words. */
  | { readonly kind: "duplicate"; readonly reason: string }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

async function saved(request: Promise<{ data?: unknown; error?: unknown; response: Response }>): Promise<EvaluationSaveAnswer> {
  try {
    const { data, error, response } = await request;
    if (response.ok) {
      const evaluation = readEvaluation(data);
      return evaluation ? { kind: "saved", evaluation } : { kind: "failed" };
    }
    const conflict = (error as { conflict?: unknown } | null)?.conflict;
    if (response.status === 409 && Array.isArray(conflict) && typeof conflict[0] === "string") return { kind: "duplicate", reason: conflict[0] };
    const reasons = reasonsIn(error);
    return reasons.length > 0 ? { kind: "refused", reasons } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

const scoresBody = (scores: readonly EnteredScore[]) => scores.map((entry) => ({ order: entry.order, score: entry.score, notes: entry.notes }));

/** Starts the person's draft of one proponent, kept as entered (R-5.23). */
export function startEvaluation(program: OtherProgram, proposalId: string, scores: readonly EnteredScore[]): Promise<EvaluationSaveAnswer> {
  const request = { params: { path: { proposalId } }, body: { proposal: proposalId, status: "DRAFT", scores: scoresBody(scores) } as never };
  return saved(
    program === "sprint-with-us"
      ? api.POST("/api/proposal/sprint-with-us/{proposalId}/team-questions/evaluations", request)
      : api.POST("/api/proposal/team-with-us/{proposalId}/resource-questions/evaluations", request),
  );
}

/** Saves the person's draft as entered (R-5.23, R-5.24). */
export function saveEvaluation(
  program: OtherProgram,
  proposalId: string,
  evaluatorId: string,
  scores: readonly EnteredScore[],
): Promise<EvaluationSaveAnswer> {
  const request = { params: { path: { proposalId, id: evaluatorId } }, body: { tag: "edit", value: { scores: scoresBody(scores) } } as never };
  return saved(
    program === "sprint-with-us"
      ? api.PUT("/api/proposal/sprint-with-us/{proposalId}/team-questions/evaluations/{id}", request)
      : api.PUT("/api/proposal/team-with-us/{proposalId}/resource-questions/evaluations/{id}", request),
  );
}

/** Submits the person's whole set for consensus (R-5.25, R-5.26); answers with the opportunity as it then stands. */
export async function submitEvaluations(program: OtherProgram, opportunityId: string): Promise<OtherProgramSaveAnswer> {
  try {
    const request = { params: { path: { id: opportunityId } }, body: { tag: "submitIndividualQuestionEvaluations" } as never };
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.PUT("/api/opportunities/sprint-with-us/{id}", request)
        : await api.PUT("/api/opportunities/team-with-us/{id}", request);
    if (response.ok) {
      const opportunity = readOtherProgramOpportunity(program, data);
      return opportunity ? { kind: "saved", opportunity } : { kind: "failed" };
    }
    const reasons = reasonsIn(error);
    return reasons.length > 0 ? { kind: "refused", reasons } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}
