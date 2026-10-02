/** The view counts the kept schema holds, by name (`viewCounters`). */
export interface CounterStore {
  /** Each named count; a name never counted is not in the answer. */
  read(names: readonly string[]): Promise<ReadonlyMap<string, number>>;
  /** Adds one to the named count, starting it at one, and answers with the new count. */
  increment(name: string): Promise<number>;
}

export const COUNTER_STORE = Symbol("CounterStore");

/** Counts by name, as `/api/counters` answers with them: `{ "<name>": <count> }`. */
export type Counts = Readonly<Record<string, number>>;
