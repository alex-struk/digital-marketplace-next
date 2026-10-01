import { OpportunityStatus, Program, isStatusOf } from "@rules/opportunities";
import type { Listable } from "@rules/opportunity-list";
import { api } from "./client";
import { Person } from "./opportunities";

/**
 * Every opportunity the service lets this person read, in all three programs, as the list and the
 * dashboard show them (R-1.2, R-1.3; decision record 0034 for the Sprint With Us and Team With Us
 * answers). Answers are read defensively rather than trusted.
 */
export interface ListedOpportunity extends Listable {
  readonly id: string;
  readonly createdAt: string;
  /** Absent unless the reader may see who created it (R-1.29). */
  readonly createdBy?: Person | null;
  readonly remoteDesc: string;
  /** What the opportunity is worth, and the word for it in its program. */
  readonly value: { readonly term: string; readonly amount: number };
  /** Whether the reader watches it (R-1.5). */
  readonly subscribed: boolean;
}

const VALUE_TERMS: Readonly<Record<Program, string>> = {
  "code-with-us": "Reward",
  "sprint-with-us": "Total maximum budget",
  "team-with-us": "Maximum budget",
};

const VALUE_FIELDS: Readonly<Record<Program, string>> = {
  "code-with-us": "reward",
  "sprint-with-us": "totalMaxBudget",
  "team-with-us": "maxBudget",
};

const text = (value: unknown): string => (typeof value === "string" ? value : "");

function readPerson(value: unknown): Person | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string" ? { id: record.id, name: record.name } : null;
}

export function readListedOpportunity(program: Program, value: unknown): ListedOpportunity | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !isStatusOf(program, record.status)) return null;
  const amount = record[VALUE_FIELDS[program]];
  return {
    id: record.id,
    program,
    status: record.status as OpportunityStatus,
    title: text(record.title),
    location: text(record.location),
    remoteOk: record.remoteOk === true,
    remoteDesc: text(record.remoteDesc),
    proposalDeadline: text(record.proposalDeadline),
    createdAt: text(record.createdAt),
    updatedAt: text(record.updatedAt),
    ...("createdBy" in record ? { createdBy: readPerson(record.createdBy) } : {}),
    value: { term: VALUE_TERMS[program], amount: typeof amount === "number" ? amount : 0 },
    subscribed: record.subscribed === true,
  };
}

async function listProgram(program: Program): Promise<ListedOpportunity[] | null> {
  try {
    const { data, response } =
      program === "code-with-us"
        ? await api.GET("/api/opportunities/code-with-us")
        : program === "sprint-with-us"
          ? await api.GET("/api/opportunities/sprint-with-us")
          : await api.GET("/api/opportunities/team-with-us");
    if (!response.ok || !Array.isArray(data)) return null;
    return (data as unknown[])
      .map((item) => readListedOpportunity(program, item))
      .filter((item): item is ListedOpportunity => item !== null);
  } catch {
    return null;
  }
}

export type ListingAnswer =
  | { readonly kind: "listed"; readonly opportunities: readonly ListedOpportunity[] }
  | { readonly kind: "failed" };

/** All three programs' opportunities; the list fails only if none of them could be read. */
export async function listAllOpportunities(): Promise<ListingAnswer> {
  const lists = await Promise.all((["code-with-us", "sprint-with-us", "team-with-us"] as const).map(listProgram));
  if (lists.every((list) => list === null)) return { kind: "failed" };
  return { kind: "listed", opportunities: lists.flatMap((list) => list ?? []) };
}
