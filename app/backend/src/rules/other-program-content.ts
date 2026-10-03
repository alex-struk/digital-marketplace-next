/**
 * What a Sprint With Us or Team With Us opportunity must hold before it may be reviewed or
 * published, and what its evaluation panel must be, as plain TypeScript (decision record 0045).
 * The service and the single-page app both call these, so a form names the same problems as the
 * service that refuses them.
 *
 * A draft is never checked (R-1.9, R-1.17): `draftOf` in `other-program-drafts.ts` keeps whatever
 * it holds. Anything that is not a draft is read here as it was sent, without the defaults a draft
 * is given, and every problem is named against the field the request named it by.
 */

import {
  CalendarDay,
  DESCRIPTION_MAX,
  LOCATION_MAX,
  OpportunityStatus,
  REMOTE_DESC_MAX,
  SKILL_MAX,
  TEASER_MAX,
  TITLE_MAX,
  calendarDayFrom,
} from "./opportunities";
import {
  LIST_MAX,
  OtherProgram,
  QUESTIONS_MAX,
  OtherProgramDraft,
  SWU_BUDGET_MAX,
  SWU_PHASE_NAMES,
  SwuPhase,
  WEIGHT_FIELDS,
  WeightsDraft,
  isServiceArea,
} from "./other-program-drafts";
import type { AccountKind } from "./users";

// ------------------------------------------------------------------------ limits

export const QUESTION_TEXT_MAX = 1_000;
export const WORD_LIMIT_MAX = 3_000;
export const ALLOCATION_MAX = 100;
const INT_MAX = 2_147_483_647;

/** The smallest panel the service accepts (R-1.55, R-5.1). */
export const PANEL_MIN = 2;

// ------------------------------------------------------------------------ names

/** Each weight under the name the request gives it. */
export const WEIGHT_KEYS: Readonly<Record<keyof WeightsDraft, string>> = {
  questions: "questionsWeight",
  codeChallenge: "codeChallengeWeight",
  scenario: "scenarioWeight",
  challenge: "challengeWeight",
  price: "priceWeight",
};

/** What a program calls its budget, its questions and their list, in a request and in words. */
export const PROGRAM_TERMS: Readonly<
  Record<OtherProgram, { budgetKey: string; budget: string; questionsKey: string; questions: string; question: string }>
> = {
  "sprint-with-us": {
    budgetKey: "totalMaxBudget",
    budget: "total maximum budget",
    questionsKey: "teamQuestions",
    questions: "team questions",
    question: "team question",
  },
  "team-with-us": {
    budgetKey: "maxBudget",
    budget: "maximum budget",
    questionsKey: "resourceQuestions",
    questions: "resource questions",
    question: "resource question",
  },
};

const PHASE_KEYS: Readonly<Record<SwuPhase, string>> = {
  INCEPTION: "inceptionPhase",
  PROTOTYPE: "prototypePhase",
  IMPLEMENTATION: "implementationPhase",
};

const WEIGHT_WORDS: Readonly<Record<keyof WeightsDraft, string>> = {
  questions: "questions",
  codeChallenge: "code challenge",
  scenario: "team scenario",
  challenge: "challenge",
  price: "price",
};

// ------------------------------------------------------------------------ reading what was sent

export interface QuestionInput {
  readonly question: string;
  readonly guideline: string;
  readonly score: number | null;
  readonly minimumScore: number | null;
  readonly wordLimit: number | null;
}

export interface PhaseInput {
  readonly phase: SwuPhase;
  readonly startDate: string | null;
  readonly completionDate: string | null;
}

export interface ResourceInput {
  readonly serviceArea: string;
  readonly targetAllocation: number | null;
}

/** An opportunity of either program as it was sent, with nothing defaulted. */
export interface OtherInput {
  readonly title: string;
  readonly teaser: string;
  /** Null while the question has not been answered. */
  readonly remoteOk: boolean | null;
  readonly remoteDesc: string;
  readonly location: string;
  readonly budget: number | null;
  readonly description: string;
  readonly proposalDeadline: string | null;
  readonly assignmentDate: string | null;
  /** Team With Us. */
  readonly startDate: string | null;
  readonly completionDate: string | null;
  /** Sprint With Us. */
  readonly skills: readonly string[];
  /** Sprint With Us: the phases sent, in the order they run. */
  readonly phases: readonly PhaseInput[];
  readonly questions: readonly QuestionInput[];
  /** Team With Us. */
  readonly resources: readonly ResourceInput[];
  readonly weights: Readonly<Record<keyof WeightsDraft, number | null>>;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const dateText = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);
const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** A number written as a number or as text ("$120,000", "25%"), or null for anything else. */
function numberFrom(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[$,%\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function remoteFrom(value: unknown): boolean | null {
  if (value === true || value === "yes" || value === "true") return true;
  if (value === false || value === "no" || value === "false") return false;
  return null;
}

const isBlankQuestion = (item: QuestionInput) =>
  item.question === "" && item.guideline === "" && item.score === null && item.minimumScore === null && item.wordLimit === null;

/** Reads a request's content loosely; what it says is judged by `otherProblems`. */
export function readOtherInput(program: OtherProgram, body: unknown): OtherInput {
  const given = record(body);
  const sprint = program === "sprint-with-us";
  const terms = PROGRAM_TERMS[program];
  const questions = (Array.isArray(given[terms.questionsKey]) ? (given[terms.questionsKey] as unknown[]) : [])
    .map(record)
    .map((item) => ({
      question: text(item.question),
      guideline: text(item.guideline),
      score: numberFrom(item.score),
      minimumScore: numberFrom(item.minimumScore),
      wordLimit: numberFrom(item.wordLimit),
    }))
    // A question left wholly blank is no question at all.
    .filter((item) => !isBlankQuestion(item));
  const phases: PhaseInput[] = [];
  if (sprint) {
    for (const phase of ["INCEPTION", "PROTOTYPE", "IMPLEMENTATION"] as const) {
      const value = given[PHASE_KEYS[phase]];
      if (typeof value !== "object" || value === null) continue;
      const entry = record(value);
      phases.push({ phase, startDate: dateText(entry.startDate), completionDate: dateText(entry.completionDate) });
    }
  }
  const skills = Array.isArray(given.mandatorySkills ?? given.skills)
    ? [
        ...new Set(
          ((given.mandatorySkills ?? given.skills) as unknown[])
            .filter((skill): skill is string => typeof skill === "string" && skill.trim() !== "")
            .map((skill) => skill.trim()),
        ),
      ]
    : [];
  return {
    title: text(given.title),
    teaser: text(given.teaser),
    remoteOk: remoteFrom(given.remoteOk),
    remoteDesc: text(given.remoteDesc),
    location: text(given.location),
    budget: numberFrom(given[terms.budgetKey]),
    description: text(given.description),
    proposalDeadline: dateText(given.proposalDeadline),
    assignmentDate: dateText(given.assignmentDate),
    startDate: sprint ? null : dateText(given.startDate),
    completionDate: sprint ? null : dateText(given.completionDate),
    skills: sprint ? skills : [],
    phases,
    questions,
    resources: sprint
      ? []
      : (Array.isArray(given.resources) ? (given.resources as unknown[]) : []).map(record).map((item) => ({
          serviceArea:
            typeof item.serviceArea === "string" ? item.serviceArea.trim().toUpperCase().replace(/[\s-]+/g, "_") : "",
          targetAllocation: numberFrom(item.targetAllocation),
        })),
    weights: {
      questions: numberFrom(given.questionsWeight),
      codeChallenge: sprint ? numberFrom(given.codeChallengeWeight) : null,
      scenario: sprint ? numberFrom(given.scenarioWeight) : null,
      challenge: sprint ? null : numberFrom(given.challengeWeight),
      price: numberFrom(given.priceWeight),
    },
  };
}

/**
 * A kept opportunity as a request would carry it, named as the old service named it, so a change
 * can be laid over it and the whole judged again. The panel is left out: it is changed on its own
 * (R-5.16).
 */
export function bodyOfDraft(program: OtherProgram, draft: OtherProgramDraft): Record<string, unknown> {
  const sprint = program === "sprint-with-us";
  const terms = PROGRAM_TERMS[program];
  const body: Record<string, unknown> = {
    title: draft.title,
    teaser: draft.teaser,
    remoteOk: draft.remoteOk,
    remoteDesc: draft.remoteDesc,
    location: draft.location,
    description: draft.description,
    proposalDeadline: draft.proposalDeadline,
    assignmentDate: draft.assignmentDate,
    [terms.budgetKey]: draft.budget,
    [terms.questionsKey]: draft.questions.map((question) => ({ ...question })),
  };
  for (const field of WEIGHT_FIELDS[program]) body[WEIGHT_KEYS[field]] = draft.weights[field];
  if (sprint) {
    body.mandatorySkills = [...draft.skills];
    for (const phase of draft.phases) {
      body[PHASE_KEYS[phase.phase]] = { startDate: phase.startDate, completionDate: phase.completionDate, maxBudget: phase.maxBudget };
    }
  } else {
    body.startDate = draft.startDate;
    body.completionDate = draft.completionDate;
    body.resources = draft.resources.map((resource) => ({ ...resource }));
  }
  return body;
}

/**
 * A change laid over what is kept: every key the change names replaces the kept one, and what it
 * leaves out stays as it was. Naming a phase as null removes it.
 */
export function mergedBody(program: OtherProgram, kept: OtherProgramDraft, change: unknown): Record<string, unknown> {
  const merged = bodyOfDraft(program, kept);
  for (const [key, value] of Object.entries(record(change))) {
    if (key === "evaluationPanel" || key === "status") continue;
    if (value === null && key in PHASE_KEY_SET) delete merged[key];
    else merged[key] = value;
  }
  return merged;
}

const PHASE_KEY_SET: Readonly<Record<string, true>> = { inceptionPhase: true, prototypePhase: true, implementationPhase: true };

// ------------------------------------------------------------------------ judging it

export interface OtherProblem {
  /** The field as the request names it; a listed item is named by its number, from 1. */
  readonly field: string;
  readonly message: string;
}

/** A refusal line names the field it is about, as Code With Us's do (R-1.10). */
export function otherRefusalLine(problem: OtherProblem): string {
  return `${problem.field}: ${problem.message}`;
}

/** Reads a refusal line back into its field and message, for a screen showing the service's refusal. */
export function otherProblemFromLine(line: string): OtherProblem | null {
  const match = /^([A-Za-z]+(?:\.[A-Za-z0-9]+)*): (.+)$/s.exec(line);
  return match ? { field: match[1] as string, message: match[2] as string } : null;
}

const dollars = (amount: number) => `$${amount.toLocaleString("en-CA")}`;
const isWhole = (value: number | null): value is number => value !== null && Number.isInteger(value);
const capitalised = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);

/**
 * Every problem with an opportunity of either program that is not a draft (decision record 0045):
 * a title, teaser, location and description within their limits (R-1.10) and an answer about
 * remote work (R-1.11); the program's budget (R-1.13); dates in order from no earlier than
 * `earliestDeadline` (R-1.14); weights that total 100% (R-1.15); for Sprint With Us, at least one
 * skill and an implementation phase, with an inception phase only beside a prototype phase
 * (R-1.16); for Team With Us, each resource in a recognised service area at 1 to 100 per cent
 * (R-1.18); and each evaluation question within its limits, its position being its place in the
 * list (R-1.17). The panel is judged by `panelProblems`.
 */
export function otherProblems(program: OtherProgram, input: OtherInput, earliestDeadline: CalendarDay): OtherProblem[] {
  const problems: OtherProblem[] = [];
  const add = (field: string, message: string) => problems.push({ field, message });
  const sprint = program === "sprint-with-us";
  const terms = PROGRAM_TERMS[program];

  if (input.title.trim() === "") add("title", "Enter a title.");
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
  if (input.description.trim() === "") add("description", "Enter a description.");
  else if (input.description.length > DESCRIPTION_MAX) {
    add("description", `Enter a description of up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`);
  }

  // R-1.13: Sprint With Us between $1 and $5,000,000; Team With Us at least $1, with no upper limit
  // but what the store can hold.
  const budget = input.budget;
  if (sprint) {
    if (!isWhole(budget) || budget < 1 || budget > SWU_BUDGET_MAX) {
      add(terms.budgetKey, `Enter a total maximum budget between $1 and ${dollars(SWU_BUDGET_MAX)}, in whole dollars.`);
    }
  } else if (!isWhole(budget) || budget < 1) {
    add(terms.budgetKey, "Enter a maximum budget of at least $1, in whole dollars.");
  } else if (budget > INT_MAX) {
    add(terms.budgetKey, `Enter a maximum budget of up to ${dollars(INT_MAX)}.`);
  }

  if (sprint) {
    if (input.skills.length === 0) add("mandatorySkills", "Choose at least one skill.");
    else if (input.skills.some((skill) => skill.length > SKILL_MAX)) add("mandatorySkills", `Name each skill in up to ${SKILL_MAX} characters.`);
  }

  // R-1.14: the dates run in order, each a real day.
  const deadline = calendarDayFrom(input.proposalDeadline);
  const assignment = calendarDayFrom(input.assignmentDate);
  if (!deadline) add("proposalDeadline", "Choose a proposal deadline.");
  else if (deadline < earliestDeadline) add("proposalDeadline", "The proposal deadline cannot be before today.");
  if (!assignment) add("assignmentDate", "Choose an assignment date.");
  else if (deadline && assignment < deadline) add("assignmentDate", "The assignment date cannot be before the proposal deadline.");

  if (sprint) {
    phaseProblems(input.phases, assignment, add);
  } else {
    const start = calendarDayFrom(input.startDate);
    const completion = calendarDayFrom(input.completionDate);
    if (!start) add("startDate", "Choose a start date.");
    else if (assignment && start < assignment) add("startDate", "The start date cannot be before the assignment date.");
    if (input.completionDate !== null && !completion) add("completionDate", "Choose a completion date, or leave it empty.");
    else if (completion && start && completion < start) add("completionDate", "The completion date cannot be before the start date.");

    // R-1.18.
    if (input.resources.length === 0) add("resources", "Add at least one resource.");
    else if (input.resources.length > LIST_MAX) add("resources", `Add no more than ${LIST_MAX} resources.`);
    input.resources.forEach((resource, index) => {
      const field = `resources.${index + 1}`;
      if (!isServiceArea(resource.serviceArea)) add(`${field}.serviceArea`, "Choose one of the five service areas.");
      const allocation = resource.targetAllocation;
      if (!isWhole(allocation) || allocation < 1 || allocation > ALLOCATION_MAX) {
        add(`${field}.targetAllocation`, "Enter a target allocation between 1 and 100 per cent of full time.");
      }
    });
  }

  // R-1.17: each question; its position is its place in the list, from 0 to 100.
  if (input.questions.length === 0) add(terms.questionsKey, `Add at least one ${terms.question}.`);
  else if (input.questions.length > QUESTIONS_MAX) add(terms.questionsKey, `Add no more than ${QUESTIONS_MAX} ${terms.questions}.`);
  input.questions.forEach((question, index) => {
    const field = `${terms.questionsKey}.${index + 1}`;
    if (question.question.trim() === "" || question.question.length > QUESTION_TEXT_MAX) {
      add(`${field}.question`, "Enter a question of 1 to 1,000 characters.");
    }
    if (question.guideline.trim() === "" || question.guideline.length > QUESTION_TEXT_MAX) {
      add(`${field}.guideline`, "Enter a guideline of 1 to 1,000 characters.");
    }
    const score = question.score;
    const scoreValid = isWhole(score) && score >= 1 && score <= INT_MAX;
    if (!scoreValid) add(`${field}.score`, "Enter a maximum score of at least 1, as a whole number.");
    const minimum = question.minimumScore;
    if (minimum !== null) {
      if (!isWhole(minimum) || minimum < 0) add(`${field}.minimumScore`, "Enter a minimum score as a whole number, or leave it empty.");
      else if (scoreValid && minimum >= score) add(`${field}.minimumScore`, "Enter a minimum score lower than the maximum score.");
    }
    const words = question.wordLimit;
    if (!isWhole(words) || words < 1 || words > WORD_LIMIT_MAX) {
      add(`${field}.wordLimit`, "Enter a response word limit between 1 and 3,000.");
    }
  });

  // R-1.15: each weight from 0 to 100, and together exactly 100.
  let total = 0;
  let allValid = true;
  for (const name of WEIGHT_FIELDS[program]) {
    const weight = input.weights[name];
    if (!isWhole(weight) || weight < 0 || weight > 100) {
      allValid = false;
      add(WEIGHT_KEYS[name], `Enter the ${WEIGHT_WORDS[name]} weight as a whole number from 0 to 100.`);
    } else {
      total += weight;
    }
  }
  if (!allValid || total !== 100) add("scoringWeights", "The scoring weights must total 100%.");

  return problems;
}

/**
 * Sprint With Us phases (R-1.16): an implementation phase always, and an inception phase only
 * with a prototype phase. Each runs from no earlier than the end of the one before it (the first
 * from the assignment date) to no earlier than its own start.
 */
function phaseProblems(phases: readonly PhaseInput[], assignment: CalendarDay | null, add: (field: string, message: string) => void): void {
  const has = (phase: SwuPhase) => phases.some((entry) => entry.phase === phase);
  if (!has("IMPLEMENTATION")) add("phases", "Add an implementation phase. Every Sprint With Us opportunity has one.");
  if (has("INCEPTION") && !has("PROTOTYPE")) add("phases", "A prototype phase must follow an inception phase.");
  let earliest = assignment;
  for (const entry of phases) {
    const key = PHASE_KEYS[entry.phase];
    const name = SWU_PHASE_NAMES[entry.phase].toLowerCase();
    const start = calendarDayFrom(entry.startDate);
    const completion = calendarDayFrom(entry.completionDate);
    if (!start) add(`${key}.startDate`, `Choose the ${name} phase's start date.`);
    else if (earliest && start < earliest) {
      add(`${key}.startDate`, `The ${name} phase cannot start before ${earliest === assignment ? "the assignment date" : "the phase before it ends"}.`);
    }
    if (!completion) add(`${key}.completionDate`, `Choose the ${name} phase's completion date.`);
    else if (start && completion < start) add(`${key}.completionDate`, `The ${name} phase cannot end before it starts.`);
    earliest = completion ?? start ?? earliest;
  }
}

/** Whether a kept opportunity is complete enough to go for review or be published (R-1.21). */
export function isOtherComplete(
  program: OtherProgram,
  draft: OtherProgramDraft,
  panel: readonly { readonly evaluator: boolean; readonly chair: boolean }[],
  today: CalendarDay,
): boolean {
  const input = readOtherInput(program, bodyOfDraft(program, draft));
  if (otherProblems(program, input, today).length > 0) return false;
  const members = panel.map((member, index) => ({ ...member, user: String(index), name: null, kind: "GOV" as const, active: true }));
  return panelProblems(members).length === 0;
}

// ------------------------------------------------------------------------ the evaluation panel

/** One panel member as sent, with what the service knows of the account named. */
export interface PanelMemberCheck {
  /** The account named, or null when the entry names none. */
  readonly user: string | null;
  /** The account's name, when there is such an account. */
  readonly name: string | null;
  /** The account's kind, or null when no account is held at that identifier. */
  readonly kind: AccountKind | null;
  readonly active: boolean;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

/** A panel entry as a request carries it: an account named by identifier or by a record, and its roles. */
export interface PanelEntryInput {
  readonly user: string | null;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

const yes = (value: unknown) => value === true || value === "yes" || value === "true";

/** The panel a request names, in order, exactly as named: duplicates and members with no role included. */
export function readPanel(value: unknown): PanelEntryInput[] {
  const list = Array.isArray(value) ? value : Array.isArray(record(value).evaluationPanel) ? (record(value).evaluationPanel as unknown[]) : [];
  return list.map((item) => {
    const entry = record(item);
    const named = entry.user;
    const user =
      typeof named === "string" && named.trim() !== ""
        ? named.trim().toLowerCase()
        : typeof record(named).id === "string"
          ? (record(named).id as string).toLowerCase()
          : null;
    return { user, evaluator: yes(entry.evaluator), chair: yes(entry.chair) };
  });
}

export const PANEL_TOO_SMALL = "The panel needs at least two members.";
export const PANEL_NO_CHAIR = "Choose a chair. The panel needs one person to record the agreed scores.";
export const PANEL_LOCKED = "The evaluation panel can no longer be changed. The consensus stage has begun, so the panel is fixed.";
export const NOT_PERMITTED_TO_CHANGE_PANEL = "Only an administrator or the opportunity's author may change its evaluation panel.";

const memberName = (member: PanelMemberCheck) => member.name || "This person";

/**
 * Why a panel may not stand, or nothing (R-1.55, R-5.1, R-5.9, R-5.37): at least two members,
 * each a public sector employee named once, each an evaluator, the chair or both, and exactly one
 * chair. A problem with one member names them and their place on the panel. Every line belongs to
 * the request's `evaluationPanel`.
 */
export function panelProblems(members: readonly PanelMemberCheck[]): OtherProblem[] {
  const problems: OtherProblem[] = [];
  const add = (message: string) => problems.push({ field: "evaluationPanel", message });
  if (members.length < PANEL_MIN) add(PANEL_TOO_SMALL);
  const seen = new Set<string>();
  members.forEach((member, index) => {
    const place = `Panel member ${index + 1}`;
    if (member.user === null || member.kind === null) {
      add(`${place}: choose a public sector employee.`);
      return;
    }
    if (seen.has(member.user)) add(`${place}: ${memberName(member)} is already on the panel.`);
    seen.add(member.user);
    if ((member.kind !== "GOV" && member.kind !== "ADMIN") || !member.active) {
      add(`${place}: ${memberName(member)} is not a public sector employee.`);
    }
    if (!member.evaluator && !member.chair) add(`${place}: ${memberName(member)} must be an evaluator, the chair, or both.`);
  });
  const chairs = members.filter((member) => member.chair).length;
  if (chairs === 0) add(PANEL_NO_CHAIR);
  else if (chairs > 1) add(`Choose only one chair. The panel names ${chairs}.`);
  return problems;
}

/**
 * The window in which a panel may be changed: while the opportunity is a draft, under review,
 * published or in individual question evaluation; it is fixed from the consensus stage on
 * (R-1.43, R-5.16).
 */
export function panelMayChange(status: OpportunityStatus): boolean {
  return status === "DRAFT" || status === "UNDER_REVIEW" || status === "PUBLISHED" || status === "EVAL_QUESTIONS_INDIVIDUAL";
}

/**
 * Who of a new panel is newly on it, to be told (R-5.17): nobody while the opportunity is a draft,
 * and otherwise each member who was not on the panel before.
 */
export function newlyAddedMembers(status: OpportunityStatus, before: readonly string[], after: readonly string[]): string[] {
  if (status === "DRAFT") return [];
  const earlier = new Set(before);
  return [...new Set(after)].filter((user) => !earlier.has(user));
}

/** How a member's roles read: "evaluator and chair", "evaluator", "chair". */
export function panelRoleLabel(member: { readonly evaluator: boolean; readonly chair: boolean }): string {
  if (member.evaluator && member.chair) return "Evaluator and chair";
  if (member.chair) return "Chair";
  return "Evaluator";
}

// ------------------------------------------------------------------------ fields in words

/**
 * A refused field named as the form labels it: "Total maximum budget", "Question 2, minimum
 * score", "Resource 1, target allocation", "Inception phase, start date".
 */
export function otherFieldLabel(program: OtherProgram, field: string): string {
  const terms = PROGRAM_TERMS[program];
  const simple: Record<string, string> = {
    title: "Title",
    teaser: "Teaser",
    remoteOk: "Remote work",
    remoteDesc: "Remote work description",
    location: "Location",
    description: "Description",
    proposalDeadline: "Proposal deadline",
    assignmentDate: "Assignment date",
    startDate: "Start date",
    completionDate: "Completion date",
    mandatorySkills: "Skills",
    phases: "Phases",
    resources: "Resources",
    scoringWeights: "Scoring weights",
    evaluationPanel: "Evaluation panel",
    [terms.budgetKey]: capitalised(terms.budget),
    [terms.questionsKey]: capitalised(terms.questions),
  };
  for (const name of WEIGHT_FIELDS[program]) simple[WEIGHT_KEYS[name]] = `${capitalised(WEIGHT_WORDS[name])} weight`;
  if (field in simple) return simple[field] as string;
  const [head, second, third] = field.split(".");
  const phase = (Object.keys(PHASE_KEYS) as SwuPhase[]).find((key) => PHASE_KEYS[key] === head);
  if (phase && second) return `${SWU_PHASE_NAMES[phase]} phase, ${second === "startDate" ? "start date" : "completion date"}`;
  const parts: Record<string, string> = {
    question: "question",
    guideline: "guideline",
    score: "maximum score",
    minimumScore: "minimum score",
    wordLimit: "response word limit",
    serviceArea: "service area",
    targetAllocation: "target allocation",
  };
  if (head === terms.questionsKey && second) return `Question ${second}${third ? `, ${parts[third] ?? third}` : ""}`;
  if (head === "resources" && second) return `Resource ${second}${third ? `, ${parts[third] ?? third}` : ""}`;
  return field;
}
