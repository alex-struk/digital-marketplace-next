// criterion: @R-1.6 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The count of views is readable only on the opportunity's reporting, which its author and
// an administrator can see, so the reading is taken as the administrator either side of a
// visit made by somebody who is not signed in. The criterion says the count rises by one;
// the observation returns free text rather than a number, so what is asserted is that the
// count the reporting shows is not the count it showed before.

const opportunityId = seed.opportunities.publishedCodeWithUs.id;

test("opening an opportunity's public screen counts as a view of that opportunity", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  const before = await surface.opportunityCwuEdit.reportingViews();
  await surface.signOut();

  await surface.opportunityCwuView.open({ opportunityId });
  expect(await surface.opportunityCwuView.status()).toBeTruthy();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.reportingViews()).not.toBe(before);
});
