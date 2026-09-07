// criterion: @R-1.5 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity was created by a member of public sector staff, so
// the vendor watching it here did not create it. Whether somebody is watching is read
// through the watcher count on the opportunity's own reporting, which only its author
// and an administrator may see — hence the change of persona between acting and reading.
//
// The third outcome, that the same opportunity cannot be watched twice, is not asserted:
// the surface offers one toggle_watch action rather than a watch action, so a second
// watch request cannot be made through it at all.

function count(text: string): number {
  return Number(text.replace(/[^0-9]/g, ""));
}

test("any signed-in person may watch an opportunity they did not create", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  const before = count(await surface.opportunityCwuEdit.reportingWatchers());
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(count(await surface.opportunityCwuEdit.reportingWatchers())).toBe(before + 1);
});

test("any signed-in person may stop watching an opportunity", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  const before = count(await surface.opportunityCwuEdit.reportingWatchers());
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuView.toggleWatch();
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(count(await surface.opportunityCwuEdit.reportingWatchers())).toBe(before);
});
