// criterion: @R-4.22 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's middle clause — a person whose account has just been created landing on
// the profile-completion screen — needs an identity the service has not yet registered,
// which no persona denotes.
test("after signing in, a person who already had an account is taken to their dashboard", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);

  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toBeTruthy();
});

test("a person who began signing in from a particular page is returned to it", async ({ surface }) => {
  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userSignIn.publicSectorCard()).toBeTruthy();

  await surface.signIn(persona.publicSectorStaff);

  expect(await surface.userProfile.emailField()).toContain(seed.users.staffOne.email);
});
