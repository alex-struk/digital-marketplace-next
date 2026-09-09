// criterion: @R-4.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";

// Only the returning person's half is reachable. A person whose account has just been
// created needs an account to be created, and every persona signs in as an account the seed
// already carries. The third clause is out of reach too: being returned to the screen
// sign-in began from needs sign-in to begin somewhere in particular, and surface.signIn
// takes a persona rather than a starting point.
//
// Nothing is opened after signing in, so the dashboard reading below is a reading of where
// sign-in left the person. seed.users.staffOne owns the seeded published opportunity, so
// their own dashboard is not empty.
test("after signing in, a person who already had an account is taken to their dashboard", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);

  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeTruthy();
});
