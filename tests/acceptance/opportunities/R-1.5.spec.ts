// criterion: @R-1.5 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity was created by a member of public sector staff, so both
// signed-in people below are watching something they did not create. Watching is not
// readable on the opportunity itself — the only observation that counts watchers is the
// author's and the administrator's reporting — so each reading is taken as the
// administrator either side of the vendor's action.
//
// The third part of the criterion, that the same opportunity cannot be watched twice, is
// not asserted. The surface names one action for watching, a toggle, so asking twice
// switches the watch off rather than asking again; and no observation reports a request
// refused as a duplicate. It needs an action that watches without toggling and an
// observation of that refusal.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

test("any signed-in person may watch an opportunity they did not create", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  const before = await surface.opportunityCwuEdit.reportingWatchers();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.reportingWatchers()).not.toBe(before);
});

test("any signed-in person may stop watching an opportunity they did not create", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  const before = await surface.opportunityCwuEdit.reportingWatchers();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBe(before);
});
