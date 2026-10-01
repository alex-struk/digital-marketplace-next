import type { OtherProgram } from "@rules/other-program-drafts";
import { ListedOpportunity, readListedOpportunity } from "./opportunity-list";
import { api } from "./client";
import { reasonsIn } from "./opportunities";

/**
 * A Sprint With Us or Team With Us opportunity until slice 10: saved as a draft from the fields
 * every program shares, and read back as the list reads it with its dates (decision record 0035).
 */
export interface OtherProgramOpportunity extends ListedOpportunity {
  readonly updatedBy?: { readonly id: string; readonly name: string } | null;
  readonly assignmentDate: string;
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
}

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
  };
}

/** The request's body: the budget under the program's own name, and only the dates the program has. */
export function bodyOf(program: OtherProgram, submission: OtherProgramSubmission, status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED") {
  const budget = Number.isNaN(submission.budget) ? null : submission.budget;
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
  };
  return program === "sprint-with-us"
    ? { ...common, totalMaxBudget: budget }
    : { ...common, maxBudget: budget, startDate: submission.startDate, completionDate: submission.completionDate };
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
