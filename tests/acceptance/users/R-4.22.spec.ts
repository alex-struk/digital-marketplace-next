// criterion: @R-4.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// Only the returning person's half is reachable. A person whose account has just been
// created needs an account to be created, and every persona signs in as an account the seed
// already carries. Being returned to the page sign-in began from is out of reach too:
// surface.signIn takes a persona rather than a starting point, so sign-in cannot be begun
// from any screen in particular.
//
// Nothing is opened after signing in, so the dashboard reading below is a reading of where
// sign-in left the person. seed.users.staffOne created the seeded published opportunity, so
// their own dashboard is not empty.
test("after signing in, a person who already had an account is taken to their dashboard", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);

  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeTruthy();
});
