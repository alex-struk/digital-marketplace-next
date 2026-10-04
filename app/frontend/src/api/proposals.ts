import type { CwuStatus } from "@rules/opportunities";
import {
  CwuProposalStatus,
  IndividualProponent,
  blankIndividual,
  isCwuProposalStatus,
  readIndividual,
} from "@rules/proposals";
import type { Rank } from "@rules/proposal-evaluation";
import { api } from "./client";
import { Attachment, Person, reasonsIn } from "./opportunities";

/**
 * Code With Us proposals, through the contract's list, create, read, update and delete (decision
 * record 0055 for the shape the service answers with). The contract carries no response shapes, so
 * answers are read defensively rather than trusted.
 */

export interface ProposalHistoryEntry {
  readonly createdAt: string;
  readonly createdBy: Person | null;
  readonly status: string | null;
  readonly event: string | null;
  readonly note: string | null;
}

/** The contact person an organization names, given to whoever may see the proposal's score (R-1.27). */
export interface ProponentContact {
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
}

export type Proponent =
  | { readonly tag: "individual"; readonly value: IndividualProponent }
  | {
      readonly tag: "organization";
      readonly value: { readonly id: string; readonly legalName: string; readonly contact?: ProponentContact };
    };

export interface CwuProposal {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: Person | null;
  readonly status: CwuProposalStatus;
  readonly submittedAt: string | null;
  readonly opportunity: {
    readonly id: string;
    readonly title: string;
    readonly status: CwuStatus;
    readonly proposalDeadline: string;
    readonly reward: number;
  };
  readonly proposalText: string;
  readonly additionalComments: string;
  readonly proponent: Proponent;
  readonly attachments: readonly Attachment[];
  /** Present once the reader may see it (R-2.32). */
  readonly score?: number | null;
  /** Where it stands among the scored proposals, beside the score (R-2.32). */
  readonly rank?: Rank | null;
  /** Newest first (R-2.9). */
  readonly history: readonly ProposalHistoryEntry[];
}

type Record_ = Record<string, unknown>;
const isRecord = (value: unknown): value is Record_ => typeof value === "object" && value !== null;
const text = (value: unknown): string => (typeof value === "string" ? value : "");

function readPerson(value: unknown): Person | null {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" ? { id: value.id, name: value.name } : null;
}

function readAttachment(value: unknown): Attachment | null {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" ? { id: value.id, name: value.name } : null;
}

/** An organization's contact, when the answer carries one. */
export function readContact(value: unknown): ProponentContact | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.email !== "string") return null;
  return { name: value.name, email: value.email, phone: typeof value.phone === "string" && value.phone.trim() !== "" ? value.phone : null };
}

function readProponent(value: unknown): Proponent {
  if (isRecord(value) && value.tag === "organization" && isRecord(value.value) && typeof value.value.id === "string") {
    const contact = readContact(value.value.contact);
    return { tag: "organization", value: { id: value.value.id, legalName: text(value.value.legalName), ...(contact ? { contact } : {}) } };
  }
  return { tag: "individual", value: isRecord(value) ? readIndividual(value.value) : blankIndividual() };
}

function readRank(value: unknown): Rank | null {
  return isRecord(value) && typeof value.rank === "number" && typeof value.of === "number" ? { rank: value.rank, of: value.of } : null;
}

export function readCwuProposal(value: unknown): CwuProposal | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isCwuProposalStatus(value.status)) return null;
  const opportunity = isRecord(value.opportunity) ? value.opportunity : {};
  if (typeof opportunity.id !== "string") return null;
  return {
    id: value.id,
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt),
    createdBy: readPerson(value.createdBy),
    status: value.status,
    submittedAt: typeof value.submittedAt === "string" ? value.submittedAt : null,
    opportunity: {
      id: opportunity.id,
      title: text(opportunity.title),
      status: text(opportunity.status) as CwuStatus,
      proposalDeadline: text(opportunity.proposalDeadline),
      reward: typeof opportunity.reward === "number" ? opportunity.reward : 0,
    },
    proposalText: text(value.proposalText),
    additionalComments: text(value.additionalComments),
    proponent: readProponent(value.proponent),
    attachments: Array.isArray(value.attachments)
      ? value.attachments.map(readAttachment).filter((file): file is Attachment => file !== null)
      : [],
    ...("score" in value ? { score: typeof value.score === "number" ? value.score : null } : {}),
    ...("rank" in value ? { rank: readRank(value.rank) } : {}),
    history: Array.isArray(value.history)
      ? value.history.filter(isRecord).map((entry) => ({
          createdAt: text(entry.createdAt),
          createdBy: readPerson(entry.createdBy),
          status: typeof entry.status === "string" ? entry.status : null,
          event: typeof entry.event === "string" ? entry.event : null,
          note: typeof entry.note === "string" ? entry.note : null,
        }))
      : [],
  };
}

/** What reading one proposal came back with. */
export type ProposalAnswer =
  | { readonly kind: "found"; readonly proposal: CwuProposal }
  /** No proposal there, or none this person may read: the same to a person (R-2.4, R-2.24). */
  | { readonly kind: "missing" };

export async function fetchCwuProposal(id: string): Promise<ProposalAnswer> {
  try {
    const { data, response } = await api.GET("/api/proposals/code-with-us/{id}", { params: { path: { id } } });
    const proposal = response.ok ? readCwuProposal(data) : null;
    return proposal ? { kind: "found", proposal } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
}

export type ProposalListAnswer =
  | { readonly kind: "listed"; readonly proposals: readonly CwuProposal[] }
  /** Staff asking before the opportunity has closed, with the service's reason (R-1.31, R-2.25). */
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

/** The proposals the service lets this person see, on one opportunity or on all (R-2.24). */
export async function listCwuProposals(opportunity?: string): Promise<ProposalListAnswer> {
  try {
    const { data, error, response } = await api.GET("/api/proposals/code-with-us", {
      params: { query: opportunity === undefined ? {} : { opportunity } },
    });
    if (response.status === 401 || response.status === 403) return { kind: "refused", reasons: reasonsIn(error) };
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    return { kind: "listed", proposals: (data as unknown[]).map(readCwuProposal).filter((found): found is CwuProposal => found !== null) };
  } catch {
    return { kind: "failed" };
  }
}

/** What saving, submitting, withdrawing or deleting came back with. */
export type ProposalSaveAnswer =
  | { readonly kind: "saved"; readonly proposal: CwuProposal }
  | {
      readonly kind: "refused";
      readonly reasons: readonly string[];
      /** The proposal this vendor already holds, when that is why (R-2.2). */
      readonly existingProposalId?: string;
      /** The proposal already naming the organization, when that is why (R-2.11). */
      readonly existingOrganizationProposalId?: string;
    }
  | { readonly kind: "failed" };

function saveAnswerFor(ok: boolean, data: unknown, error: unknown): ProposalSaveAnswer {
  if (ok) {
    const proposal = readCwuProposal(data);
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

/** What the proposal form sends. */
export interface CwuProposalSubmission {
  readonly proposalText: string;
  readonly additionalComments: string;
  readonly proponent:
    | { readonly tag: "individual"; readonly value: IndividualProponent }
    | { readonly tag: "organization"; readonly value: string };
  readonly attachments: readonly string[];
}

/** A new proposal, as a draft or as a submission (R-2.7). */
export async function createCwuProposal(
  opportunity: string,
  submission: CwuProposalSubmission,
  status: "DRAFT" | "SUBMITTED",
): Promise<ProposalSaveAnswer> {
  try {
    const { data, error, response } = await api.POST("/api/proposals/code-with-us", {
      body: { opportunity, ...submission, status } as never,
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/**
 * One tagged change: the vendor's new content, submission or withdrawal (R-2.23), or, once the
 * opportunity has closed, a score out of 100, a disqualification with its reason, or an award
 * (R-2.26, R-2.33, R-2.34).
 */
export async function changeCwuProposal(
  id: string,
  tag: "edit" | "submit" | "withdraw" | "score" | "disqualify" | "award",
  value?: CwuProposalSubmission | number | string,
): Promise<ProposalSaveAnswer> {
  try {
    const { data, error, response } = await api.PUT("/api/proposals/code-with-us/{id}", {
      params: { path: { id } },
      body: (value === undefined ? { tag } : { tag, value }) as never,
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** Deletes a draft for good (R-2.4). */
export async function deleteCwuProposal(id: string): Promise<ProposalSaveAnswer> {
  try {
    const { data, error, response } = await api.DELETE("/api/proposals/code-with-us/{id}", { params: { path: { id } } });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** One organization the signed-in vendor may put a proposal forward for. */
export interface ActingFor {
  readonly id: string;
  readonly legalName: string;
}

/** The organizations a vendor owns or administers, from `/api/ownedOrganizations` (R-3.15). */
export async function fetchOrganizationsActingFor(): Promise<readonly ActingFor[]> {
  try {
    const { data, response } = await api.GET("/api/ownedOrganizations");
    if (!response.ok || !Array.isArray(data)) return [];
    return (data as unknown[])
      .filter(isRecord)
      .filter((entry) => typeof entry.id === "string" && typeof entry.legalName === "string")
      .map((entry) => ({ id: entry.id as string, legalName: entry.legalName as string }));
  } catch {
    return [];
  }
}
