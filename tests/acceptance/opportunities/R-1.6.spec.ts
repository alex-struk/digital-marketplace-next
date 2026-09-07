// criterion: @R-1.6 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The count is read from the opportunity's own reporting, which only its author and an
// administrator may see, so the reading is done as an administrator and the viewing as
// somebody who is not signed in at all — the visitor the criterion says also counts.

function count(text: string): number {
  return Number(text.replace(/[^0-9]/g, ""));
}

test("opening an opportunity's public view counts as a view of that opportunity", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  const before = count(await surface.opportunityCwuEdit.reportingViews());
  await surface.signOut();

  await surface.opportunityCwuView.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.opportunityCwuView.status()).toBeTruthy();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(count(await surface.opportunityCwuEdit.reportingViews())).toBe(before + 1);
});
