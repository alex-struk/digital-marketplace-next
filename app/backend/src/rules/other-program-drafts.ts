/**
 * Sprint With Us and Team With Us opportunities as created before slice 10, as plain TypeScript
 * (decision records 0035 and 0036): what one holds when it is created — the fields every program
 * shares, and each program's own phases or resources, questions, scoring weights and evaluation
 * panel as its create screen offers them — and how what was sent becomes what is kept. The service
 * and the single-page app both call these.
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

/** The phases a Sprint With Us opportunity may have; every one has an implementation phase. */
export const SWU_PHASES = ["INCEPTION", "PROTOTYPE", "IMPLEMENTATION"] as const;
export type SwuPhase = (typeof SWU_PHASES)[number];

export const SWU_PHASE_NAMES: Readonly<Record<SwuPhase, string>> = {
  INCEPTION: "Inception",
  PROTOTYPE: "Prototype",
  IMPLEMENTATION: "Implementation",
};

/**
 * The five recognised service areas a Team With Us resource names, as the installation holds them
 * (the `serviceAreas` table, put back by every seed).
 */
export const SERVICE_AREAS = [
  { key: "FULL_STACK_DEVELOPER", name: "Full Stack Developer" },
  { key: "DATA_PROFESSIONAL", name: "Data Professional" },
  { key: "AGILE_COACH", name: "Agile Coach" },
  { key: "DEVOPS_SPECIALIST", name: "DevOps Specialist" },
  { key: "SERVICE_DESIGNER", name: "Service Designer" },
] as const;
export type ServiceArea = (typeof SERVICE_AREAS)[number]["key"];

export function isServiceArea(value: unknown): value is ServiceArea {
  return SERVICE_AREAS.some((area) => area.key === value);
}

/** How many questions, resources or panel members one opportunity may name. */
export const LIST_MAX = 100;

export interface PhaseDraft {
  readonly phase: SwuPhase;
  readonly startDate: CalendarDay;
  readonly completionDate: CalendarDay;
  readonly maxBudget: number;
}

export interface QuestionDraft {
  readonly question: string;
  readonly guideline: string;
  readonly score: number;
  readonly minimumScore: number | null;
  readonly wordLimit: number;
}

export interface ResourceDraft {
  readonly serviceArea: ServiceArea;
  readonly targetAllocation: number;
}

export interface PanelMemberDraft {
  readonly user: string;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

/** Each weight as a whole percentage; a program keeps the ones it has. */
export interface WeightsDraft {
  readonly questions: number;
  /** Sprint With Us. */
  readonly codeChallenge: number;
  readonly scenario: number;
  /** Team With Us. */
  readonly challenge: number;
  readonly price: number;
}

/** What an opportunity of either program holds when it is created. */
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
  /** Sprint With Us: the skills the team must have. */
  readonly skills: readonly string[];
  /** Sprint With Us: always an implementation phase, and an inception or prototype one if added. */
  readonly phases: readonly PhaseDraft[];
  /** Sprint With Us team questions or Team With Us resource questions, in order. */
  readonly questions: readonly QuestionDraft[];
  /** Team With Us. */
  readonly resources: readonly ResourceDraft[];
  readonly weights: WeightsDraft;
  /** The evaluation panel, in order. Nobody named means the author alone, as chair and evaluator. */
  readonly panel: readonly PanelMemberDraft[];
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const INT_MAX = 2_147_483_647;
const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A whole number written as a number or as text ("$120,000"), or null for anything else. */
function wholeFrom(value: unknown): number | null {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.replace(/[$,%\s]/g, ""))
        : Number.NaN;
  return Number.isInteger(amount) && Math.abs(amount) <= INT_MAX ? amount : null;
}

const whole = (value: unknown): number => wholeFrom(value) ?? 0;

function yes(value: unknown): boolean {
  return value === true || value === "yes" || value === "true";
}

const listFrom = (value: unknown): readonly Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).slice(0, LIST_MAX)
    : [];

function questionsFrom(value: unknown): QuestionDraft[] {
  return listFrom(value)
    .map((item) => ({
      question: text(item.question),
      guideline: text(item.guideline),
      score: whole(item.score),
      minimumScore: wholeFrom(item.minimumScore),
      wordLimit: whole(item.wordLimit),
    }))
    .filter((item) => item.question !== "" || item.guideline !== "" || item.score !== 0 || item.wordLimit !== 0 || item.minimumScore !== null);
}

function panelFrom(value: unknown): PanelMemberDraft[] {
  const seen = new Set<string>();
  const members: PanelMemberDraft[] = [];
  for (const item of listFrom(value)) {
    const user = typeof item.user === "string" ? item.user.toLowerCase() : "";
    if (!IDENTIFIER.test(user) || seen.has(user)) continue;
    seen.add(user);
    members.push({ user, evaluator: yes(item.evaluator), chair: yes(item.chair) });
  }
  return members;
}

function resourcesFrom(value: unknown): ResourceDraft[] {
  return listFrom(value).flatMap((item) => {
    const area = typeof item.serviceArea === "string" ? item.serviceArea.trim().toUpperCase().replace(/[\s-]+/g, "_") : "";
    return isServiceArea(area) ? [{ serviceArea: area, targetAllocation: whole(item.targetAllocation) }] : [];
  });
}

function skillsFrom(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((skill): skill is string => typeof skill === "string" && skill.trim() !== "").map((skill) => skill.trim()))]
    : [];
}

/**
 * What is kept of what was sent, in every state an opportunity may be created in (R-1.9). Nothing
 * is refused for its content here: whether an opportunity is complete enough to be reviewed or
 * published is each program's own rule, and slice 10's. A proposal deadline or assignment date
 * that is missing, or earlier than the date it must follow, is set to fourteen days from the day
 * of saving; so is a Team With Us start date. A completion date that is missing or earlier than
 * the start date is left empty. A Sprint With Us phase's dates follow the same rule from the
 * assignment date, and its implementation phase holds whatever of the total budget the other
 * phases do not. The budget is read from `totalMaxBudget` or `maxBudget`, whichever the program
 * names it by; the request names the rest as the old service's did.
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
  const sprint = program === "sprint-with-us";
  const start = sprint ? null : (valid(record.startDate, assignment) ?? fallback);
  const completion = sprint ? null : valid(record.completionDate, start ?? today);
  const budget = whole(sprint ? record.totalMaxBudget : record.maxBudget);

  const phases: PhaseDraft[] = [];
  if (sprint) {
    const phaseOf = (phase: SwuPhase, value: unknown, budgetLeft: number | null): PhaseDraft => {
      const given = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
      const phaseStart = valid(given.startDate, assignment) ?? assignment;
      return {
        phase,
        startDate: phaseStart,
        completionDate: valid(given.completionDate, phaseStart) ?? phaseStart,
        maxBudget: wholeFrom(given.maxBudget) ?? budgetLeft ?? 0,
      };
    };
    for (const [phase, key] of [["INCEPTION", "inceptionPhase"], ["PROTOTYPE", "prototypePhase"]] as const) {
      if (typeof record[key] === "object" && record[key] !== null) phases.push(phaseOf(phase, record[key], 0));
    }
    const spent = phases.reduce((sum, phase) => sum + phase.maxBudget, 0);
    phases.push(phaseOf("IMPLEMENTATION", record.implementationPhase, Math.max(budget - spent, 0)));
  }

  return {
    title: text(record.title),
    teaser: text(record.teaser),
    remoteOk: yes(record.remoteOk),
    remoteDesc: text(record.remoteDesc),
    location: text(record.location),
    budget,
    description: text(record.description),
    proposalDeadline: deadline,
    assignmentDate: assignment,
    startDate: start,
    completionDate: completion,
    skills: sprint ? skillsFrom(record.mandatorySkills ?? record.skills) : [],
    phases,
    questions: questionsFrom(sprint ? record.teamQuestions : record.resourceQuestions),
    resources: sprint ? [] : resourcesFrom(record.resources),
    weights: {
      questions: whole(record.questionsWeight),
      codeChallenge: sprint ? whole(record.codeChallengeWeight) : 0,
      scenario: sprint ? whole(record.scenarioWeight) : 0,
      challenge: sprint ? 0 : whole(record.challengeWeight),
      price: whole(record.priceWeight),
    },
    panel: panelFrom(record.evaluationPanel),
  };
}

/** The states an opportunity may be created in. */
export const CREATION_STATES = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;
export type CreationState = (typeof CREATION_STATES)[number];

/** Why a creation was not accepted, and how the service answers it. */
export type CreationRefusal =
  | { readonly kind: "not-permitted" }
  | { readonly kind: "only-administrators-publish" }
  | { readonly kind: "unknown-state" };

/**
 * The state a Sprint With Us or Team With Us opportunity is created in, or why it may not be. Only
 * public sector staff create one (R-1.7); any of them as a draft or under review, and only an
 * administrator published (R-1.48). Asking for no state is asking for a draft.
 */
export function creationDecision(viewer: OpportunityViewer | null, body: unknown): CreationState | CreationRefusal {
  if (!viewer || !mayCreateOpportunity(viewer)) return { kind: "not-permitted" };
  const requested = (body as { status?: unknown } | null)?.status ?? "DRAFT";
  if (!(CREATION_STATES as readonly unknown[]).includes(requested)) return { kind: "unknown-state" };
  if (!mayCreateInState(viewer, requested as OpportunityStatus)) return { kind: "only-administrators-publish" };
  return requested as CreationState;
}

export function isCreationRefusal(decision: CreationState | CreationRefusal): decision is CreationRefusal {
  return typeof decision === "object";
}

export const UNKNOWN_CREATION_STATE =
  "status: An opportunity is created as a draft (DRAFT), under review (UNDER_REVIEW) or published (PUBLISHED).";

/** The scoring weights a program has, in the order its form asks for them. */
export const WEIGHT_FIELDS: Readonly<Record<OtherProgram, readonly (keyof WeightsDraft)[]>> = {
  "sprint-with-us": ["questions", "codeChallenge", "scenario", "price"],
  "team-with-us": ["questions", "challenge", "price"],
};

/** The total of a program's weights, as the form shows it while they are entered. */
export function weightTotal(program: OtherProgram, weights: Partial<Record<keyof WeightsDraft, number>>): number {
  return WEIGHT_FIELDS[program].reduce((sum, field) => sum + (Number.isFinite(weights[field]) ? (weights[field] as number) : 0), 0);
}
