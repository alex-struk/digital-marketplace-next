import { Program } from "../rules/opportunities";

/** What closing one opportunity did, for the messages sent once it is saved. */
export interface ClosedOpportunity {
  readonly program: Program;
  readonly id: string;
  readonly title: string;
  /** The opportunity's author. */
  readonly createdBy: string | null;
  /** The evaluators on its panel; none for Code With Us, and never a chair who does not evaluate (R-5.20). */
  readonly evaluators: readonly string[];
  /** The proposals moved to review, in the order they were named (R-2.5). */
  readonly reviewed: readonly string[];
}

/**
 * Where the opportunities that close at their deadline are found and closed, in every program.
 * The hook is written against this rather than against Prisma, so what it does and when it does it
 * can be tested without a database.
 */
export interface ClosingStore {
  /** The published opportunities of a program whose proposal deadline has passed (R-1.1). */
  lapsed(program: Program, now: Date): Promise<string[]>;
  /**
   * Closes one, as one change: it moves to its program's first evaluation stage with the note
   * "This opportunity has closed.", its submitted proposals move to review, and in Sprint With Us
   * and Team With Us each is named "Proponent 1", "Proponent 2" and so on (R-1.1, R-1.24, R-2.5).
   * Null when it is no longer published or its deadline has not passed, so that two runs close it
   * once.
   */
  close(program: Program, id: string, now: Date): Promise<ClosedOpportunity | null>;
  /** The addresses of the accounts named that are active (R-6.17). */
  addressesOf(accountIds: readonly string[]): Promise<(string | null)[]>;
}

export const CLOSING_STORE = Symbol("ClosingStore");

/** How often each program's closing work may start, in milliseconds (decision record 0005). */
export const CLOSING_INTERVAL = Symbol("ClosingInterval");

/** The interval the environment names in `DEADLINE_HOOK_INTERVAL_MS`, or once a minute (R-1.1 note). */
export function closingIntervalFrom(environment: Record<string, string | undefined>): number {
  const given = Number(environment.DEADLINE_HOOK_INTERVAL_MS);
  return environment.DEADLINE_HOOK_INTERVAL_MS !== undefined && environment.DEADLINE_HOOK_INTERVAL_MS.trim() !== "" &&
    Number.isFinite(given) && given >= 0
    ? given
    : 60_000;
}
