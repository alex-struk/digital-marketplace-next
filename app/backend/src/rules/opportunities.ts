/**
 * Rules about opportunities, as plain TypeScript.
 *
 * Nothing in this directory imports NestJS, Prisma or Node. The service and the single-page app
 * both call these functions, so a form says the same thing about an opportunity as the service
 * that refuses it (decision record 0001).
 */

import type { AccountKind } from "./users";

// ------------------------------------------------------------------------ programs and states

/** The three procurement programs; an opportunity belongs to one for good (R-1.8). */
export const PROGRAMS = ["code-with-us", "sprint-with-us", "team-with-us"] as const;
export type Program = (typeof PROGRAMS)[number];

export const PROGRAM_NAMES: Readonly<Record<Program, string>> = {
  "code-with-us": "Code With Us",
  "sprint-with-us": "Sprint With Us",
  "team-with-us": "Team With Us",
};

export function isProgram(value: unknown): value is Program {
  return typeof value === "string" && (PROGRAMS as readonly string[]).includes(value);
}

/**
 * The states each program's opportunities may hold, in the order an opportunity passes through
 * them (R-1.19). Draft, under review and published come first; then the program's own evaluation
 * stages — one for Code With Us, four for Sprint With Us, three for Team With Us — then processing,
 * and finally awarded or cancelled. "Suspended" is not among them: the rebuilt service defines no
 * such state, and a stored one is mapped away before it is read (R-1.51).
 */
export const OPPORTUNITY_STATES = {
  "code-with-us": ["DRAFT", "UNDER_REVIEW", "PUBLISHED", "EVALUATION", "PROCESSING", "AWARDED", "CANCELED"],
  "sprint-with-us": [
    "DRAFT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "EVAL_QUESTIONS_INDIVIDUAL",
    "EVAL_QUESTIONS_CONSENSUS",
    "EVAL_CC",
    "EVAL_SCENARIO",
    "PROCESSING",
    "AWARDED",
    "CANCELED",
  ],
  "team-with-us": [
    "DRAFT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "EVAL_QUESTIONS_INDIVIDUAL",
    "EVAL_QUESTIONS_CONSENSUS",
    "EVAL_C",
    "PROCESSING",
    "AWARDED",
    "CANCELED",
  ],
} as const;

export type CwuStatus = (typeof OPPORTUNITY_STATES)["code-with-us"][number];
export type SwuStatus = (typeof OPPORTUNITY_STATES)["sprint-with-us"][number];
export type TwuStatus = (typeof OPPORTUNITY_STATES)["team-with-us"][number];
export type OpportunityStatus = CwuStatus | SwuStatus | TwuStatus;

export function isStatusOf(program: Program, value: unknown): value is OpportunityStatus {
  return typeof value === "string" && (OPPORTUNITY_STATES[program] as readonly string[]).includes(value);
}

/** The two states an opportunity can never leave (R-1.20 note). */
export const FINAL_STATES: readonly OpportunityStatus[] = ["AWARDED", "CANCELED"];

/** The states in which an opportunity has not yet been published, and nobody but its staff sees it. */
export const UNPUBLISHED_STATES: readonly OpportunityStatus[] = ["DRAFT", "UNDER_REVIEW"];

export function isUnpublished(status: OpportunityStatus): boolean {
  return UNPUBLISHED_STATES.includes(status);
}

/**
 * The state changes each program permits (R-1.20, R-1.49). A draft may go for review or straight
 * to publication; under review may only be published; published and each evaluation stage may go
 * on to the next stage or be cancelled; processing may be awarded or cancelled — in all three
 * programs alike, Team With Us included; awarded and cancelled are final.
 */
function pathOf(states: readonly OpportunityStatus[]): Readonly<Record<string, readonly OpportunityStatus[]>> {
  const table: Record<string, OpportunityStatus[]> = {
    DRAFT: ["UNDER_REVIEW", "PUBLISHED"],
    UNDER_REVIEW: ["PUBLISHED"],
    AWARDED: [],
    CANCELED: [],
  };
  // Published, then each evaluation stage, then processing: each to the next, or cancelled.
  const from = states.indexOf("PUBLISHED");
  const to = states.indexOf("PROCESSING");
  for (let index = from; index < to; index += 1) {
    table[states[index] as string] = [states[index + 1] as OpportunityStatus, "CANCELED"];
  }
  table.PROCESSING = ["AWARDED", "CANCELED"];
  return table;
}

export const PERMITTED_TRANSITIONS: Readonly<Record<Program, Readonly<Record<string, readonly OpportunityStatus[]>>>> = {
  "code-with-us": pathOf(OPPORTUNITY_STATES["code-with-us"]),
  "sprint-with-us": pathOf(OPPORTUNITY_STATES["sprint-with-us"]),
  "team-with-us": pathOf(OPPORTUNITY_STATES["team-with-us"]),
};

/** Whether an opportunity of a program may move from one state to another (R-1.20). */
export function isPermittedTransition(program: Program, from: string, to: string): boolean {
  return (PERMITTED_TRANSITIONS[program][from] ?? []).includes(to as OpportunityStatus);
}

/** The refusal of a state change the program's path does not permit (R-1.20). */
export function transitionRefusal(from: OpportunityStatus, to: OpportunityStatus): string {
  return `An opportunity that is ${STATUS_LABELS[from].toLowerCase()} cannot be made ${STATUS_LABELS[to].toLowerCase()}.`;
}

/** Each state in words, as the status badge shows it. */
export const STATUS_LABELS: Readonly<Record<OpportunityStatus, string>> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  PUBLISHED: "Published",
  EVALUATION: "Evaluation",
  EVAL_QUESTIONS_INDIVIDUAL: "Questions: individual evaluation",
  EVAL_QUESTIONS_CONSENSUS: "Questions: consensus",
  EVAL_CC: "Code challenge",
  EVAL_SCENARIO: "Team scenario",
  EVAL_C: "Challenge",
  PROCESSING: "Processing",
  AWARDED: "Awarded",
  CANCELED: "Cancelled",
};

/** What the history records for an event that is not a change of state. */
export const OPPORTUNITY_EVENTS = ["EDITED", "ADDENDUM_ADDED", "NOTE_ADDED"] as const;
export type OpportunityEvent = (typeof OPPORTUNITY_EVENTS)[number];

export const EVENT_LABELS: Readonly<Record<OpportunityEvent, string>> = {
  EDITED: "Edited",
  ADDENDUM_ADDED: "Addendum added",
  NOTE_ADDED: "Note",
};

/** How one history entry reads: the state it moved to, or the event it records. */
export function historyEntryLabel(entry: { status: string | null; event: string | null }): string {
  if (entry.status && entry.status in STATUS_LABELS) {
    const label = STATUS_LABELS[entry.status as OpportunityStatus];
    return entry.status === "UNDER_REVIEW" ? "Submitted for review" : label;
  }
  if (entry.event && entry.event in EVENT_LABELS) return EVENT_LABELS[entry.event as OpportunityEvent];
  return entry.event ?? entry.status ?? "";
}

// ------------------------------------------------------------------------ who may do what

export interface OpportunityViewer {
  readonly id: string;
  readonly type: AccountKind;
}

/** Who created an opportunity, and what state it is in: what each permission turns on. */
export interface OpportunityStanding {
  readonly status: OpportunityStatus;
  readonly createdBy: string | null;
}

const isAdministrator = (viewer: OpportunityViewer | null): boolean => viewer?.type === "ADMIN";
const isStaff = (viewer: OpportunityViewer | null): boolean => viewer?.type === "GOV" || viewer?.type === "ADMIN";
const isAuthor = (viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean =>
  viewer !== null && opportunity.createdBy !== null && opportunity.createdBy === viewer.id;

/** Only signed-in public sector staff and administrators create opportunities (R-1.7). */
export function mayCreateOpportunity(viewer: OpportunityViewer | null): boolean {
  return isStaff(viewer);
}

/**
 * The states an opportunity may be created in: a draft or under review by any member of staff,
 * and published only by an administrator, in all three programs (R-1.48).
 */
export function mayCreateInState(viewer: OpportunityViewer | null, status: OpportunityStatus): boolean {
  if (!mayCreateOpportunity(viewer)) return false;
  if (status === "DRAFT" || status === "UNDER_REVIEW") return true;
  return status === "PUBLISHED" && isAdministrator(viewer);
}

/**
 * Who may read an opportunity: anyone once it is published, and before then only the member of
 * staff who created it and administrators (R-1.2, R-1.3).
 */
export function mayReadOpportunity(viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean {
  if (!isUnpublished(opportunity.status)) return true;
  return isAdministrator(viewer) || (isStaff(viewer) && isAuthor(viewer, opportunity));
}

/** The management screen and the full history: the author and administrators (R-1.30). */
export function mayManageOpportunity(viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean {
  return isAdministrator(viewer) || (isStaff(viewer) && isAuthor(viewer, opportunity));
}

/**
 * Who may change an opportunity's details. Before publication, its author and administrators;
 * once it is published, administrators alone, in all three programs (R-1.56). An awarded or
 * cancelled opportunity is changed by nobody.
 */
export function mayEditOpportunity(viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean {
  if (FINAL_STATES.includes(opportunity.status)) return false;
  if (isAdministrator(viewer)) return true;
  return isUnpublished(opportunity.status) && isStaff(viewer) && isAuthor(viewer, opportunity);
}

/** A draft goes for review at its author's or an administrator's asking (R-1.21, R-1.37). */
export function maySubmitForReview(viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean {
  return isAdministrator(viewer) || (isStaff(viewer) && isAuthor(viewer, opportunity));
}

/** Only an administrator publishes an opportunity (R-1.22). */
export function mayPublishOpportunity(viewer: OpportunityViewer | null): boolean {
  return isAdministrator(viewer);
}

/**
 * Deleting: an administrator may delete an opportunity in draft or under review, and the member
 * of staff who created it only while it is a draft, in all three programs alike. Nobody deletes
 * one that has been published (R-1.53).
 */
export function mayDeleteOpportunity(viewer: OpportunityViewer | null, opportunity: OpportunityStanding): boolean {
  if (isAdministrator(viewer)) return isUnpublished(opportunity.status);
  return opportunity.status === "DRAFT" && isStaff(viewer) && isAuthor(viewer, opportunity);
}

/**
 * The names of who created and who last changed an opportunity are shown only to an
 * administrator and to those two people (R-1.29).
 */
export function maySeeAuthorship(
  viewer: OpportunityViewer | null,
  people: { readonly createdBy: string | null; readonly updatedBy: string | null },
): boolean {
  if (!viewer) return false;
  return isAdministrator(viewer) || viewer.id === people.createdBy || viewer.id === people.updatedBy;
}

export const NOT_PERMITTED_TO_CREATE = "Only public sector employees may create opportunities.";
export const ONLY_ADMINISTRATORS_PUBLISH = "Only an administrator may publish an opportunity.";
export const NOT_PERMITTED_TO_EDIT = "You are not permitted to change this opportunity.";
export const NOT_PERMITTED_TO_DELETE =
  "This opportunity cannot be deleted. Only a draft can be deleted by its author, and a draft or an opportunity under review by an administrator.";
export const NOT_PERMITTED_TO_SUBMIT = "You are not permitted to submit this opportunity for review.";
export const NO_OPPORTUNITY_THERE = "No opportunity is held at that address.";

/** The refusal of submitting an incomplete draft for review: it says so, and not which field (R-1.21). */
export const OPPORTUNITY_INCOMPLETE =
  "This opportunity is incomplete. Please edit the opportunity, complete and save the form, and then submit it again.";

// ------------------------------------------------------------------------ dates

/**
 * Every opportunity date is a calendar day, recorded as 4:00 p.m. Pacific time on that day
 * (R-1.14), and every "today" is today in Pacific time.
 */
export const OPPORTUNITY_TIME_ZONE = "America/Vancouver";
export const OPPORTUNITY_HOUR = 16;

/** A calendar day, written YYYY-MM-DD. */
export type CalendarDay = string;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether a value is a real calendar day written YYYY-MM-DD. */
export function isCalendarDay(value: unknown): value is CalendarDay {
  if (typeof value !== "string") return false;
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function partsIn(instant: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const found: Record<string, number> = {};
  for (const part of parts) if (part.type !== "literal") found[part.type] = Number(part.value);
  return found;
}

/** How far a zone is from UTC at an instant, in minutes (negative west of Greenwich). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const p = partsIn(instant, timeZone);
  const asUtc = Date.UTC(p.year ?? 0, (p.month ?? 1) - 1, p.day ?? 1, p.hour ?? 0, p.minute ?? 0, p.second ?? 0);
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** The calendar day an instant falls on in Pacific time. */
export function pacificDayOf(instant: Date): CalendarDay {
  const p = partsIn(instant, OPPORTUNITY_TIME_ZONE);
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** The instant an opportunity date is recorded as: 4:00 p.m. Pacific time on the day (R-1.14). */
export function recordedInstantOf(day: CalendarDay): Date {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new Error(`Not a calendar day: ${day}`);
  const local = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), OPPORTUNITY_HOUR, 0, 0);
  let instant = local - offsetMinutes(new Date(local), OPPORTUNITY_TIME_ZONE) * 60_000;
  // Near a change of clocks the first guess can be an hour out; the offset at the guess settles it.
  instant = local - offsetMinutes(new Date(instant), OPPORTUNITY_TIME_ZONE) * 60_000;
  return new Date(instant);
}

/** A day so many days after another. */
export function addDays(day: CalendarDay, days: number): CalendarDay {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new Error(`Not a calendar day: ${day}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return date.toISOString().slice(0, 10);
}

/**
 * The calendar day a submitted date names, or null when it names none. A day written YYYY-MM-DD
 * is that day; a full timestamp is the Pacific day it falls on.
 */
export function calendarDayFrom(value: unknown): CalendarDay | null {
  if (isCalendarDay(value)) return value;
  // A day written YYYY-MM-DD that is not a real day names none, rather than a day near it.
  if (typeof value !== "string" || value.trim() === "" || DAY_PATTERN.test(value)) return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : pacificDayOf(instant);
}

/** How many days after the day of saving a missing draft date is set to (R-1.9). */
export const DRAFT_DATE_DAYS_AHEAD = 14;

// ------------------------------------------------------------------------ Code With Us content

export const TITLE_MAX = 200;
export const TEASER_MAX = 500;
export const REMOTE_DESC_MAX = 500;
export const DESCRIPTION_MAX = 10_000;
export const LOCATION_MAX = 200;
export const SKILL_MAX = 100;
export const CWU_REWARD_MIN = 1;
export const CWU_REWARD_MAX = 70_000;

/** The skills the Code With Us form offers. The service accepts any skill named in words (R-1.12). */
export const CWU_SKILLS: readonly string[] = [
  "Accessibility",
  "Agile Coaching",
  "Backend Development",
  "Business Analysis",
  "Cloud Infrastructure",
  "Data Science",
  "Database Administration",
  "Delivery Management",
  "DevOps Engineering",
  "Frontend Development",
  "Mobile Development",
  "Quality Assurance",
  "Security Engineering",
  "Technical Architecture",
  "Technical Writing",
  "User Experience Design",
  "User Research",
];

/** A Code With Us opportunity's content, as a form or a request carries it. */
export interface CwuInput {
  readonly title: string;
  readonly teaser: string;
  /** Null while the question has not been answered. */
  readonly remoteOk: boolean | null;
  readonly remoteDesc: string;
  readonly location: string;
  /** Null while no reward has been entered. */
  readonly reward: number | null;
  readonly skills: readonly string[];
  readonly description: string;
  /** Each date as the submission gave it: a calendar day, a timestamp, or nothing. */
  readonly proposalDeadline: string | null;
  readonly assignmentDate: string | null;
  readonly startDate: string | null;
  readonly completionDate: string | null;
  readonly submissionInfo: string;
  readonly acceptanceCriteria: string;
  readonly evaluationCriteria: string;
  /** The stored files attached, by identifier. */
  readonly attachments: readonly string[];
}

/** The content as it is stored: every date resolved to a calendar day (R-1.9, R-1.14). */
export interface CwuContent {
  readonly title: string;
  readonly teaser: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  readonly reward: number;
  readonly skills: readonly string[];
  readonly description: string;
  readonly proposalDeadline: CalendarDay;
  readonly assignmentDate: CalendarDay;
  readonly startDate: CalendarDay;
  readonly completionDate: CalendarDay | null;
  readonly submissionInfo: string;
  readonly acceptanceCriteria: string;
  readonly evaluationCriteria: string;
  readonly attachments: readonly string[];
}

export type CwuField = Exclude<keyof CwuInput, "submissionInfo" | "acceptanceCriteria" | "evaluationCriteria">;

/** Each field in words, as the form labels it. */
export const CWU_FIELD_LABELS: Readonly<Record<CwuField, string>> = {
  title: "Title",
  teaser: "Teaser",
  remoteOk: "Is remote work acceptable?",
  remoteDesc: "Remote work description",
  location: "Location",
  reward: "Reward",
  skills: "Skills",
  description: "Description",
  proposalDeadline: "Proposal deadline",
  assignmentDate: "Assignment date",
  startDate: "Start date",
  completionDate: "Completion date",
  attachments: "Attachments",
};

export interface CwuProblem {
  readonly field: CwuField;
  readonly message: string;
}

/** A refusal line names the field it is about by its name in the request (R-1.10). */
export function cwuRefusalLine(problem: CwuProblem): string {
  return `${problem.field}: ${problem.message}`;
}

/** Reads a refusal line back into the field it names, for a screen showing the service's refusal. */
export function cwuProblemFromLine(line: string): CwuProblem | null {
  const colon = line.indexOf(": ");
  if (colon < 0) return null;
  const field = line.slice(0, colon);
  return field in CWU_FIELD_LABELS ? { field: field as CwuField, message: line.slice(colon + 2) } : null;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const dateText = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

function rewardFrom(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function remoteFrom(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "yes" || value === "true") return true;
  if (value === "no" || value === "false") return false;
  return null;
}

/** An attachment named by its identifier, or by a file record carrying one. */
function attachmentIdOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

/**
 * The skills named, trimmed, with blanks dropped and duplicates collapsed rather than refused
 * (R-1.12 note).
 */
export function skillsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const kept: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const skill = entry.trim();
    if (skill !== "" && !kept.includes(skill)) kept.push(skill);
  }
  return kept;
}

/** Reads a submission's content loosely; what it says is judged afterwards. */
export function readCwuInput(body: unknown): CwuInput {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const attachments = Array.isArray(record.attachments)
    ? record.attachments.map(attachmentIdOf).filter((id): id is string => id !== null)
    : [];
  return {
    title: text(record.title),
    teaser: text(record.teaser),
    remoteOk: remoteFrom(record.remoteOk),
    remoteDesc: text(record.remoteDesc),
    location: text(record.location),
    reward: rewardFrom(record.reward),
    skills: skillsFrom(record.skills),
    description: text(record.description),
    proposalDeadline: dateText(record.proposalDeadline),
    assignmentDate: dateText(record.assignmentDate),
    startDate: dateText(record.startDate),
    completionDate: dateText(record.completionDate),
    submissionInfo: text(record.submissionInfo),
    acceptanceCriteria: text(record.acceptanceCriteria),
    evaluationCriteria: text(record.evaluationCriteria),
    attachments: [...new Set(attachments.map((id) => id.toLowerCase()))],
  };
}

/** The content as stored, read back as a submission would carry it. */
export function inputFromContent(content: CwuContent): CwuInput {
  return { ...content };
}

const formatDollars = (amount: number) => `$${amount.toLocaleString("en-CA")}`;

/**
 * Whether the content of a Code With Us opportunity that is not a draft may stand: a title,
 * teaser, location and description within their limits (R-1.10), an answer about remote work and
 * a description of it when it is acceptable (R-1.11), a reward of $1 to $70,000 and at least one
 * skill (R-1.12), and dates that run in order from no earlier than `earliestDeadline` (R-1.14).
 * Every problem is named against its field.
 *
 * `earliestDeadline` is today, except when an already-published opportunity whose deadline has
 * passed is changed: then it is that deadline, so its dates are not forced forward (R-1.14 note).
 */
export function cwuProblems(input: CwuInput, earliestDeadline: CalendarDay): CwuProblem[] {
  const problems: CwuProblem[] = [];
  const add = (field: CwuField, message: string) => problems.push({ field, message });

  const title = input.title.trim();
  if (title === "") add("title", "Enter a title.");
  else if (input.title.length > TITLE_MAX) add("title", `Enter a title of up to ${TITLE_MAX} characters.`);

  if (input.teaser.length > TEASER_MAX) add("teaser", `Enter a teaser of up to ${TEASER_MAX} characters.`);

  if (input.location.trim() === "") add("location", "Enter a location.");
  else if (input.location.length > LOCATION_MAX) add("location", `Enter a location of up to ${LOCATION_MAX} characters.`);

  if (input.remoteOk === null) add("remoteOk", "Say whether remote work is acceptable.");
  if (input.remoteDesc.length > REMOTE_DESC_MAX) {
    add("remoteDesc", `Enter a remote work description of up to ${REMOTE_DESC_MAX} characters.`);
  } else if (input.remoteOk === true && input.remoteDesc.trim() === "") {
    add("remoteDesc", "Describe the remote work, because remote work is acceptable.");
  }

  const reward = input.reward;
  if (reward === null || !Number.isInteger(reward) || reward < CWU_REWARD_MIN || reward > CWU_REWARD_MAX) {
    add("reward", `Enter a reward between ${formatDollars(CWU_REWARD_MIN)} and ${formatDollars(CWU_REWARD_MAX)}, in whole dollars.`);
  }

  if (input.skills.length === 0) add("skills", "Choose at least one skill.");
  else if (input.skills.some((skill) => skill.length > SKILL_MAX)) {
    add("skills", `Name each skill in up to ${SKILL_MAX} characters.`);
  }

  if (input.description.trim() === "") add("description", "Enter a description.");
  else if (input.description.length > DESCRIPTION_MAX) {
    add("description", `Enter a description of up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`);
  }

  const deadline = calendarDayFrom(input.proposalDeadline);
  const assignment = calendarDayFrom(input.assignmentDate);
  const start = calendarDayFrom(input.startDate);
  const completion = calendarDayFrom(input.completionDate);
  if (!deadline) add("proposalDeadline", "Choose a proposal deadline.");
  else if (deadline < earliestDeadline) add("proposalDeadline", "The proposal deadline cannot be before today.");
  if (!assignment) add("assignmentDate", "Choose an assignment date.");
  else if (deadline && assignment < deadline) add("assignmentDate", "The assignment date cannot be before the proposal deadline.");
  if (!start) add("startDate", "Choose a start date.");
  else if (assignment && start < assignment) add("startDate", "The start date cannot be before the assignment date.");
  if (input.completionDate !== null && !completion) add("completionDate", "Choose a completion date, or leave it empty.");
  else if (completion && start && completion < start) add("completionDate", "The completion date cannot be before the start date.");

  return problems;
}

/** The content of a complete opportunity, once `cwuProblems` has found nothing wrong with it. */
export function completeCwuContent(input: CwuInput): CwuContent {
  return {
    ...input,
    title: input.title.trim(),
    remoteOk: input.remoteOk === true,
    reward: input.reward ?? 0,
    proposalDeadline: calendarDayFrom(input.proposalDeadline) as CalendarDay,
    assignmentDate: calendarDayFrom(input.assignmentDate) as CalendarDay,
    startDate: calendarDayFrom(input.startDate) as CalendarDay,
    completionDate: calendarDayFrom(input.completionDate),
  };
}

const INT_MAX = 2_147_483_647;

/**
 * A draft is stored with whatever it holds and is never refused for its content (R-1.9). A
 * proposal deadline, assignment date or start date that is missing, or earlier than the date it
 * must follow, is set to fourteen days from the day of saving; a completion date that is missing
 * or earlier than the start date is left empty. What is not given becomes empty, and a reward
 * that is not a whole number the store can hold becomes none.
 */
export function draftCwuContent(input: CwuInput, today: CalendarDay): CwuContent {
  const fallback = addDays(today, DRAFT_DATE_DAYS_AHEAD);
  const valid = (value: string | null, earliest: CalendarDay): CalendarDay | null => {
    const day = calendarDayFrom(value);
    return day !== null && day >= earliest ? day : null;
  };
  const deadline = valid(input.proposalDeadline, today);
  const assignment = valid(input.assignmentDate, deadline ?? today);
  const start = valid(input.startDate, assignment ?? today);
  const completion = valid(input.completionDate, start ?? today);
  const reward = input.reward;
  return {
    ...input,
    remoteOk: input.remoteOk === true,
    reward: reward !== null && Number.isInteger(reward) && Math.abs(reward) <= INT_MAX ? reward : 0,
    proposalDeadline: deadline ?? fallback,
    assignmentDate: assignment ?? fallback,
    startDate: start ?? fallback,
    completionDate: completion,
  };
}

/**
 * Whether a stored draft is complete enough to go for review or be published. The person is told
 * only that it is incomplete, not which field (R-1.21).
 */
export function isCwuComplete(content: CwuContent, today: CalendarDay): boolean {
  return cwuProblems(inputFromContent(content), today).length === 0;
}

/**
 * The earliest proposal deadline a change may give: today, unless the opportunity has been
 * published and its own deadline has already passed (R-1.14 note).
 */
export function earliestDeadlineFor(
  current: { readonly status: OpportunityStatus; readonly proposalDeadline: CalendarDay } | null,
  today: CalendarDay,
): CalendarDay {
  if (current && !isUnpublished(current.status) && current.proposalDeadline < today) return current.proposalDeadline;
  return today;
}
