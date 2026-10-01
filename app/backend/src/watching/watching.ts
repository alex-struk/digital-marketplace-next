import { OpportunityStanding, Program } from "../rules/opportunities";

/**
 * Who watches which opportunity, in all three programs, as the kept schema holds it. The service
 * is written against this rather than against Prisma, so the rules about watching can be tested
 * without a database.
 */
export interface WatchStore {
  /** Who created an opportunity and what state it is in, or null when there is none. */
  standing(program: Program, opportunityId: string): Promise<OpportunityStanding | null>;
  /** Records the watch; false when the person was already watching it. */
  watch(program: Program, opportunityId: string, accountId: string, at: Date): Promise<boolean>;
  /** Ends the watch; false when the person was not watching it. */
  unwatch(program: Program, opportunityId: string, accountId: string): Promise<boolean>;
  /** The opportunities of a program the person watches. */
  watchedBy(program: Program, accountId: string): Promise<ReadonlySet<string>>;
  /** How many people watch an opportunity. */
  watcherCount(program: Program, opportunityId: string): Promise<number>;
}

export const WATCH_STORE = Symbol("WatchStore");

/** What time it is, for when a watch began; a test can stand in for it. */
export const WATCH_CLOCK = Symbol("WatchClock");

/** What watching and unwatching answer with. */
export interface WatchAnswer {
  readonly opportunity: { readonly id: string };
  readonly user: { readonly id: string };
  readonly createdAt: string;
}
