// criterion: @R-1.2 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seed holds one unpublished opportunity — a draft belonging to a second member of
// public sector staff — which is what the two personas here must not be able to reach.
//
// The surface names no not-found observation on an opportunity's own view, so the second
// half of the criterion is asserted as none of the opportunity's own details being shown
// to a requester who opens its address directly.

const draft = seed.opportunities.draftOfOtherStaff;

test("an anonymous visitor or a vendor is not listed drafts and opportunities under review", async ({
  surface,
}) => {
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toBeFalsy();
  expect(await surface.opportunityList.openGroup()).not.toContain(draft.title);
  expect(await surface.opportunityList.closedGroup()).not.toContain(draft.title);

  await surface.signIn(persona.vendor);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toBeFalsy();
  expect(await surface.opportunityList.openGroup()).not.toContain(draft.title);
  expect(await surface.opportunityList.closedGroup()).not.toContain(draft.title);
});

test("an anonymous visitor or a vendor cannot open a draft or an opportunity under review", async ({
  surface,
}) => {
  await surface.opportunityCwuView.open({ opportunityId: draft.id });
  expect(await surface.opportunityCwuView.status()).toBeFalsy();
  expect(await surface.opportunityCwuView.proposalDeadline()).toBeFalsy();

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ opportunityId: draft.id });
  expect(await surface.opportunityCwuView.status()).toBeFalsy();
  expect(await surface.opportunityCwuView.proposalDeadline()).toBeFalsy();
});
