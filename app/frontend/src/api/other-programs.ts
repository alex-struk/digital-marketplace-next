import type { OtherProgram, SwuPhase } from "@rules/other-program-drafts";
import { ListedOpportunity, readListedOpportunity } from "./opportunity-list";
import { api } from "./client";
import {
  Addendum,
  HistoryEntry,
  Reporting,
  RunningAction,
  readAddenda,
  readHistory,
  readReporting,
  reasonsIn,
  runningBody,
} from "./opportunities";

/**
 * A Sprint With Us or Team With Us opportunity until slice 10: created from what its interim
 * create screen offers — the fields every program shares and the program's own phases or
 * resources, questions, weights and panel — and read back as the list reads it with its dates
 * (decision records 0035 and 0036).
 */
export interface OtherProgramOpportunity extends ListedOpportunity {
  readonly updatedBy?: { readonly id: string; readonly name: string } | null;
  readonly assignmentDate: string;
  /** Every addendum, oldest first (R-1.32). */
  readonly addenda: readonly Addendum[];
  /** The author and administrators only (R-1.30). */
  readonly history?: readonly HistoryEntry[];
  /** The author and administrators only, once it has been published (R-1.30). */
  readonly reporting?: Reporting;
}

/** A phase's dates as entered; Sprint With Us. */
export interface PhaseEntry {
  readonly startDate: string;
  readonly completionDate: string;
}

/** One evaluation question as entered; a number is NaN while nothing is entered. */
export interface QuestionEntry {
  readonly question: string;
  readonly guideline: string;
  readonly score: number;
  readonly minimumScore: number;
  readonly wordLimit: number;
}

/** One Team With Us resource as entered: a service area's key, or "" while none is chosen. */
export interface ResourceEntry {
  readonly serviceArea: string;
  readonly targetAllocation: number;
}

/** One evaluation panel member as entered: an account's identifier, or "" while none is chosen. */
export interface PanelEntry {
  readonly user: string;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

/** What the interim create form sends. */
export interface OtherProgramSubmission {
  readonly title: string;
  readonly teaser: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  /** NaN while nothing is entered. */
  readonly budget: number;
  readonly description: string;
  readonly proposalDeadline: string;
  readonly assignmentDate: string;
  /** Team With Us only. */
  readonly startDate: string;
  readonly completionDate: string;
  /** Sprint With Us only. */
  readonly skills: readonly string[];
  readonly phases: Readonly<Partial<Record<SwuPhase, PhaseEntry>>>;
  /** Team questions (Sprint With Us) or resource questions (Team With Us). */
  readonly questions: readonly QuestionEntry[];
  /** Team With Us only. */
  readonly resources: readonly ResourceEntry[];
  /** Whole percentages by the program's own weight names (questions, codeChallenge, scenario, challenge, price). */
  readonly weights: Readonly<Record<string, number>>;
  readonly panel: readonly PanelEntry[];
}

const numberOrNull = (value: number): number | null => (Number.isNaN(value) ? null : value);

export function readOtherProgramOpportunity(program: OtherProgram, value: unknown): OtherProgramOpportunity | null {
  const listed = readListedOpportunity(program, value);
  if (!listed) return null;
  const record = value as Record<string, unknown>;
  const updatedBy = record.updatedBy as { id?: unknown; name?: unknown } | null | undefined;
  return {
    ...listed,
    ...("updatedBy" in record
      ? { updatedBy: updatedBy && typeof updatedBy.id === "string" && typeof updatedBy.name === "string" ? { id: updatedBy.id, name: updatedBy.name } : null }
      : {}),
    assignmentDate: typeof record.assignmentDate === "string" ? record.assignmentDate : "",
    addenda: readAddenda(record.addenda),
    ...("history" in record ? { history: readHistory(record.history) } : {}),
    ...(readReporting(record.reporting) ? { reporting: readReporting(record.reporting)! } : {}),
  };
}

/** Cancelling, an addendum or, for Sprint With Us, a private note (decision record 0043). */
export async function runOtherProgramOpportunity(
  program: OtherProgram,
  id: string,
  action: RunningAction,
): Promise<OtherProgramSaveAnswer> {
  try {
    const request = { params: { path: { id } }, body: runningBody(action) as never };
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

/**
 * The request's body, named as the old service named it: the budget, the questions and the weights
 * under the program's own names, only the dates the program has, and a panel member or resource
 * only once something is chosen for it.
 */
export function bodyOf(program: OtherProgram, submission: OtherProgramSubmission, status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED") {
  const budget = numberOrNull(submission.budget);
  const weight = (name: string) => numberOrNull(submission.weights[name] ?? Number.NaN);
  const questions = submission.questions.map((question) => ({
    question: question.question,
    guideline: question.guideline,
    score: numberOrNull(question.score),
    minimumScore: numberOrNull(question.minimumScore),
    wordLimit: numberOrNull(question.wordLimit),
  }));
  const common = {
    status,
    title: submission.title,
    teaser: submission.teaser,
    remoteOk: submission.remoteOk,
    remoteDesc: submission.remoteDesc,
    location: submission.location,
    description: submission.description,
    proposalDeadline: submission.proposalDeadline,
    assignmentDate: submission.assignmentDate,
    questionsWeight: weight("questions"),
    priceWeight: weight("price"),
    evaluationPanel: submission.panel.filter((member) => member.user !== ""),
  };
  if (program === "sprint-with-us") {
    const { INCEPTION, PROTOTYPE, IMPLEMENTATION } = submission.phases;
    return {
      ...common,
      totalMaxBudget: budget,
      mandatorySkills: submission.skills,
      ...(INCEPTION ? { inceptionPhase: INCEPTION } : {}),
      ...(PROTOTYPE ? { prototypePhase: PROTOTYPE } : {}),
      implementationPhase: IMPLEMENTATION ?? { startDate: "", completionDate: "" },
      teamQuestions: questions,
      codeChallengeWeight: weight("codeChallenge"),
      scenarioWeight: weight("scenario"),
    };
  }
  return {
    ...common,
    maxBudget: budget,
    startDate: submission.startDate,
    completionDate: submission.completionDate,
    resources: submission.resources
      .filter((resource) => resource.serviceArea !== "")
      .map((resource) => ({ serviceArea: resource.serviceArea, targetAllocation: numberOrNull(resource.targetAllocation) })),
    resourceQuestions: questions,
    challengeWeight: weight("challenge"),
  };
}

export type OtherProgramSaveAnswer =
  | { readonly kind: "saved"; readonly opportunity: OtherProgramOpportunity }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

export async function createOtherProgramOpportunity(
  program: OtherProgram,
  submission: OtherProgramSubmission,
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED",
): Promise<OtherProgramSaveAnswer> {
  try {
    const body = bodyOf(program, submission, status) as never;
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.POST("/api/opportunities/sprint-with-us", { body })
        : await api.POST("/api/opportunities/team-with-us", { body });
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

export type OtherProgramAnswer =
  | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity }
  | { readonly kind: "missing" };

export async function fetchOtherProgramOpportunity(program: OtherProgram, id: string): Promise<OtherProgramAnswer> {
  try {
    const params = { params: { path: { id } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/opportunities/sprint-with-us/{id}", params)
        : await api.GET("/api/opportunities/team-with-us/{id}", params);
    const opportunity = response.ok ? readOtherProgramOpportunity(program, data) : null;
    return opportunity ? { kind: "found", opportunity } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
}
