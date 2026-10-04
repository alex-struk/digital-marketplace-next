import type { OtherProgram, SwuPhase } from "@rules/other-program-drafts";
import { ListedOpportunity, readListedOpportunity } from "./opportunity-list";
import { api } from "./client";
import {
  Addendum,
  Attachment,
  HistoryEntry,
  Person,
  Reporting,
  RunningAction,
  SuccessfulProponent,
  readAddenda,
  readAttachment,
  readHistory,
  readReporting,
  readSuccessfulProponent,
  reasonsIn,
  runningBody,
} from "./opportunities";

/**
 * A Sprint With Us or Team With Us opportunity as the service answers with it (decision records
 * 0035, 0036 and 0045): what every program holds, and its own phases or resources, questions,
 * weights and — to an administrator, its author and its panel only (R-5.18) — its evaluation panel.
 * Answers are read defensively rather than trusted.
 */
export interface OtherProgramOpportunity extends ListedOpportunity {
  readonly updatedBy?: Person | null;
  readonly publishedAt: string | null;
  readonly teaser: string;
  readonly description: string;
  readonly assignmentDate: string;
  /** Team With Us. */
  readonly startDate: string;
  readonly completionDate: string | null;
  /** Sprint With Us. */
  readonly skills: readonly string[];
  readonly phases: readonly StoredPhase[];
  readonly questions: readonly StoredQuestion[];
  /** Team With Us; each with the identifier a proposal names its team against. */
  readonly resources: readonly StoredResource[];
  readonly weights: Readonly<Record<string, number>>;
  /** The files it carries, readable by whoever may read it (R-8.20, R-8.25). */
  readonly attachments: readonly Attachment[];
  /** Absent unless the reader may see it (R-5.18). */
  readonly evaluationPanel?: readonly PanelMember[];
  /** Every addendum, oldest first (R-1.32). */
  readonly addenda: readonly Addendum[];
  /** The author and administrators only (R-1.30). */
  readonly history?: readonly HistoryEntry[];
  /** The author and administrators only, once it has been published (R-1.30). */
  readonly reporting?: Reporting;
  /** Once awarded (R-1.27). */
  readonly successfulProponent?: SuccessfulProponent;
}

export interface StoredPhase {
  readonly phase: SwuPhase;
  readonly startDate: string;
  readonly completionDate: string;
  /** 0 where no phase maximum is recorded. */
  readonly maxBudget: number;
  /** What the phase's team must hold between them (R-2.19). */
  readonly requiredCapabilities: readonly string[];
}

export interface StoredResource {
  readonly id: string;
  readonly serviceArea: string;
  readonly targetAllocation: number;
}

export interface StoredQuestion {
  readonly question: string;
  readonly guideline: string;
  readonly score: number;
  readonly minimumScore: number | null;
  readonly wordLimit: number;
}

export interface PanelMember {
  readonly user: Person;
  readonly evaluator: boolean;
  readonly chair: boolean;
}

/** A phase as entered; Sprint With Us. */
export interface PhaseEntry {
  readonly startDate: string;
  readonly completionDate: string;
  /** The phase's maximum budget; NaN while nothing is entered. */
  readonly maxBudget: number;
  /** The capabilities the phase's team must hold between them (R-2.19). */
  readonly requiredCapabilities: readonly string[];
}

export const BLANK_PHASE: PhaseEntry = { startDate: "", completionDate: "", maxBudget: Number.NaN, requiredCapabilities: [] };

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

/** What the create form, and the Opportunity tab's form, send. */
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
  /** Stored files, by identifier (decision record 0055). */
  readonly attachments: readonly string[];
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];

function readPhase(value: unknown, phase: SwuPhase): StoredPhase | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    phase,
    startDate: text(record.startDate),
    completionDate: text(record.completionDate),
    maxBudget: num(record.maxBudget),
    requiredCapabilities: Array.isArray(record.requiredCapabilities)
      ? record.requiredCapabilities.filter((capability): capability is string => typeof capability === "string")
      : [],
  };
}

export function readOtherProgramOpportunity(program: OtherProgram, value: unknown): OtherProgramOpportunity | null {
  const listed = readListedOpportunity(program, value);
  if (!listed) return null;
  const record = value as Record<string, unknown>;
  const updatedBy = record.updatedBy as { id?: unknown; name?: unknown } | null | undefined;
  const sprint = program === "sprint-with-us";
  const phases = sprint
    ? ([
        readPhase(record.inceptionPhase, "INCEPTION"),
        readPhase(record.prototypePhase, "PROTOTYPE"),
        readPhase(record.implementationPhase, "IMPLEMENTATION"),
      ].filter((phase) => phase !== null) as StoredPhase[])
    : [];
  const weights: Record<string, number> = { questions: num(record.questionsWeight), price: num(record.priceWeight) };
  if (sprint) Object.assign(weights, { codeChallenge: num(record.codeChallengeWeight), scenario: num(record.scenarioWeight) });
  else weights.challenge = num(record.challengeWeight);
  return {
    ...listed,
    ...("updatedBy" in record
      ? { updatedBy: updatedBy && typeof updatedBy.id === "string" && typeof updatedBy.name === "string" ? { id: updatedBy.id, name: updatedBy.name } : null }
      : {}),
    publishedAt: typeof record.publishedAt === "string" ? record.publishedAt : null,
    teaser: text(record.teaser),
    description: text(record.description),
    assignmentDate: text(record.assignmentDate),
    startDate: text(record.startDate),
    completionDate: typeof record.completionDate === "string" ? record.completionDate : null,
    skills: Array.isArray(record.mandatorySkills) ? record.mandatorySkills.filter((skill): skill is string => typeof skill === "string") : [],
    phases,
    questions: list(sprint ? record.teamQuestions : record.resourceQuestions).map((question) => ({
      question: text(question.question),
      guideline: text(question.guideline),
      score: num(question.score),
      minimumScore: typeof question.minimumScore === "number" ? question.minimumScore : null,
      wordLimit: num(question.wordLimit),
    })),
    resources: list(record.resources).map((resource) => ({
      id: text(resource.id),
      serviceArea: text(resource.serviceArea),
      targetAllocation: num(resource.targetAllocation),
    })),
    weights,
    attachments: Array.isArray(record.attachments)
      ? record.attachments.map(readAttachment).filter((file): file is Attachment => file !== null)
      : [],
    ...(Array.isArray(record.evaluationPanel)
      ? {
          evaluationPanel: list(record.evaluationPanel).flatMap((member) => {
            const user = member.user as { id?: unknown; name?: unknown } | null;
            return user && typeof user.id === "string"
              ? [{ user: { id: user.id, name: text(user.name) }, evaluator: member.evaluator === true, chair: member.chair === true }]
              : [];
          }),
        }
      : {}),
    addenda: readAddenda(record.addenda),
    ...("history" in record ? { history: readHistory(record.history) } : {}),
    ...(readReporting(record.reporting) ? { reporting: readReporting(record.reporting)! } : {}),
    ...(readSuccessfulProponent(record.successfulProponent)
      ? { successfulProponent: readSuccessfulProponent(record.successfulProponent)! }
      : {}),
  };
}

/** What the form starts from, for an opportunity already kept. */
export function submissionFrom(opportunity: OtherProgramOpportunity): OtherProgramSubmission {
  const phases: Partial<Record<SwuPhase, PhaseEntry>> = {};
  for (const phase of opportunity.phases) {
    phases[phase.phase] = {
      startDate: phase.startDate,
      completionDate: phase.completionDate,
      maxBudget: phase.maxBudget > 0 ? phase.maxBudget : Number.NaN,
      requiredCapabilities: phase.requiredCapabilities,
    };
  }
  return {
    title: opportunity.title,
    teaser: opportunity.teaser,
    remoteOk: opportunity.remoteOk,
    remoteDesc: opportunity.remoteDesc,
    location: opportunity.location,
    budget: opportunity.value.amount > 0 ? opportunity.value.amount : Number.NaN,
    description: opportunity.description,
    proposalDeadline: opportunity.proposalDeadline,
    assignmentDate: opportunity.assignmentDate,
    startDate: opportunity.startDate,
    completionDate: opportunity.completionDate ?? "",
    skills: opportunity.skills,
    phases: opportunity.program === "sprint-with-us" && !phases.IMPLEMENTATION ? { ...phases, IMPLEMENTATION: BLANK_PHASE } : phases,
    questions: opportunity.questions.map((question) => ({ ...question, minimumScore: question.minimumScore ?? Number.NaN })),
    resources: opportunity.resources.map((resource) => ({ serviceArea: resource.serviceArea, targetAllocation: resource.targetAllocation })),
    weights: opportunity.weights,
    panel: (opportunity.evaluationPanel ?? []).map((member) => ({ user: member.user.id, evaluator: member.evaluator, chair: member.chair })),
    attachments: opportunity.attachments.map((attachment) => attachment.id),
  };
}

const numberOrNull = (value: number): number | null => (Number.isNaN(value) ? null : value);

/**
 * The content as a request carries it, named as the old service named it: the budget, the
 * questions and the weights under the program's own names, only the dates the program has, and a
 * resource only once its service area is chosen. A phase that is not there is sent as nothing, so
 * an edit removes it.
 */
export function contentOf(program: OtherProgram, submission: OtherProgramSubmission): Record<string, unknown> {
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
    attachments: [...submission.attachments],
  };
  if (program === "sprint-with-us") {
    const { INCEPTION, PROTOTYPE, IMPLEMENTATION } = submission.phases;
    const phaseOf = (entry: PhaseEntry) => ({
      startDate: entry.startDate,
      completionDate: entry.completionDate,
      maxBudget: numberOrNull(entry.maxBudget),
      requiredCapabilities: [...entry.requiredCapabilities],
    });
    return {
      ...common,
      totalMaxBudget: budget,
      mandatorySkills: submission.skills,
      inceptionPhase: INCEPTION ? phaseOf(INCEPTION) : null,
      prototypePhase: PROTOTYPE ? phaseOf(PROTOTYPE) : null,
      implementationPhase: phaseOf(IMPLEMENTATION ?? BLANK_PHASE),
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

/** A new opportunity's request: its content, the state asked for, and its panel as entered. */
export function bodyOf(program: OtherProgram, submission: OtherProgramSubmission, status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED") {
  return { ...contentOf(program, submission), status, evaluationPanel: submission.panel.filter((member) => member.user !== "") };
}

export type OtherProgramSaveAnswer =
  | { readonly kind: "saved"; readonly opportunity: OtherProgramOpportunity }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

async function answered(
  program: OtherProgram,
  request: Promise<{ data?: unknown; error?: unknown; response: Response }>,
): Promise<OtherProgramSaveAnswer> {
  try {
    const { data, error, response } = await request;
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

export function createOtherProgramOpportunity(
  program: OtherProgram,
  submission: OtherProgramSubmission,
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED",
): Promise<OtherProgramSaveAnswer> {
  const body = bodyOf(program, submission, status) as never;
  return answered(
    program,
    program === "sprint-with-us"
      ? api.POST("/api/opportunities/sprint-with-us", { body })
      : api.POST("/api/opportunities/team-with-us", { body }),
  );
}

/** The changes the manage page sends, by the tag the contract names. */
export type OtherProgramChange =
  | { readonly tag: "edit"; readonly submission: OtherProgramSubmission }
  | { readonly tag: "submitForReview" }
  | { readonly tag: "publish" }
  | { readonly tag: "editEvaluationPanel"; readonly panel: readonly PanelEntry[] };

function changeBody(program: OtherProgram, change: OtherProgramChange): { tag: string; value?: unknown } {
  switch (change.tag) {
    case "edit":
      return { tag: "edit", value: contentOf(program, change.submission) };
    case "editEvaluationPanel":
      return { tag: "editEvaluationPanel", value: change.panel.map((member) => ({ ...member })) };
    default:
      return { tag: change.tag };
  }
}

export function changeOtherProgramOpportunity(program: OtherProgram, id: string, change: OtherProgramChange): Promise<OtherProgramSaveAnswer> {
  const request = { params: { path: { id } }, body: changeBody(program, change) as never };
  return answered(
    program,
    program === "sprint-with-us"
      ? api.PUT("/api/opportunities/sprint-with-us/{id}", request)
      : api.PUT("/api/opportunities/team-with-us/{id}", request),
  );
}

/**
 * Makes a saved opportunity carry exactly these files, the rest as it stands, so a file is attached
 * as soon as it is chosen (decision record 0033).
 */
export function attachToOtherProgramOpportunity(program: OtherProgram, id: string, fileIds: readonly string[]): Promise<OtherProgramSaveAnswer> {
  const request = { params: { path: { id } }, body: { tag: "edit", value: { attachments: [...fileIds] } } as never };
  return answered(
    program,
    program === "sprint-with-us"
      ? api.PUT("/api/opportunities/sprint-with-us/{id}", request)
      : api.PUT("/api/opportunities/team-with-us/{id}", request),
  );
}

/** Cancelling or an addendum (decision record 0043). */
export function runOtherProgramOpportunity(program: OtherProgram, id: string, action: RunningAction): Promise<OtherProgramSaveAnswer> {
  const request = { params: { path: { id } }, body: runningBody(action) as never };
  return answered(
    program,
    program === "sprint-with-us"
      ? api.PUT("/api/opportunities/sprint-with-us/{id}", request)
      : api.PUT("/api/opportunities/team-with-us/{id}", request),
  );
}

/** Deletes a draft, or one under review (R-1.53). */
export function deleteOtherProgramOpportunity(program: OtherProgram, id: string): Promise<OtherProgramSaveAnswer> {
  const request = { params: { path: { id } } };
  return answered(
    program,
    program === "sprint-with-us"
      ? api.DELETE("/api/opportunities/sprint-with-us/{id}", request)
      : api.DELETE("/api/opportunities/team-with-us/{id}", request),
  );
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

/** Someone who may sit on an evaluation panel. */
export interface PanelCandidate {
  readonly id: string;
  readonly label: string;
}

/**
 * Who may be put on a panel: every active public sector employee and administrator, as the
 * service names them on a member of staff's own session (decision record 0045). Empty when it
 * cannot be read.
 */
export async function fetchPanelCandidates(): Promise<PanelCandidate[]> {
  try {
    const { data, response } = await api.GET("/api/sessions/{id}", { params: { path: { id: "current" } } });
    const candidates = response.ok ? (data as { panelCandidates?: unknown } | undefined)?.panelCandidates : null;
    return list(candidates).flatMap((candidate) =>
      typeof candidate.id === "string" ? [{ id: candidate.id, label: text(candidate.name) || candidate.id }] : [],
    );
  } catch {
    return [];
  }
}
