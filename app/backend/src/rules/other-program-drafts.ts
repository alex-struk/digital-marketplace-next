/**
 * Sprint With Us and Team With Us drafts, as plain TypeScript (decision record 0035): what a draft
 * of either program holds before slice 10 gives the programs their phases, resources, questions,
 * weights and panels, and how what was sent becomes what is kept. The service and the single-page
 * app both call these.
 */

import {
  CalendarDay,
  DRAFT_DATE_DAYS_AHEAD,
  OpportunityStatus,
  OpportunityViewer,
  addDays,
  calendarDayFrom,
  mayCreateInState,
  mayCreateOpportunity,
} from "./opportunities";

export type OtherProgram = "sprint-with-us" | "team-with-us";

export function isOtherProgram(value: unknown): value is OtherProgram {
  return value === "sprint-with-us" || value === "team-with-us";
}

/** The upper limit of a Sprint With Us total maximum budget (R-1.13). Team With Us has none. */
export const SWU_BUDGET_MAX = 5_000_000;

/** The content a draft of either program holds before slice 10. */
export interface OtherProgramDraft {
  readonly title: string;
  readonly teaser: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  /** The total maximum budget (Sprint With Us) or the maximum budget (Team With Us); 0 for none. */
  readonly budget: number;
  readonly description: string;
  readonly proposalDeadline: CalendarDay;
  readonly assignmentDate: CalendarDay;
  /** Team With Us only: the contract's start and completion dates. */
  readonly startDate: CalendarDay | null;
  readonly completionDate: CalendarDay | null;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const INT_MAX = 2_147_483_647;

function budgetFrom(value: unknown): number {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.replace(/[$,\s]/g, ""))
        : Number.NaN;
  return Number.isInteger(amount) && Math.abs(amount) <= INT_MAX ? amount : 0;
}

function remoteFrom(value: unknown): boolean {
  return value === true || value === "yes" || value === "true";
}

/**
 * A draft is kept with whatever it holds and is never refused for its content (R-1.9), in every
 * program. A proposal deadline or assignment date that is missing, or earlier than the date it
 * must follow, is set to fourteen days from the day of saving; so is a Team With Us start date. A
 * completion date that is missing or earlier than the start date is left empty. Sprint With Us
 * keeps its start and completion dates on its phases, so it has none of its own. The budget is
 * read from `totalMaxBudget` or `maxBudget`, whichever the program names it by.
 */
export function draftOf(program: OtherProgram, body: unknown, today: CalendarDay): OtherProgramDraft {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const fallback = addDays(today, DRAFT_DATE_DAYS_AHEAD);
  const valid = (value: unknown, earliest: CalendarDay): CalendarDay | null => {
    const day = calendarDayFrom(typeof value === "string" ? value.trim() : null);
    return day !== null && day >= earliest ? day : null;
  };
  const deadline = valid(record.proposalDeadline, today) ?? fallback;
  const assignment = valid(record.assignmentDate, deadline) ?? fallback;
  const start = program === "team-with-us" ? (valid(record.startDate, assignment) ?? fallback) : null;
  const completion = program === "team-with-us" ? valid(record.completionDate, start ?? today) : null;
  return {
    title: text(record.title),
    teaser: text(record.teaser),
    remoteOk: remoteFrom(record.remoteOk),
    remoteDesc: text(record.remoteDesc),
    location: text(record.location),
    budget: budgetFrom(program === "sprint-with-us" ? record.totalMaxBudget : record.maxBudget),
    description: text(record.description),
    proposalDeadline: deadline,
    assignmentDate: assignment,
    startDate: start,
    completionDate: completion,
  };
}

const CREATABLE: readonly OpportunityStatus[] = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"];

/** Why a creation was not accepted, and how the service answers it. */
export type CreationRefusal =
  | { readonly kind: "not-permitted" }
  | { readonly kind: "only-administrators-publish" }
  | { readonly kind: "unknown-state" }
  | { readonly kind: "not-yet-offered" };

/**
 * Whether a Sprint With Us or Team With Us opportunity may be created as asked. Only public sector
 * staff create one (R-1.7), and only an administrator creates one published (R-1.48). A draft is
 * accepted. Submitting for review or publishing needs the program's phases, resources, questions,
 * weights and panel, which slice 10 adds, so until then a permitted request for either is answered
 * as not yet offered (decision records 0030 and 0035).
 */
export function creationDecision(viewer: OpportunityViewer | null, body: unknown): "DRAFT" | CreationRefusal {
  if (!viewer || !mayCreateOpportunity(viewer)) return { kind: "not-permitted" };
  const requested = (body as { status?: unknown } | null)?.status ?? "DRAFT";
  if (!CREATABLE.includes(requested as OpportunityStatus)) return { kind: "unknown-state" };
  if (!mayCreateInState(viewer, requested as OpportunityStatus)) return { kind: "only-administrators-publish" };
  return requested === "DRAFT" ? "DRAFT" : { kind: "not-yet-offered" };
}

export const NOT_YET_OFFERED =
  "A Sprint With Us or Team With Us opportunity can be saved only as a draft in this version of the service.";
export const UNKNOWN_CREATION_STATE =
  "status: An opportunity is created as a draft (DRAFT), under review (UNDER_REVIEW) or published (PUBLISHED).";
