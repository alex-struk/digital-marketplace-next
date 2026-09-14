// criterion: @R-4.24 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The profile-completion screen is reached by a vendor whose acceptance an administrator's
// announcement of changed terms has withdrawn (R-4.23). The choice is made there and read
// back from the person's own notification settings, which is where the account states it.
// The moment the choice was made is not returned by any observation, so only the choice
// itself is asserted.
//
// vendor-with-notices-off is the account the seed defines by that setting, so the last
// action puts it back the way it was found.
test("while completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await surface.signOut();

  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileSelfNotifications.open();
  const before = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();

  await surface.userSignUpComplete.open();
  await surface.userSignUpComplete.toggleNewOpportunityNotifications();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();

  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).not.toBe(before);

  await surface.userProfileSelfNotifications.toggleNewOpportunityNotifications();
});
