// criterion: @R-1.2 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seed holds one unpublished opportunity — a draft belonging to a second member of
// public sector staff — which is what the two personas here must not be able to reach.
//
// The surface names no not-found observation on an opportunity's own view, so the second
// half of the criterion is asserted as none of the opportunity's own details being shown
// to a requester who opens its address directly.

test("an anonymous visitor or a vendor is not listed drafts and opportunities under review", async ({
  surface,
}) => {
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toBeFalsy();
  expect(await surface.opportunityList.openGroup()).not.toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.closedGroup()).not.toContain(seed.opportunities.draftOfOtherStaff.title);

  await surface.signIn(persona.vendor);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toBeFalsy();
  expect(await surface.opportunityList.openGroup()).not.toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.closedGroup()).not.toContain(seed.opportunities.draftOfOtherStaff.title);
});

test("an anonymous visitor or a vendor cannot open a draft or an opportunity under review", async ({
  surface,
}) => {
  await surface.opportunityCwuView.open({ id: seed.opportunities.draftOfOtherStaff.id });
  expect(await surface.opportunityCwuView.status()).toBeFalsy();
  expect(await surface.opportunityCwuView.proposalDeadline()).toBeFalsy();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ id: seed.opportunities.draftOfOtherStaff.id });
  expect(await surface.opportunityCwuView.status()).toBeFalsy();
  expect(await surface.opportunityCwuView.proposalDeadline()).toBeFalsy();
});
