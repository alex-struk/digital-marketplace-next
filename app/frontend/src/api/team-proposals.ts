import type { SwuPhase } from "@rules/other-program-drafts";
import { PHASE_KEYS, ReferenceInput, ResponseInput, TeamProgram, TeamProposalStatus, isTeamProposalStatus } from "@rules/team-proposals";
import { SWU_PHASES } from "@rules/other-program-drafts";
import type { Scoresheet } from "@rules/proposal-evaluation";
import { api } from "./client";
import { Attachment, Person, readAttachment, reasonsIn } from "./opportunities";
import { readContact } from "./proposals";
import type { ProponentContact, ProposalHistoryEntry, ProposalListAnswer as CwuListAnswer } from "./proposals";

/**
 * Sprint With Us and Team With Us proposals, through the contract's list, create, read, update and
 * delete (decision record 0058 for the shape the service answers with). Answers are read
 * defensively rather than trusted.
 */

export interface PhaseTeam {
  readonly members: readonly { readonly member: Person; readonly scrumMaster: boolean }[];
  readonly proposedCost: number;
}

export interface TwuTeamMember {
  readonly member: Person;
  readonly resource: { readonly id: string; readonly serviceArea: string | null; readonly targetAllocation: number | null };
  readonly hourlyRate: number;
}

export interface TeamProposal {
  readonly program: TeamProgram;
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: Person | null;
  readonly status: TeamProposalStatus;
  readonly submittedAt: string | null;
  readonly opportunity: {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly proposalDeadline: string;
    readonly budget: number;
  };
  /** With its contact person to whoever may see the score (R-1.27). */
  readonly organization: { readonly id: string; readonly legalName: string; readonly contact?: ProponentContact } | null;
  readonly totalProposedCost: number | null;
  /** Sprint With Us: a team for each phase given. */
  readonly phases: Readonly<Partial<Record<SwuPhase, PhaseTeam>>>;
  readonly references: readonly ReferenceInput[];
  /** Team With Us. */
  readonly team: readonly TwuTeamMember[];
  readonly responses: readonly ResponseInput[];
  readonly attachments: readonly Attachment[];
  /** The name evaluators saw it under, once its opportunity closed (R-2.5). */
  readonly anonymousProponentName: string;
  /** Each stage's score, the total and the rank: to staff, and to the vendor once decided (R-2.32). */
  readonly scoresheet?: Scoresheet;
  /** Newest first (R-2.9). */
  readonly history: readonly ProposalHistoryEntry[];
}

function readScoresheet(value: unknown): Scoresheet | null {
  if (!isRecord(value)) return null;
  const score = (key: string) => (typeof value[key] === "number" ? (value[key] as number) : null);
  const rank = isRecord(value.rank) && typeof value.rank.rank === "number" && typeof value.rank.of === "number"
    ? { rank: value.rank.rank, of: value.rank.of }
    : null;
  return {
    questions: score("questions"),
    challenge: score("challenge"),
    scenario: score("scenario"),
    price: score("price"),
    total: score("total"),
    rank,
  };
}

type Record_ = Record<string, unknown>;
const isRecord = (value: unknown): value is Record_ => typeof value === "object" && value !== null;
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const list = (value: unknown): Record_[] => (Array.isArray(value) ? value.filter(isRecord) : []);

function readPerson(value: unknown): Person | null {
  return isRecord(value) && typeof value.id === "string" ? { id: value.id, name: text(value.name) } : null;
}

function readResponses(value: unknown): ResponseInput[] {
  return list(value).map((item) => ({ order: num(item.order), response: text(item.response) }));
}

export function readTeamProposal(program: TeamProgram, value: unknown): TeamProposal | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isTeamProposalStatus(program, value.status)) return null;
  const opportunity = isRecord(value.opportunity) ? value.opportunity : {};
  if (typeof opportunity.id !== "string") return null;
  const sprint = program === "sprint-with-us";
  const phases: Partial<Record<SwuPhase, PhaseTeam>> = {};
  if (sprint) {
    for (const phase of SWU_PHASES) {
      const team = value[PHASE_KEYS[phase]];
      if (!isRecord(team)) continue;
      phases[phase] = {
        members: list(team.members).flatMap((member) => {
          const person = readPerson(member.member);
          return person ? [{ member: person, scrumMaster: member.scrumMaster === true }] : [];
        }),
        proposedCost: num(team.proposedCost),
      };
    }
  }
  const organization = isRecord(value.organization) && typeof value.organization.id === "string" ? value.organization : null;
  return {
    program,
    id: value.id,
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt),
    createdBy: readPerson(value.createdBy),
    status: value.status,
    submittedAt: typeof value.submittedAt === "string" ? value.submittedAt : null,
    opportunity: {
      id: opportunity.id,
      title: text(opportunity.title),
      status: text(opportunity.status),
      proposalDeadline: text(opportunity.proposalDeadline),
      budget: num(sprint ? opportunity.totalMaxBudget : opportunity.maxBudget),
    },
    organization: organization
      ? {
          id: organization.id as string,
          legalName: text(organization.legalName),
          ...(readContact(organization.contact) ? { contact: readContact(organization.contact)! } : {}),
        }
      : null,
    totalProposedCost: typeof value.totalProposedCost === "number" ? value.totalProposedCost : null,
    phases,
    references: list(value.references).map((reference) => ({
      name: text(reference.name),
      company: text(reference.company),
      phone: text(reference.phone),
      email: text(reference.email),
    })),
    team: list(value.team).flatMap((entry) => {
      const member = readPerson(entry.member);
      const resource = isRecord(entry.resource) ? entry.resource : {};
      return member
        ? [
            {
              member,
              resource: {
                id: text(resource.id),
                serviceArea: typeof resource.serviceArea === "string" ? resource.serviceArea : null,
                targetAllocation: typeof resource.targetAllocation === "number" ? resource.targetAllocation : null,
              },
              hourlyRate: num(entry.hourlyRate),
            },
          ]
        : [];
    }),
    responses: readResponses(sprint ? value.teamQuestionResponses : value.resourceQuestionResponses),
    attachments: Array.isArray(value.attachments) ? value.attachments.map(readAttachment).filter((file): file is Attachment => file !== null) : [],
    anonymousProponentName: text(value.anonymousProponentName),
    ...(readScoresheet(value.scoresheet) ? { scoresheet: readScoresheet(value.scoresheet)! } : {}),
    history: list(value.history).map((entry) => ({
      createdAt: text(entry.createdAt),
      createdBy: readPerson(entry.createdBy),
      status: typeof entry.status === "string" ? entry.status : null,
      event: typeof entry.event === "string" ? entry.event : null,
      note: typeof entry.note === "string" ? entry.note : null,
    })),
  };
}

export type TeamProposalAnswer = { readonly kind: "found"; readonly proposal: TeamProposal } | { readonly kind: "missing" };

export async function fetchTeamProposal(program: TeamProgram, id: string): Promise<TeamProposalAnswer> {
  try {
    const params = { params: { path: { id } } };
    const { data, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/proposals/sprint-with-us/{id}", params)
        : await api.GET("/api/proposals/team-with-us/{id}", params);
    const proposal = response.ok ? readTeamProposal(program, data) : null;
    return proposal ? { kind: "found", proposal } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
}

export type TeamProposalListAnswer =
  | { readonly kind: "listed"; readonly proposals: readonly TeamProposal[] }
  | Exclude<CwuListAnswer, { kind: "listed" }>;

/** The proposals the service lets this person see, on one opportunity or on all (R-2.24, R-2.25). */
export async function listTeamProposals(program: TeamProgram, opportunity?: string): Promise<TeamProposalListAnswer> {
  try {
    const query = { params: { query: opportunity === undefined ? {} : { opportunity } } };
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.GET("/api/proposals/sprint-with-us", query)
        : await api.GET("/api/proposals/team-with-us", query);
    if (response.status === 401 || response.status === 403) return { kind: "refused", reasons: reasonsIn(error) };
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    return {
      kind: "listed",
      proposals: (data as unknown[]).map((entry) => readTeamProposal(program, entry)).filter((found): found is TeamProposal => found !== null),
    };
  } catch {
    return { kind: "failed" };
  }
}

export type TeamProposalSaveAnswer =
  | { readonly kind: "saved"; readonly proposal: TeamProposal }
  | {
      readonly kind: "refused";
      readonly reasons: readonly string[];
      readonly existingProposalId?: string;
      readonly existingOrganizationProposalId?: string;
    }
  | { readonly kind: "failed" };

function saveAnswerFor(program: TeamProgram, ok: boolean, data: unknown, error: unknown): TeamProposalSaveAnswer {
  if (ok) {
    const proposal = readTeamProposal(program, data);
    return proposal ? { kind: "saved", proposal } : { kind: "failed" };
  }
  const reasons = reasonsIn(error);
  if (reasons.length === 0) return { kind: "failed" };
  const body = isRecord(error) ? error : {};
  const existing = typeof body.existingProposalId === "string" ? body.existingProposalId : undefined;
  const named = isRecord(body.existingOrganizationProposal) ? body.existingOrganizationProposal.proposalId : undefined;
  return {
    kind: "refused",
    reasons,
    ...(existing ? { existingProposalId: existing } : {}),
    ...(typeof named === "string" ? { existingOrganizationProposalId: named } : {}),
  };
}

/** A new proposal, as a draft or as a submission (R-2.7); `content` is the program's request body. */
export async function createTeamProposal(
  program: TeamProgram,
  opportunity: string,
  content: Record<string, unknown>,
  status: "DRAFT" | "SUBMITTED",
): Promise<TeamProposalSaveAnswer> {
  try {
    const body = { opportunity, ...content, status } as never;
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.POST("/api/proposals/sprint-with-us", { body })
        : await api.POST("/api/proposals/team-with-us", { body });
    return saveAnswerFor(program, response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/**
 * One tagged change: new content, a submission, or a withdrawal (R-2.22, R-2.23); or, by the
 * opportunity's author or an administrator, an award or a disqualification with its reason (R-1.26,
 * R-2.34), a stage score out of 100 or a screening in to or out of the team scenario (R-2.28).
 */
export async function changeTeamProposal(
  program: TeamProgram,
  id: string,
  tag:
    | "edit"
    | "submit"
    | "withdraw"
    | "award"
    | "disqualify"
    | "scoreCodeChallenge"
    | "scoreTeamScenario"
    | "scoreChallenge"
    | "screenInToTeamScenario"
    | "screenOutFromTeamScenario",
  content?: Record<string, unknown> | string | number,
): Promise<TeamProposalSaveAnswer> {
  try {
    const request = { params: { path: { id } }, body: (content === undefined ? { tag } : { tag, value: content }) as never };
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.PUT("/api/proposals/sprint-with-us/{id}", request)
        : await api.PUT("/api/proposals/team-with-us/{id}", request);
    return saveAnswerFor(program, response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** Deletes a draft for good (R-2.4). */
export async function deleteTeamProposal(program: TeamProgram, id: string): Promise<TeamProposalSaveAnswer> {
  try {
    const request = { params: { path: { id } } };
    const { data, error, response } =
      program === "sprint-with-us"
        ? await api.DELETE("/api/proposals/sprint-with-us/{id}", request)
        : await api.DELETE("/api/proposals/team-with-us/{id}", request);
    return saveAnswerFor(program, response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}
