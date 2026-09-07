// criterion: @R-4.24 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("while completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.toggleNewOpportunityNotifications();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeTruthy();
});
