// criterion: @R-1.6 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-01
import { test, expect, persona, seed } from "../../fixtures";

// The view count is read through opportunity-counters, which only an administrator or
// public sector staff may read; a counter never incremented reads as 0. The public page is
// opened between two reads, once by an anonymous visitor and once by a signed-in vendor
// (anyone, signed in or not), so each opening is the only thing that can move the count.

const opportunity = seed.opportunities.publishedCodeWithUs;

function asCount(value: string): number {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? 0 : Number(trimmed);
}

test("Opening an opportunity's public page counts as a view of that opportunity", async ({ surface }) => {
  const counters = surface.opportunityCounters;
  const readViews = async (): Promise<number> => {
    await surface.signIn(persona.administrator);
    await counters.open({ program: opportunity.program, opportunityId: opportunity.id });
    const count = asCount(await counters.viewCount());
    await surface.signOut();
    return count;
  };

  // Not signed in.
  const before = await readViews();
  expect(Number.isInteger(before)).toBe(true);

  await surface.opportunityCwuView.open({ opportunityId: opportunity.id });
  expect(await surface.opportunityCwuView.opportunityIdentifier()).toBeTruthy();

  const afterAnonymous = await readViews();
  expect(afterAnonymous).toBe(before + 1);

  // Signed in, as someone who is not staff.
  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ opportunityId: opportunity.id });
  expect(await surface.opportunityCwuView.opportunityIdentifier()).toBeTruthy();
  await surface.signOut();

  const afterSignedIn = await readViews();
  expect(afterSignedIn).toBe(afterAnonymous + 1);
});
