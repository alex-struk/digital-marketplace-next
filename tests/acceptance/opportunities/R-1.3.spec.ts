// criterion: @R-1.3 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The criterion wants two members of staff each holding unpublished work. The target mints
// a session for only one of them, so the second staff member's draft comes from the seed
// and is read as something the first staff member must not see, rather than as something a
// second session creates.

test("a member of public sector staff sees every published opportunity plus their own drafts, and not another staff member's", async ({
  surface,
}) => {
  const own = "R-1.3 draft belonging to the member of staff who is signed in";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: own });

  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(own);
  expect(unpublished).not.toContain(seed.opportunities.draftOfOtherStaff.title);
  expect(await surface.opportunityList.openGroup()).toContain(
    seed.opportunities.publishedCodeWithUs.title,
  );
});

test("an administrator sees every opportunity", async ({ surface }) => {
  const ofStaff = "R-1.3 draft an administrator must also be able to see";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: ofStaff });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityDashboard.open();
  const everything = await surface.opportunityDashboard.allOpportunitiesForAdministrator();
  expect(everything).toContain(ofStaff);
  expect(everything).toContain(seed.opportunities.draftOfOtherStaff.title);
});
