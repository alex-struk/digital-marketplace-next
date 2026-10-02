import type { CwuStatus } from "@rules/opportunities";
import { api } from "./client";

/**
 * Code With Us opportunities, through the contract's list, create, read, update and delete
 * (decision record 0029 for the shape the service answers with). The contract carries no response
 * shapes, so answers are read defensively rather than trusted.
 */

export interface Person {
  readonly id: string;
  readonly name: string;
}

/** A stored file attached to an opportunity. */
export interface Attachment {
  readonly id: string;
  readonly name: string;
}

export interface HistoryEntry {
  readonly createdAt: string;
  readonly createdBy: Person | null;
  readonly status: string | null;
  readonly event: string | null;
  readonly note: string | null;
}

export interface CwuOpportunity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Absent unless the reader may see who created and changed it (R-1.29). */
  readonly createdBy?: Person | null;
  readonly updatedBy?: Person | null;
  readonly status: CwuStatus;
  readonly publishedAt: string | null;
  readonly title: string;
  readonly teaser: string;
  readonly remoteOk: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  readonly reward: number;
  readonly skills: readonly string[];
  readonly description: string;
  readonly proposalDeadline: string;
  readonly assignmentDate: string;
  readonly startDate: string;
  readonly completionDate: string | null;
  readonly attachments: readonly Attachment[];
  /** Absent unless the reader is the author or an administrator (R-1.30). */
  readonly history?: readonly HistoryEntry[];
  /** Whether the reader watches it (R-1.5). */
  readonly subscribed: boolean;
}

const STATES: readonly string[] = ["DRAFT", "UNDER_REVIEW", "PUBLISHED", "EVALUATION", "PROCESSING", "AWARDED", "CANCELED"];

const text = (value: unknown): string => (typeof value === "string" ? value : "");

function readPerson(value: unknown): Person | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string" ? { id: record.id, name: record.name } : null;
}

function readAttachment(value: unknown): Attachment | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string" ? { id: record.id, name: record.name } : null;
}

function readHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      createdAt: text(entry.createdAt),
      createdBy: readPerson(entry.createdBy),
      status: typeof entry.status === "string" ? entry.status : null,
      event: typeof entry.event === "string" ? entry.event : null,
      note: typeof entry.note === "string" ? entry.note : null,
    }));
}

export function readCwuOpportunity(value: unknown): CwuOpportunity | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !STATES.includes(record.status as string)) return null;
  return {
    id: record.id,
    createdAt: text(record.createdAt),
    updatedAt: text(record.updatedAt),
    ...("createdBy" in record ? { createdBy: readPerson(record.createdBy) } : {}),
    ...("updatedBy" in record ? { updatedBy: readPerson(record.updatedBy) } : {}),
    status: record.status as CwuStatus,
    publishedAt: typeof record.publishedAt === "string" ? record.publishedAt : null,
    title: text(record.title),
    teaser: text(record.teaser),
    remoteOk: record.remoteOk === true,
    remoteDesc: text(record.remoteDesc),
    location: text(record.location),
    reward: typeof record.reward === "number" ? record.reward : 0,
    skills: Array.isArray(record.skills) ? record.skills.filter((skill): skill is string => typeof skill === "string") : [],
    description: text(record.description),
    proposalDeadline: text(record.proposalDeadline),
    assignmentDate: text(record.assignmentDate),
    startDate: text(record.startDate),
    completionDate: typeof record.completionDate === "string" ? record.completionDate : null,
    attachments: Array.isArray(record.attachments)
      ? record.attachments.map(readAttachment).filter((file): file is Attachment => file !== null)
      : [],
    ...("history" in record ? { history: readHistory(record.history) } : {}),
    subscribed: record.subscribed === true,
  };
}

export function reasonsIn(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors;
  return Array.isArray(errors) ? errors.filter((reason): reason is string => typeof reason === "string") : [];
}

/** What reading one opportunity came back with. */
export type OpportunityAnswer =
  | { readonly kind: "found"; readonly opportunity: CwuOpportunity }
  /** No opportunity there, or none this person may read: the same to a person (R-1.2). */
  | { readonly kind: "missing" };

export async function fetchCwuOpportunity(id: string): Promise<OpportunityAnswer> {
  try {
    const { data, response } = await api.GET("/api/opportunities/code-with-us/{id}", { params: { path: { id } } });
    const opportunity = response.ok ? readCwuOpportunity(data) : null;
    return opportunity ? { kind: "found", opportunity } : { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
}

/** What listing opportunities came back with. */
export type OpportunityListAnswer =
  | { readonly kind: "listed"; readonly opportunities: readonly CwuOpportunity[] }
  | { readonly kind: "failed" };

/** Every Code With Us opportunity the service lets this person read (R-1.3). */
export async function listCwuOpportunities(): Promise<OpportunityListAnswer> {
  try {
    const { data, response } = await api.GET("/api/opportunities/code-with-us");
    if (!response.ok || !Array.isArray(data)) return { kind: "failed" };
    const opportunities = (data as unknown[])
      .map(readCwuOpportunity)
      .filter((opportunity): opportunity is CwuOpportunity => opportunity !== null);
    return { kind: "listed", opportunities };
  } catch {
    return { kind: "failed" };
  }
}

/** What saving, submitting, publishing or deleting came back with. */
export type SaveAnswer =
  | { readonly kind: "saved"; readonly opportunity: CwuOpportunity }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

function saveAnswerFor(ok: boolean, data: unknown, error: unknown): SaveAnswer {
  if (ok) {
    const opportunity = readCwuOpportunity(data);
    return opportunity ? { kind: "saved", opportunity } : { kind: "failed" };
  }
  const reasons = reasonsIn(error);
  return reasons.length > 0 ? { kind: "refused", reasons } : { kind: "failed" };
}

/** What a Code With Us opportunity's form sends. */
export interface CwuSubmission {
  readonly title: string;
  readonly teaser: string;
  /** Left out while the form's question is unanswered. */
  readonly remoteOk?: boolean;
  readonly remoteDesc: string;
  readonly location: string;
  readonly reward: number | null;
  readonly skills: readonly string[];
  readonly description: string;
  readonly proposalDeadline: string;
  readonly assignmentDate: string;
  readonly startDate: string;
  readonly completionDate: string;
  readonly attachments: readonly string[];
}

/** A new opportunity, as a draft, under review or published (R-1.9, R-1.48). */
export async function createCwuOpportunity(
  submission: CwuSubmission,
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED",
): Promise<SaveAnswer> {
  try {
    const { data, error, response } = await api.POST("/api/opportunities/code-with-us", {
      body: { ...submission, status } as never,
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** One tagged change: a new version, a submission for review, or publication. */
export async function changeCwuOpportunity(
  id: string,
  tag: "edit" | "submitForReview" | "publish",
  value?: CwuSubmission,
): Promise<SaveAnswer> {
  try {
    const { data, error, response } = await api.PUT("/api/opportunities/code-with-us/{id}", {
      params: { path: { id } },
      body: (value === undefined ? { tag } : { tag, value }) as never,
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/**
 * Sets which stored files the opportunity carries and nothing else: an `edit` naming only
 * `attachments`, which the service saves as a new version with the rest as it stands
 * (file-attach-by-identifier; decision record 0033).
 */
export async function attachToCwuOpportunity(id: string, fileIds: readonly string[]): Promise<SaveAnswer> {
  try {
    const { data, error, response } = await api.PUT("/api/opportunities/code-with-us/{id}", {
      params: { path: { id } },
      body: { tag: "edit", value: { attachments: fileIds } } as never,
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

export async function deleteCwuOpportunity(id: string): Promise<SaveAnswer> {
  try {
    const { data, error, response } = await api.DELETE("/api/opportunities/code-with-us/{id}", {
      params: { path: { id } },
    });
    return saveAnswerFor(response.ok, data, error);
  } catch {
    return { kind: "failed" };
  }
}

/** What storing one attachment came back with. */
export type AttachmentUpload =
  | { readonly kind: "stored"; readonly attachment: Attachment }
  /** The service refused the file itself — its size or its name — saying why (R-8.17, R-8.23). */
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

/**
 * Stores a file to attach to an opportunity, under the name given, with no read access recorded
 * against the file itself: what it is attached to decides who may read it (R-8.19, R-8.20).
 */
export async function uploadAttachment(file: File, name: string): Promise<AttachmentUpload> {
  const form = new FormData();
  form.append("name", name);
  form.append("metadata", JSON.stringify([]));
  form.append("file", file, name);
  try {
    const { data, error, response } = await api.POST("/api/files", { body: form as never });
    if (response.ok) {
      const attachment = readAttachment(data);
      return attachment ? { kind: "stored", attachment } : { kind: "failed" };
    }
    if (response.status >= 400 && response.status < 500) return { kind: "refused", reasons: reasonsIn(error) };
    return { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}
