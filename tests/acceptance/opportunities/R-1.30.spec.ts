// criterion: @R-1.30 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity was created by a member of public sector staff, so it
// has an author who is not an administrator and the two halves of the criterion can be read
// off the same record: its author and an administrator see the history and the three
// counts, and a vendor sees none of it.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

test("an opportunity's administrator and its author can see its full change history and its counts of views, watchers and proposals", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingViews()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingProposals()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingViews()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBeTruthy();
  expect(await surface.opportunityCwuEdit.reportingProposals()).toBeTruthy();
});

test("nobody else can see an opportunity's change history or its counts of views, watchers and proposals", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.opportunityCwuEdit.open({ opportunityId });

  expect(await surface.opportunityCwuEdit.historyTab()).toBeFalsy();
  expect(await surface.opportunityCwuEdit.reportingViews()).toBeFalsy();
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBeFalsy();
  expect(await surface.opportunityCwuEdit.reportingProposals()).toBeFalsy();
});
