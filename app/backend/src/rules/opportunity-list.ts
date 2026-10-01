/**
 * Finding opportunities and following them, as plain TypeScript (decision record 0001): how the
 * list groups, orders and narrows them, who may watch one, and what the counters are called.
 * The service and the single-page app both call these.
 */

import {
  CalendarDay,
  OpportunityStatus,
  OpportunityViewer,
  Program,
  isProgram,
  isUnpublished,
  recordedInstantOf,
} from "./opportunities";

// ------------------------------------------------------------------------ the three groups

/** The groups the list shows, in the order it shows them (R-1.38). */
export const LIST_GROUPS = ["unpublished", "open", "closed"] as const;
export type ListGroup = (typeof LIST_GROUPS)[number];

/** What grouping, ordering and narrowing turn on. */
export interface Listable {
  readonly program: Program;
  readonly status: OpportunityStatus;
  readonly title: string;
  readonly location: string;
  readonly remoteOk: boolean;
  /** A calendar day; proposals close at 4:00 p.m. Pacific time on it (R-1.14). */
  readonly proposalDeadline: CalendarDay;
  /** When its current version was saved: when it last changed. */
  readonly updatedAt: string;
}

function deadlineInstant(day: CalendarDay): number {
  try {
    return recordedInstantOf(day).getTime();
  } catch {
    return Number.NEGATIVE_INFINITY;
  }
}

/**
 * Which group an opportunity falls in (R-1.38). A draft or one under review is unpublished. One
 * is open only while it is published and its proposal deadline is still to come; everything else
 * — published and past its deadline, in evaluation, processing, awarded or cancelled — is closed.
 */
export function listGroupOf(opportunity: Pick<Listable, "status" | "proposalDeadline">, now: Date): ListGroup {
  if (isUnpublished(opportunity.status)) return "unpublished";
  if (opportunity.status === "PUBLISHED" && deadlineInstant(opportunity.proposalDeadline) > now.getTime()) return "open";
  return "closed";
}

/**
 * The order within a group (R-1.38): open ones with the nearest proposal deadline first, closed
 * ones most recently closed first, unpublished ones most recently changed first.
 */
export function inGroupOrder<T extends Pick<Listable, "proposalDeadline" | "updatedAt">>(group: ListGroup, items: readonly T[]): T[] {
  const sorted = [...items];
  if (group === "open") sorted.sort((a, b) => deadlineInstant(a.proposalDeadline) - deadlineInstant(b.proposalDeadline));
  else if (group === "closed") sorted.sort((a, b) => deadlineInstant(b.proposalDeadline) - deadlineInstant(a.proposalDeadline));
  else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sorted;
}

/** Every opportunity in exactly one group, each group in its order. */
export function groupedForList<T extends Listable>(items: readonly T[], now: Date): Record<ListGroup, T[]> {
  const groups: Record<ListGroup, T[]> = { unpublished: [], open: [], closed: [] };
  for (const item of items) groups[listGroupOf(item, now)].push(item);
  for (const group of LIST_GROUPS) groups[group] = inGroupOrder(group, groups[group]);
  return groups;
}

// ------------------------------------------------------------------------ narrowing the list

/**
 * The states the status filter offers (R-1.39): draft, under review, published, evaluation and
 * awarded. There is no option for processing or cancelled. "Evaluation" covers every program's
 * evaluation stages.
 */
export const STATUS_FILTERS = ["draft", "under-review", "published", "evaluation", "awarded"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_FILTER_LABELS: Readonly<Record<StatusFilter, string>> = {
  draft: "Draft",
  "under-review": "Under review",
  published: "Published",
  evaluation: "Evaluation",
  awarded: "Awarded",
};

const STATES_FILTERED: Readonly<Record<StatusFilter, readonly OpportunityStatus[]>> = {
  draft: ["DRAFT"],
  "under-review": ["UNDER_REVIEW"],
  published: ["PUBLISHED"],
  evaluation: ["EVALUATION", "EVAL_QUESTIONS_INDIVIDUAL", "EVAL_QUESTIONS_CONSENSUS", "EVAL_CC", "EVAL_SCENARIO", "EVAL_C"],
  awarded: ["AWARDED"],
};

/**
 * The status options a person is offered: the two unpublished ones only to those who can see an
 * unpublished opportunity at all, public sector staff and administrators (R-1.2, R-1.3).
 */
export function statusFiltersFor(viewer: Pick<OpportunityViewer, "type"> | null): readonly StatusFilter[] {
  const staff = viewer?.type === "GOV" || viewer?.type === "ADMIN";
  return staff ? STATUS_FILTERS : STATUS_FILTERS.filter((filter) => filter !== "draft" && filter !== "under-review");
}

/** What a person has chosen to narrow the list by; "all" chooses nothing. */
export interface ListFilters {
  readonly program: Program | "all";
  readonly status: StatusFilter | "all";
  readonly remoteOnly: boolean;
  readonly search: string;
}

export const NO_FILTERS: ListFilters = { program: "all", status: "all", remoteOnly: false, search: "" };

export function isStatusFilter(value: unknown): value is StatusFilter {
  return typeof value === "string" && (STATUS_FILTERS as readonly string[]).includes(value);
}

/**
 * Whether an opportunity meets every condition chosen (R-1.39): its program, its state, remote
 * work accepted, and the words typed found in its title or its location, ignoring case.
 */
export function matchesFilters(opportunity: Listable, filters: ListFilters): boolean {
  if (filters.program !== "all" && opportunity.program !== filters.program) return false;
  if (filters.status !== "all" && !STATES_FILTERED[filters.status].includes(opportunity.status)) return false;
  if (filters.remoteOnly && !opportunity.remoteOk) return false;
  const words = filters.search.trim().toLowerCase();
  if (words === "") return true;
  return opportunity.title.toLowerCase().includes(words) || opportunity.location.toLowerCase().includes(words);
}

// ------------------------------------------------------------------------ watching

/**
 * Anyone signed in may watch an opportunity they did not create (R-1.5). Watching needs an
 * account to record it on, so a visitor is offered nothing.
 */
export function mayWatch(viewer: OpportunityViewer | null, opportunity: { readonly createdBy: string | null }): boolean {
  return viewer !== null && opportunity.createdBy !== viewer.id;
}

export const SIGN_IN_TO_WATCH = "You must be signed in to watch an opportunity.";
export const NOT_YOUR_OWN = "You cannot subscribe to your own opportunity.";
export const ALREADY_WATCHING = "opportunity: You are already watching this opportunity.";
export const NOT_WATCHING = "opportunity: You are not watching this opportunity.";
export const NO_SUCH_OPPORTUNITY = "opportunity: No opportunity you may read is held at that identifier.";

// ------------------------------------------------------------------------ counters

/** What a counter counts: the times a public page was opened, or the people watching. */
export const COUNTER_KINDS = ["views", "watchers"] as const;
export type CounterKind = (typeof COUNTER_KINDS)[number];

/** A counter's name, `opportunity.<program>.<id>.<kind>` (observables: counters). */
export function counterName(program: Program, opportunityId: string, kind: CounterKind): string {
  return `opportunity.${program}.${opportunityId}.${kind}`;
}

export interface CounterAddress {
  readonly program: Program;
  readonly opportunityId: string;
  readonly kind: CounterKind;
}

const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What a counter's name addresses, or null when it is not one. "subscribers" is read as
 * "watchers", the old application's word for the same people.
 */
export function readCounterName(name: string): CounterAddress | null {
  const parts = name.split(".");
  if (parts.length !== 4 || parts[0] !== "opportunity") return null;
  const [, program, opportunityId, kind] = parts as [string, string, string, string];
  if (!isProgram(program) || !IDENTIFIER.test(opportunityId)) return null;
  const counted = kind === "subscribers" ? "watchers" : kind;
  if (!(COUNTER_KINDS as readonly string[]).includes(counted)) return null;
  return { program, opportunityId: opportunityId.toLowerCase(), kind: counted as CounterKind };
}
