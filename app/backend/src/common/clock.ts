/**
 * What the service reads the time from. Nothing provides it in the running service, so the
 * system clock is used; a test hands in a fixed one.
 */
export type Clock = () => Date;

export const CLOCK = Symbol("Clock");

export const systemClock: Clock = () => new Date();
