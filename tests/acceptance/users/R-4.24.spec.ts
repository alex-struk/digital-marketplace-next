// criterion: @R-4.24 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";

// The person is a first-time vendor: an identity the sandbox identity provider carries and
// the seed does not, so the account is made at this sign-in and is still completing its
// profile. The choice is read back from their own notification settings, which is where the
// account states it.
//
// What the settings report for "on" is not stated in the contract, so the saved choice is
// held against an account the seed defines with notices off: the two must differ. The moment
// the choice was made is not returned by any observation; not-testable.yaml keeps it owed.

test("while completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileSelfNotifications.open();
  const off = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();
  await surface.signOut();

  await surface.signIn(persona.firstTimeVendor);
  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.toggleNewOpportunityNotifications();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileSelfNotifications.open();
  const saved = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();
  expect(saved).toBeTruthy();
  expect(saved).not.toBe(off);
});
