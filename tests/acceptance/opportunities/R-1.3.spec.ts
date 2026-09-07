// criterion: @R-1.3 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The second member of staff and their draft come from the seed: the oracle has one
// public sector sign-in route, so a test cannot act as that second person, only observe
// that their unpublished work stays out of the first person's sight.

const ownDraftTitle = "R-1.3 draft of the signed-in member of staff";

test("a member of public sector staff sees every published opportunity plus their own drafts and opportunities under review", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: ownDraftTitle });

  await surface.opportunityDashboard.open();
  const mine = await surface.opportunityDashboard.myOpportunitiesTable();
  expect(mine).toContain(ownDraftTitle);
  expect(mine).not.toContain(seed.opportunities.draftOfOtherStaff.title);

  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toContain(ownDraftTitle);
  expect(await surface.opportunityList.unpublishedGroup()).not.toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.openGroup()).toContain(seed.opportunities.publishedCodeWithUs.title);
});

test("an administrator sees every opportunity", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.opportunityDashboard.open();
  const everything = await surface.opportunityDashboard.allOpportunitiesForAdministrator();
  expect(everything).toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(everything).toContain(seed.opportunities.publishedCodeWithUs.title);

  await surface.opportunityList.open();
  expect(await surface.opportunityList.unpublishedGroup()).toContain(seed.opportunities.draftOfOtherStaff.title);
});
