import { describe, expect, it, vi } from "vitest";
import { ClosedOpportunity, ClosingStore, closingIntervalFrom } from "../src/closing/closing";
import { DeadlineClosing } from "../src/closing/deadline-closing.service";
import { Envelope } from "../src/mail/message";
import { Mailer } from "../src/mail/mailer";
import { Program } from "../src/rules/opportunities";

/** Lapsed opportunities in memory: each closes once, and says who is to be told. */
class ClosingInMemory implements ClosingStore {
  readonly open = new Map<string, ClosedOpportunity>();
  lapsedCalls = 0;
  failing = false;

  async lapsed(program: Program): Promise<string[]> {
    this.lapsedCalls += 1;
    if (this.failing) throw new Error("database gone");
    return [...this.open.values()].filter((closed) => closed.program === program).map((closed) => closed.id);
  }

  async close(_program: Program, id: string): Promise<ClosedOpportunity | null> {
    const closed = this.open.get(id) ?? null;
    this.open.delete(id);
    return closed;
  }

  async addressesOf(ids: readonly string[]): Promise<(string | null)[]> {
    return ids.filter((id) => id !== "deactivated").map((id) => `${id}@example.test`);
  }
}

function setUp(interval: number) {
  const store = new ClosingInMemory();
  let now = 1_000_000;
  const sent: Envelope[] = [];
  const mailer = { sendEach: (envelopes: readonly Envelope[]) => sent.push(...envelopes) } as unknown as Mailer;
  const closing = new DeadlineClosing(store, interval, () => new Date(now), mailer, {
    serviceOrigin: "http://localhost:4300",
    batchSize: 50,
  });
  return { store, closing, sent, advance: (ms: number) => (now += ms) };
}

const cwu = (id: string): ClosedOpportunity => ({
  program: "code-with-us",
  id,
  title: `Opportunity ${id}`,
  createdBy: "author",
  evaluators: [],
  reviewed: [],
});

describe("the deadline hook (R-1.1, decision record 0005)", () => {
  it("closes what has lapsed, and tells a Code With Us opportunity's author once it is saved", async () => {
    const { store, closing, sent } = setUp(0);
    store.open.set("one", cwu("one"));
    await closing.runDue();
    expect(store.open.size).toBe(0);
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.to).toEqual(["author@example.test"]);
    expect(sent[0]!.message.subject).toBe("Your Code With Us Opportunity is Ready to Be Evaluated");
  });

  it("tells each evaluator of a panel in a message addressed to them alone, and nobody deactivated (R-5.20)", async () => {
    const { store, closing, sent } = setUp(0);
    store.open.set("swu", { ...cwu("swu"), program: "sprint-with-us", evaluators: ["evaluator-1", "deactivated", "evaluator-2"] });
    await closing.runDue();
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent.map((envelope) => envelope.to)).toEqual([["evaluator-1@example.test"], ["evaluator-2@example.test"]]);
    expect(sent.every((envelope) => !envelope.bcc || envelope.bcc.length === 0)).toBe(true);
    expect(sent[0]!.message.subject).toContain("Opportunity swu");
  });

  it("starts each program's work at most once per interval", async () => {
    const { store, closing, advance } = setUp(2_000);
    await closing.runDue();
    expect(store.lapsedCalls).toBe(3);
    advance(1_000);
    await closing.runDue();
    expect(store.lapsedCalls).toBe(3);
    advance(1_000);
    await closing.runDue();
    expect(store.lapsedCalls).toBe(6);
  });

  it("lets a request join a run already under way rather than start another", async () => {
    const { store, closing } = setUp(0);
    await Promise.all([closing.runDue(), closing.runDue(), closing.runDue()]);
    expect(store.lapsedCalls).toBe(3);
  });

  it("never fails the request it runs in front of", async () => {
    const { store, closing } = setUp(0);
    store.failing = true;
    await expect(closing.runDue()).resolves.toBeUndefined();
  });

  it("reads its interval from the environment, once a minute by default", () => {
    expect(closingIntervalFrom({})).toBe(60_000);
    expect(closingIntervalFrom({ DEADLINE_HOOK_INTERVAL_MS: "0" })).toBe(0);
    expect(closingIntervalFrom({ DEADLINE_HOOK_INTERVAL_MS: "2000" })).toBe(2_000);
    expect(closingIntervalFrom({ DEADLINE_HOOK_INTERVAL_MS: "soon" })).toBe(60_000);
  });
});
