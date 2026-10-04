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
export function submitEvaluations(program: OtherProgram, opportunityId: string): Promise<OtherProgramSaveAnswer> {
  return changeEvaluationStage(program, opportunityId, "submitIndividualQuestionEvaluations");
}

/** Every panel member's evaluation of one proponent that the person may read (R-5.28); none when there are none to read. */
export async function fetchProposalEvaluations(program: OtherProgram, proposalId: string): Promise<Evaluation[] | null> {
  try {
    const params = { params: { path: { proposalId } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/proposal/sprint-with-us/{proposalId}/team-questions/evaluations", params)
        : await api.GET("/api/proposal/team-with-us/{proposalId}/resource-questions/evaluations", params);
    if (response.status === 404 || response.status === 401) return [];
    if (!response.ok || !Array.isArray(data)) return null;
    return (data as unknown[]).map(readEvaluation).filter((evaluation): evaluation is Evaluation => evaluation !== null);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------ the consensus (decision record 0063)

/** A consensus is answered in the shape of an evaluation, the chair as its panel member. */
export type Consensus = Evaluation;

export type ConsensusListAnswer =
  | { readonly kind: "found"; readonly consensuses: readonly Consensus[] }
  /** The owner off the panel, while it is agreed (R-5.12): the service's reason. */
  | { readonly kind: "withheld"; readonly reason: string }
  | { readonly kind: "missing" }
  | { readonly kind: "failed" };

export async function fetchConsensuses(program: OtherProgram, opportunityId: string): Promise<ConsensusListAnswer> {
  try {
    const params = { params: { path: { opportunityId } } };
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/opportunity/sprint-with-us/{opportunityId}/team-questions/consensus", params)
        : await api.GET("/api/opportunity/team-with-us/{opportunityId}/resource-questions/consensus", params);
    if (response.status === 401) return { kind: "withheld", reason: reasonsIn(error).join(" ") };
    if (response.status === 404) return { kind: "missing" };
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    return { kind: "found", consensuses: (data as unknown[]).map(readEvaluation).filter((entry): entry is Consensus => entry !== null) };
  } catch {
    return { kind: "failed" };
  }
}

export async function fetchConsensus(program: OtherProgram, proposalId: string, chairId: string): Promise<EvaluationAnswer> {
  try {
    const params = { params: { path: { proposalId, id: chairId } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/proposal/sprint-with-us/{proposalId}/team-questions/consensus/{id}", params)
        : await api.GET("/api/proposal/team-with-us/{proposalId}/resource-questions/consensus/{id}", params);
    if (response.status === 404 || response.status === 401) return { kind: "missing" };
    const consensus = response.ok ? readEvaluation(data) : null;
    return consensus ? { kind: "found", evaluation: consensus } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

/** Starts the chair's draft consensus of one proponent, kept as entered. */
export function startConsensus(program: OtherProgram, proposalId: string, scores: readonly EnteredScore[]): Promise<EvaluationSaveAnswer> {
  const request = { params: { path: { proposalId } }, body: { proposal: proposalId, status: "DRAFT", scores: scoresBody(scores) } as never };
  return saved(
    program === "sprint-with-us"
      ? api.POST("/api/proposal/sprint-with-us/{proposalId}/team-questions/consensus", request)
      : api.POST("/api/proposal/team-with-us/{proposalId}/resource-questions/consensus", request),
  );
}

/** Saves the chair's agreed scores as entered; a submitted consensus stays submitted (R-5.30). */
export function saveConsensus(
  program: OtherProgram,
  proposalId: string,
  chairId: string,
  scores: readonly EnteredScore[],
): Promise<EvaluationSaveAnswer> {
  const request = { params: { path: { proposalId, id: chairId } }, body: { tag: "edit", value: { scores: scoresBody(scores) } } as never };
  return saved(
    program === "sprint-with-us"
      ? api.PUT("/api/proposal/sprint-with-us/{proposalId}/team-questions/consensus/{id}", request)
      : api.PUT("/api/proposal/team-with-us/{proposalId}/resource-questions/consensus/{id}", request),
  );
}

/** The chair submits the agreed scores of every proponent (R-5.31). */
export function submitConsensus(program: OtherProgram, opportunityId: string): Promise<OtherProgramSaveAnswer> {
  return changeEvaluationStage(program, opportunityId, "submitConsensusQuestionEvaluations");
}

/** The owner or an administrator finalises the consensus, the one way out of the stage (R-1.50, R-5.14). */
export function finalizeConsensus(program: OtherProgram, opportunityId: string): Promise<OtherProgramSaveAnswer> {
  return changeEvaluationStage(program, opportunityId, "finalizeQuestionConsensuses");
}

/**
 * The owner or an administrator moves a Sprint With Us opportunity from the code challenge to the
 * team scenario, once every proponent there is scored or disqualified and one is screened in (R-1.42).
 */
export function startTeamScenario(opportunityId: string): Promise<OtherProgramSaveAnswer> {
  return changeEvaluationStage("sprint-with-us", opportunityId, "startTeamScenario");
}

async function changeEvaluationStage(program: OtherProgram, opportunityId: string, tag: string): Promise<OtherProgramSaveAnswer> {
  try {
    const request = { params: { path: { id: opportunityId } }, body: { tag } as never };
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
