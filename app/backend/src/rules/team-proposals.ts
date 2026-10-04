/**
 * Sprint With Us and Team With Us proposals, as plain TypeScript (decision record 0058).
 *
 * A proposal in these two programs is put forward for an organization, with a team drawn from that
 * organization's members — for Sprint With Us a team for each of the opportunity's phases with one
 * scrum master and a proposed cost, for Team With Us people named against the opportunity's
 * resources at an hourly rate — and an answer to each of the opportunity's questions. The service
 * and the single-page app both call these, so the form says what the service will refuse before it
 * is sent (R-2.16 to R-2.22). Who may read, manage and list proposals is `proposals.ts`'s, one rule
 * for every program.
 */

import { CalendarDay, isCalendarDay } from "./opportunities";
import { SWU_PHASES, SwuPhase } from "./other-program-drafts";
import { isPhoneNumber } from "./organizations";
import { identifierOf, readAttachments } from "./proposals";
import { isEmailAddress } from "./users";

export type TeamProgram = "sprint-with-us" | "team-with-us";

export function isTeamProgram(value: unknown): value is TeamProgram {
  return value === "sprint-with-us" || value === "team-with-us";
}

export const TEAM_PROGRAM_NAMES: Readonly<Record<TeamProgram, string>> = {
  "sprint-with-us": "Sprint With Us",
  "team-with-us": "Team With Us",
};

// ------------------------------------------------------------------------ states

/** The states a Sprint With Us proposal may hold. */
export const SWU_PROPOSAL_STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW_QUESTIONS",
  "EVALUATED_QUESTIONS",
  "UNDER_REVIEW_CODE_CHALLENGE",
  "EVALUATED_CODE_CHALLENGE",
  "UNDER_REVIEW_TEAM_SCENARIO",
  "EVALUATED_TEAM_SCENARIO",
  "AWARDED",
  "NOT_AWARDED",
  "DISQUALIFIED",
  "WITHDRAWN",
] as const;

/** The states a Team With Us proposal may hold. */
export const TWU_PROPOSAL_STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW_QUESTIONS",
  "EVALUATED_QUESTIONS",
  "UNDER_REVIEW_CHALLENGE",
  "EVALUATED_CHALLENGE",
  "AWARDED",
  "NOT_AWARDED",
  "DISQUALIFIED",
  "WITHDRAWN",
] as const;

export type TeamProposalStatus = (typeof SWU_PROPOSAL_STATES)[number] | (typeof TWU_PROPOSAL_STATES)[number];

export function isTeamProposalStatus(program: TeamProgram, value: unknown): value is TeamProposalStatus {
  const states: readonly string[] = program === "sprint-with-us" ? SWU_PROPOSAL_STATES : TWU_PROPOSAL_STATES;
  return typeof value === "string" && states.includes(value);
}

/**
 * A proposal that has been put forward may be withdrawn at any time, whatever has happened to it
 * since, until it is disqualified (R-2.23).
 */
export function mayWithdrawTeamProposalFrom(status: string): boolean {
  return !["DRAFT", "WITHDRAWN", "DISQUALIFIED"].includes(status);
}

/** Whether the organization it names may still change: only while it is a draft or withdrawn (R-2.22). */
export function organizationIsLocked(status: string): boolean {
  return status !== "DRAFT" && status !== "WITHDRAWN";
}

/** What the manage page's action bar offers in each state (design/DESIGN.md, proposals, "Who is offered what"). */
export function offeredTeamProposalActions(status: string): {
  readonly edit: boolean;
  readonly submit: boolean;
  readonly withdraw: boolean;
  readonly delete: boolean;
} {
  return {
    edit: status === "DRAFT" || status === "SUBMITTED" || status === "WITHDRAWN",
    submit: status === "DRAFT" || status === "WITHDRAWN",
    withdraw: mayWithdrawTeamProposalFrom(status),
    delete: status === "DRAFT",
  };
}

// ------------------------------------------------------------------------ refusals

export const ORGANIZATION_REQUIRED = "An organization must be specified before submitting.";
export const ORGANIZATION_LOCKED = "Organization cannot be changed once the proposal has been submitted";
export const NOT_ACTIVE_MEMBER = "User is not an active member of the organization.";
export const UNIQUE_MEMBERS = "Please select unique team members.";
export const PHASE_REQUIRED = "This opportunity requires this phase.";
export const PHASE_NOT_REQUIRED = "This opportunity does not require this phase.";
export const AT_LEAST_ONE_MEMBER = "Please select at least one team member.";
export const SINGLE_SCRUM_MASTER = "You may only specify a single scrum master.";
export const ONE_SCRUM_MASTER = "Please select a scrum master for this phase.";
export const OVER_TOTAL_BUDGET = "The proposed cost exceeds the maximum budget for this opportunity.";
export const NO_MATCHING_QUESTION = "No matching opportunity question.";
export const SERVICE_AREAS_NOT_SATISFIED = "The selected organization does not satisfy this opportunity's service areas.";
export const NAME_A_TEAM_MEMBER = "Name at least one team member.";
export const HOURLY_RATE_TOO_LOW = "Please enter an hourly rate of at least $1.";
export const RESOURCE_NOT_FOUND = "The specified resource could not be found.";
export const PHASE_TEAM_NAMED_TWICE = "The proposal could not be saved: a phase names the same person more than once.";

export function notQualified(program: TeamProgram): string {
  return `This organization is not qualified to submit proposals to ${TEAM_PROGRAM_NAMES[program]} opportunities.`;
}

/** "Please enter a Proposed Cost less than or equal to 200,000." (proposal-swu-create, cost_errors). */
export function phaseCostTooHigh(maxBudget: number): string {
  return `Please enter a Proposed Cost less than or equal to ${maxBudget.toLocaleString("en-CA")}.`;
}

export const PHASE_COST_REQUIRED = "Please enter a Proposed Cost greater than zero.";

export function responseLengthMessage(wordLimit: number): string {
  return `Response must be between 1 and ${wordLimit} words long.`;
}

export function capabilityGapMessage(missing: readonly string[]): string {
  return `Your team does not hold every capability this opportunity requires: ${missing.join(", ")}.`;
}

// ------------------------------------------------------------------------ what a proposal holds

export const PHASE_KEYS: Readonly<Record<SwuPhase, "inceptionPhase" | "prototypePhase" | "implementationPhase">> = {
  INCEPTION: "inceptionPhase",
  PROTOTYPE: "prototypePhase",
  IMPLEMENTATION: "implementationPhase",
};

export interface PhaseMemberInput {
  readonly member: string;
  readonly scrumMaster: boolean;
}

export interface PhaseTeamInput {
  readonly members: readonly PhaseMemberInput[];
  /** null while none is entered. */
  readonly proposedCost: number | null;
}

export interface ResponseInput {
  readonly order: number;
  readonly response: string;
}

export interface ReferenceInput {
  readonly name: string;
  readonly company: string;
  readonly phone: string;
  readonly email: string;
}

export interface SwuProposalInput {
  /** The organization's identifier, or "" while none is chosen. */
  readonly organization: string;
  /** The phases the proposal gives a team to; one it leaves out is absent. */
  readonly phases: Partial<Record<SwuPhase, PhaseTeamInput>>;
  readonly responses: readonly ResponseInput[];
  readonly references: readonly ReferenceInput[];
  readonly attachments: readonly string[];
}

export interface TwuMemberInput {
  readonly member: string;
  /** The resource's identifier. */
  readonly resource: string;
  readonly hourlyRate: number | null;
}

export interface TwuProposalInput {
  readonly organization: string;
  readonly team: readonly TwuMemberInput[];
  readonly responses: readonly ResponseInput[];
  readonly attachments: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const LIST_MAX = 100;
const INT_MAX = 2_147_483_647;

/** A whole amount given as a number or as text ("$1,200"), or null for anything else. */
export function amountFrom(value: unknown): number | null {
  const amount =
    typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value.replace(/[$,\s]/g, "")) : Number.NaN;
  return Number.isFinite(amount) && Math.abs(amount) <= INT_MAX ? Math.round(amount) : null;
}

const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value.slice(0, LIST_MAX) : []);
const idOf = (value: unknown): string => (identifierOf(value) ?? "").trim().toLowerCase();
const yes = (value: unknown): boolean => value === true || value === "yes" || value === "true";

function responsesFrom(value: unknown): ResponseInput[] {
  return list(value)
    .filter(isRecord)
    .map((item, index) => ({ order: Number.isInteger(item.order) ? (item.order as number) : index, response: text(item.response) }));
}

function phaseFrom(value: unknown): PhaseTeamInput | undefined {
  if (!isRecord(value)) return undefined;
  return {
    members: list(value.members)
      .filter(isRecord)
      .map((item) => ({ member: idOf(item.member), scrumMaster: yes(item.scrumMaster) }))
      .filter((item) => item.member !== ""),
    proposedCost: amountFrom(value.proposedCost),
  };
}

/** Reads a Sprint With Us proposal's content loosely; what it says is judged afterwards. */
export function readSwuProposalInput(body: unknown): SwuProposalInput {
  const given = isRecord(body) ? body : {};
  const phases: Partial<Record<SwuPhase, PhaseTeamInput>> = {};
  for (const phase of SWU_PHASES) {
    const team = phaseFrom(given[PHASE_KEYS[phase]]);
    if (team) phases[phase] = team;
  }
  return {
    organization: idOf(given.organization),
    phases,
    responses: responsesFrom(given.teamQuestionResponses),
    references: list(given.references)
      .filter(isRecord)
      .map((item) => ({ name: text(item.name), company: text(item.company), phone: text(item.phone), email: text(item.email) })),
    attachments: readAttachments(given.attachments),
  };
}

/** Reads a Team With Us proposal's content loosely; what it says is judged afterwards. */
export function readTwuProposalInput(body: unknown): TwuProposalInput {
  const given = isRecord(body) ? body : {};
  return {
    organization: idOf(given.organization),
    team: list(given.team)
      .filter(isRecord)
      .map((item) => ({ member: idOf(item.member), resource: idOf(item.resource), hourlyRate: amountFrom(item.hourlyRate) })),
    responses: responsesFrom(given.resourceQuestionResponses),
    attachments: readAttachments(given.attachments),
  };
}

/** The request body a Sprint With Us proposal's content is sent as, the old service's names. */
export function swuBodyOf(input: SwuProposalInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    organization: input.organization === "" ? null : input.organization,
    teamQuestionResponses: input.responses.map((response) => ({ ...response })),
    references: input.references.map((reference, order) => ({ ...reference, order })),
    attachments: [...input.attachments],
  };
  for (const phase of SWU_PHASES) {
    const team = input.phases[phase];
    if (team) body[PHASE_KEYS[phase]] = { members: team.members.map((member) => ({ ...member })), proposedCost: team.proposedCost };
  }
  return body;
}

export function twuBodyOf(input: TwuProposalInput): Record<string, unknown> {
  return {
    organization: input.organization === "" ? null : input.organization,
    team: input.team.map((member) => ({ ...member })),
    resourceQuestionResponses: input.responses.map((response) => ({ ...response })),
    attachments: [...input.attachments],
  };
}

// ------------------------------------------------------------------------ what it is judged against

export interface QuestionForProposal {
  readonly order: number;
  readonly question: string;
  readonly wordLimit: number;
}

export interface PhaseForProposal {
  readonly phase: SwuPhase;
  readonly maxBudget: number;
  readonly requiredCapabilities: readonly string[];
}

export interface SwuOpportunityForProposal {
  readonly totalMaxBudget: number;
  readonly phases: readonly PhaseForProposal[];
  readonly questions: readonly QuestionForProposal[];
}

export interface ResourceForProposal {
  readonly id: string;
  readonly serviceArea: string;
  readonly targetAllocation: number;
}

export interface TwuOpportunityForProposal {
  readonly maxBudget: number;
  readonly startDate: CalendarDay | null;
  readonly completionDate: CalendarDay | null;
  readonly resources: readonly ResourceForProposal[];
  readonly questions: readonly QuestionForProposal[];
}

/** A person a team names, as they stand with the proposal's organization. */
export interface MemberStanding {
  readonly id: string;
  readonly name: string;
  /** Their membership of the proposal's organization, or null for none. */
  readonly membershipStatus: "ACTIVE" | "PENDING" | "INACTIVE" | null;
  readonly capabilities: readonly string[];
}

/** The organization a proposal names, as far as putting one forward is concerned. */
export interface OrganizationForProposal {
  readonly id: string;
  readonly active: boolean;
  readonly swuQualified: boolean;
  readonly twuQualified: boolean;
  /** The service areas it is approved for, by key. */
  readonly serviceAreas: readonly string[];
}

export interface TeamProblem {
  /**
   * The field as the request names it: `organization`, a phase (`implementationPhase`) or its
   * `.members` or `.proposedCost`, `totalProposedCost`, `team` or one member (`team.2.hourlyRate`,
   * numbered from 1), or one answer (`teamQuestionResponses.0.response`, by the order it was sent
   * against), or `references.1.email`.
   */
  readonly field: string;
  readonly message: string;
}

export function teamRefusalLine(problem: TeamProblem): string {
  return `${problem.field}: ${problem.message}`;
}

export function teamProblemFromLine(line: string): TeamProblem | null {
  const match = /^([A-Za-z]+(?:\.[A-Za-z0-9]+)*): (.+)$/s.exec(line);
  return match ? { field: match[1] as string, message: match[2] as string } : null;
}

/** How many words a response holds, as the word limit counts them. */
export function wordCount(response: string): number {
  const trimmed = response.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Each answer against the opportunity's questions (R-2.21): one numbered against no question is
 * refused for its numbering, and one empty or over its question's word limit for its wording. A
 * question left unanswered is an empty answer.
 */
export function responseProblems(key: string, responses: readonly ResponseInput[], questions: readonly QuestionForProposal[]): TeamProblem[] {
  const problems: TeamProblem[] = [];
  for (const response of responses) {
    const question = questions.find((entry) => entry.order === response.order);
    if (!question) {
      problems.push({ field: `${key}.${response.order}.order`, message: NO_MATCHING_QUESTION });
      continue;
    }
    const words = wordCount(response.response);
    if (words < 1 || words > question.wordLimit) {
      problems.push({ field: `${key}.${response.order}.response`, message: responseLengthMessage(question.wordLimit) });
    }
  }
  for (const question of questions) {
    if (!responses.some((response) => response.order === question.order)) {
      problems.push({ field: `${key}.${question.order}.response`, message: responseLengthMessage(question.wordLimit) });
    }
  }
  return problems;
}

/** A Sprint With Us proposal's total proposed cost: the phases' costs added up. */
export function swuTotalCost(input: Pick<SwuProposalInput, "phases">): number {
  return SWU_PHASES.reduce((sum, phase) => sum + Math.max(input.phases[phase]?.proposedCost ?? 0, 0), 0);
}

/** The capabilities the members named across every phase hold between them. */
function heldCapabilities(input: SwuProposalInput, members: ReadonlyMap<string, MemberStanding>): Set<string> {
  const held = new Set<string>();
  for (const phase of SWU_PHASES) {
    for (const named of input.phases[phase]?.members ?? []) {
      const standing = members.get(named.member);
      if (standing?.membershipStatus === "ACTIVE") for (const capability of standing.capabilities) held.add(capability);
    }
  }
  return held;
}

/**
 * What one phase's team still lacks, as the form shows it beside that phase (proposal-swu-create,
 * phase_requirements): it names nobody, names someone whose membership is not active, or leaves a
 * required capability unheld.
 */
export function phaseShortfall(
  team: PhaseTeamInput | undefined,
  phase: PhaseForProposal,
  members: ReadonlyMap<string, MemberStanding>,
): { readonly complete: boolean; readonly empty: boolean; readonly pending: boolean; readonly missing: readonly string[] } {
  const named = team?.members ?? [];
  const standings = named.map((member) => members.get(member.member));
  const held = new Set(standings.filter((standing) => standing?.membershipStatus === "ACTIVE").flatMap((standing) => standing?.capabilities ?? []));
  const missing = phase.requiredCapabilities.filter((capability) => !held.has(capability));
  const empty = named.length === 0;
  const pending = standings.some((standing) => standing?.membershipStatus !== "ACTIVE");
  return { complete: !empty && !pending && missing.length === 0, empty, pending, missing };
}

/**
 * The messages a cost field stands against, before anything is sent (proposal-swu-create,
 * cost_errors). A phase whose maximum budget is not recorded (0: the phase's budget was left blank on
 * the opportunity form) is held to the total alone (decision records 0058, 0059).
 */
export function swuCostProblems(input: Pick<SwuProposalInput, "phases">, opportunity: SwuOpportunityForProposal): TeamProblem[] {
  const problems: TeamProblem[] = [];
  for (const phase of opportunity.phases) {
    const cost = input.phases[phase.phase]?.proposedCost ?? null;
    if (cost !== null && phase.maxBudget > 0 && cost > phase.maxBudget) {
      problems.push({ field: `${PHASE_KEYS[phase.phase]}.proposedCost`, message: phaseCostTooHigh(phase.maxBudget) });
    }
  }
  if (swuTotalCost(input) > opportunity.totalMaxBudget) problems.push({ field: "totalProposedCost", message: OVER_TOTAL_BUDGET });
  return problems;
}

/**
 * Every problem with a Sprint With Us proposal put forward (R-2.16, R-2.18, R-2.19, R-2.21): an
 * organization named, and qualified for the program at this moment; a team for each of the
 * opportunity's phases and no other; in each, at least one member, one scrum master and no more,
 * everyone an active member of the organization, and a cost within the phase's maximum; a total
 * within the opportunity's maximum; every capability the phases require held by someone named; and
 * an answer to each question within its word limit. The same person in one phase twice is not a
 * refusal here: the service cannot store it (`PHASE_TEAM_NAMED_TWICE`).
 */
export function swuProposalProblems(
  input: SwuProposalInput,
  opportunity: SwuOpportunityForProposal,
  organization: OrganizationForProposal | null,
  members: ReadonlyMap<string, MemberStanding>,
): TeamProblem[] {
  if (input.organization === "") return [{ field: "organization", message: ORGANIZATION_REQUIRED }];
  if (!organization || !organization.active || !organization.swuQualified) {
    return [{ field: "organization", message: notQualified("sprint-with-us") }];
  }
  const problems: TeamProblem[] = [];
  const offered = new Set(opportunity.phases.map((phase) => phase.phase));
  for (const phase of SWU_PHASES) {
    const key = PHASE_KEYS[phase];
    const team = input.phases[phase];
    if (!offered.has(phase)) {
      if (team) problems.push({ field: key, message: PHASE_NOT_REQUIRED });
      continue;
    }
    if (!team) {
      problems.push({ field: key, message: PHASE_REQUIRED });
      continue;
    }
    if (team.members.length === 0) problems.push({ field: `${key}.members`, message: AT_LEAST_ONE_MEMBER });
    const scrumMasters = team.members.filter((member) => member.scrumMaster).length;
    if (scrumMasters > 1) problems.push({ field: `${key}.members`, message: SINGLE_SCRUM_MASTER });
    else if (scrumMasters === 0 && team.members.length > 0) problems.push({ field: `${key}.members`, message: ONE_SCRUM_MASTER });
    if (team.members.some((member) => members.get(member.member)?.membershipStatus !== "ACTIVE")) {
      problems.push({ field: `${key}.members`, message: NOT_ACTIVE_MEMBER });
    }
    if (team.proposedCost === null || team.proposedCost <= 0) problems.push({ field: `${key}.proposedCost`, message: PHASE_COST_REQUIRED });
  }
  problems.push(...swuCostProblems(input, opportunity));
  const required = [...new Set(opportunity.phases.flatMap((phase) => phase.requiredCapabilities))];
  const held = heldCapabilities(input, members);
  const missing = required.filter((capability) => !held.has(capability));
  if (missing.length > 0) problems.push({ field: "team", message: capabilityGapMessage(missing) });
  problems.push(...responseProblems("teamQuestionResponses", input.responses, opportunity.questions));
  input.references.forEach((reference, index) => {
    const key = `references.${index + 1}`;
    if (reference.name.trim() === "") problems.push({ field: `${key}.name`, message: "Enter the reference's name." });
    if (!isEmailAddress(reference.email.trim())) problems.push({ field: `${key}.email`, message: "Enter an email address in the form name@example.com." });
    if (reference.phone.trim() !== "" && !isPhoneNumber(reference.phone.trim())) {
      problems.push({ field: `${key}.phone`, message: "Enter a phone number in a valid format, like 250-555-0100, or leave it blank." });
    }
  });
  return problems;
}

/** Whether any phase names the same person twice, which the kept schema cannot hold. */
export function phaseNamesSomeoneTwice(input: Pick<SwuProposalInput, "phases">): boolean {
  return SWU_PHASES.some((phase) => {
    const named = (input.phases[phase]?.members ?? []).map((member) => member.member);
    return new Set(named).size !== named.length;
  });
}

/** Hours in a working day, by which a Team With Us hourly rate becomes a cost (decision record 0058). */
export const HOURS_PER_DAY = 7.5;

/** The working days (Monday to Friday) from one calendar day to another, both included. */
export function workingDays(from: CalendarDay, to: CalendarDay): number {
  if (!isCalendarDay(from) || !isCalendarDay(to) || to < from) return 0;
  const start = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const end = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  let days = 0;
  for (let moment = start; moment <= end; moment += 86_400_000) {
    const weekday = new Date(moment).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return days;
}

/**
 * What a Team With Us proposal's rates come to over the contract (R-2.10): each named person's
 * hourly rate, at their resource's target allocation, for every working day of the contract
 * period. Null when the opportunity has no completion date to count to.
 */
export function twuContractCost(team: readonly TwuMemberInput[], opportunity: TwuOpportunityForProposal): number | null {
  if (!opportunity.startDate || !opportunity.completionDate) return null;
  const days = workingDays(opportunity.startDate, opportunity.completionDate);
  const allocation = new Map(opportunity.resources.map((resource) => [resource.id, resource.targetAllocation]));
  const cost = team.reduce(
    (sum, member) => sum + Math.max(member.hourlyRate ?? 0, 0) * ((allocation.get(member.resource) ?? 0) / 100) * HOURS_PER_DAY * days,
    0,
  );
  return Math.round(cost);
}

/** The ceiling, checked on create and on edit, whatever the proposal's state (R-2.10). */
export function twuBudgetProblems(team: readonly TwuMemberInput[], opportunity: TwuOpportunityForProposal): TeamProblem[] {
  const cost = twuContractCost(team, opportunity);
  return cost !== null && cost > opportunity.maxBudget ? [{ field: "totalProposedCost", message: OVER_TOTAL_BUDGET }] : [];
}

/**
 * Every problem with a Team With Us proposal put forward (R-2.17, R-2.18, R-2.20, R-2.21): an
 * organization named, qualified for the program and approved for every service area the
 * opportunity's resources call for; at least one team member, each an active member of the
 * organization, named once, at an hourly rate of at least $1, against a resource that exists —
 * whether it is this opportunity's is not asked (R-2.20); and an answer to each question within its
 * word limit. `knownResources` is every resource the service holds that the team names.
 */
export function twuProposalProblems(
  input: TwuProposalInput,
  opportunity: TwuOpportunityForProposal,
  organization: OrganizationForProposal | null,
  members: ReadonlyMap<string, MemberStanding>,
  knownResources: ReadonlySet<string>,
): TeamProblem[] {
  if (input.organization === "") return [{ field: "organization", message: ORGANIZATION_REQUIRED }];
  if (!organization || !organization.active || !organization.twuQualified) {
    return [{ field: "organization", message: notQualified("team-with-us") }];
  }
  const problems: TeamProblem[] = [];
  const needed = [...new Set(opportunity.resources.map((resource) => resource.serviceArea))];
  if (needed.some((area) => !organization.serviceAreas.includes(area))) {
    problems.push({ field: "organization", message: SERVICE_AREAS_NOT_SATISFIED });
  }
  if (input.team.length === 0) problems.push({ field: "team", message: NAME_A_TEAM_MEMBER });
  const seen = new Set<string>();
  input.team.forEach((member, index) => {
    const key = `team.${index + 1}`;
    if (members.get(member.member)?.membershipStatus !== "ACTIVE") problems.push({ field: `${key}.member`, message: NOT_ACTIVE_MEMBER });
    if (seen.has(member.member)) problems.push({ field: `${key}.member`, message: UNIQUE_MEMBERS });
    seen.add(member.member);
    if (member.hourlyRate === null || member.hourlyRate < 1) problems.push({ field: `${key}.hourlyRate`, message: HOURLY_RATE_TOO_LOW });
    if (!knownResources.has(member.resource)) problems.push({ field: `${key}.resource`, message: RESOURCE_NOT_FOUND });
  });
  problems.push(...twuBudgetProblems(input.team, opportunity));
  problems.push(...responseProblems("resourceQuestionResponses", input.responses, opportunity.questions));
  return problems;
}

/** The longest answer a draft may keep: what a stored response is refused for even unfinished. */
export const RESPONSE_TEXT_MAX = 100_000;

/** What a draft is refused for however unfinished (R-2.12): only what could not be kept. */
export function draftTeamProblems(responses: readonly ResponseInput[], key: string): TeamProblem[] {
  return responses
    .filter((response) => response.response.length > RESPONSE_TEXT_MAX)
    .map((response) => ({ field: `${key}.${response.order}.response`, message: "Responses must be 100,000 characters or fewer." }));
}
