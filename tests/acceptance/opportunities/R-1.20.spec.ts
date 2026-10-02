// criterion: @R-1.20 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-02
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every change is asked for through opportunity-status-request, which sends the service's
// own update operation whatever a screen would offer, so a refusal is the service's and not
// merely a control a screen chose not to show. Every request is made as the administrator,
// who may make every change on the permitted path, so that a refusal is about the path and
// not about who asked.
//
// The criterion's examples are its cases: an awarded opportunity asked to go back to
// published (Code With Us and Sprint With Us), a cancelled one asked to go to published,
// and a fresh draft asked to go straight to an evaluation stage. Code With Us has no
// operation leading to an evaluation stage at all, so the draft cases are Sprint With Us
// (the code challenge) and Team With Us (the challenge).
//
// "Unchanged" is read as the status the service holds afterwards, read afresh rather than
// taken from the request's answer. For a seeded record it is compared with the status the
// seed gave it; for a fresh draft, with the status read just before the request.

const STATEMENT =
  "An opportunity may only change state along the permitted path for its program, and a request for any other change is refused.";

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return ((await read()) ?? "").trim();
  } catch {
    return "";
  }
}

function isYes(value: string): boolean {
  return !["", "false", "no", "0"].includes(value.trim().toLowerCase());
}

async function expectRefusedAndUnchanged(surface: Surface, before: string, asked: string) {
  const request = surface.opportunityStatusRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the request should be refused").toBe(false);
  expect(await readOrEmpty(() => request.refusalStatus()), "a refused request carries a status").toBeTruthy();
  const after = await readOrEmpty(() => request.storedStatus());
  expect(after, `the status should still be ${before}`).toBe(before);
  expect(after).not.toBe(asked);
}

const seededCases = [
  { name: "an awarded Code With Us opportunity asked to go back to published", opportunity: seed.opportunities.cwuAwarded, asked: "PUBLISHED" },
  { name: "an awarded Sprint With Us opportunity asked to go back to published", opportunity: seed.opportunities.swuAwarded, asked: "PUBLISHED" },
  { name: "a cancelled Code With Us opportunity asked to go to published", opportunity: seed.opportunities.cwuCancelled, asked: "PUBLISHED" },
] as const;

type DraftCase = {
  name: string;
  program: string;
  asked: string;
  create: (s: Surface) => { open(): Promise<void>; saveDraft(input?: unknown): Promise<void> };
  edit: (s: Surface) => { opportunityIdentifier(): Promise<string> };
};

const draftCases: DraftCase[] = [
  {
    name: "a Sprint With Us draft asked to go straight to the code challenge",
    program: "sprint-with-us",
    asked: "EVAL_CC",
    create: (s) => s.opportunitySwuCreate,
    edit: (s) => s.opportunitySwuEdit,
  },
  {
    name: "a Team With Us draft asked to go straight to the challenge",
    program: "team-with-us",
    asked: "EVAL_C",
    create: (s) => s.opportunityTwuCreate,
    edit: (s) => s.opportunityTwuEdit,
  },
];

test.describe(STATEMENT, () => {
  for (const c of seededCases) {
    test(`${STATEMENT} — ${c.name} is refused and its state is unchanged`, async ({ surface }) => {
      await surface.signIn(persona.administrator);
      const request = surface.opportunityStatusRequest;
      await request.open({ program: c.opportunity.program, opportunityId: c.opportunity.id });
      await request.requestStatusChange({ status: c.asked });
      await expectRefusedAndUnchanged(surface, c.opportunity.seeded_status, c.asked);
    });
  }

  for (const c of draftCases) {
    test(`${STATEMENT} — ${c.name} is refused and its state is unchanged`, async ({ surface }) => {
      await surface.signIn(persona.administrator);
      const create = c.create(surface);
      await create.open();
      await create.saveDraft({ title: `R-1.20 ${c.name}` });
      const opportunityId = await c.edit(surface).opportunityIdentifier();
      expect(opportunityId, "the draft should have been stored").toBeTruthy();

      const request = surface.opportunityStatusRequest;
      await request.open({ program: c.program, opportunityId });
      const before = await readOrEmpty(() => request.storedStatus());
      expect(before, "the draft's status should be readable before the request").toBeTruthy();

      await request.requestStatusChange({ status: c.asked });
      await expectRefusedAndUnchanged(surface, before, c.asked);
    });
  }
});
