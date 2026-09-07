// criterion: @R-4.29 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Both tests start from a vendor the seed leaves with new-opportunity notices off and end
// with them off again, so neither depends on the other having run.
test("a person may turn the notice of new opportunities on or off at any time from their profile", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeFalsy();

  await surface.userProfileNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeTruthy();

  await surface.userProfileNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileNotifications.confirmUnsubscribe();
  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeFalsy();
});

test("following the unsubscribe link in such a message opens their profile and asks them to confirm before stopping", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileNotifications.open({ userId: "me" });
  await surface.userProfileNotifications.toggleNewOpportunityNotifications();

  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.unsubscribeConfirmation()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.confirmationNamesSignedInAddress()).toBeTruthy();

  // The setting changes only once they confirm.
  await surface.notificationUnsubscribeLanding.cancelUnsubscribe();
  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeTruthy();

  await surface.notificationUnsubscribeLanding.open();
  await surface.notificationUnsubscribeLanding.confirmUnsubscribe();
  await surface.userProfileNotifications.open({ userId: "me" });
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeFalsy();
});
