// criterion: @R-6.7 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A message addressed to one person and forwarded to another: the second person opens the
// offer while signed in to their own account. The reader here is the account the seed
// records as having new-opportunity notices off, so it is turned on first and the
// unsubscribe has something of the reader's own to stop.
test("the unsubscribe offer in a message is not tied to the person it was addressed to: it acts on whoever is signed in when it is opened", async ({
  surface,
}) => {
  // The person the message was addressed to, whose own choice must survive untouched.
  await surface.signIn(persona.organizationOwner);
  await surface.userProfileNotifications.open();
  const addresseeBefore = await surface.userProfileNotifications.newOpportunitiesCheckbox();
  await surface.signOut();

  // The person it was forwarded to, opening the offer while signed in to their own account.
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileNotifications.open();
  await surface.userProfileNotifications.toggleNewOpportunityNotifications();
  const readerBefore = await surface.userProfileNotifications.newOpportunitiesCheckbox();

  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.confirmationNamesSignedInAddress()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.resolvesToSignedInPerson()).toBeTruthy();
  await surface.notificationUnsubscribeLanding.confirmUnsubscribe();

  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).not.toBe(readerBefore);
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBe(addresseeBefore);
});

test("the unsubscribe offer cannot be used without signing in", async ({ surface }) => {
  await surface.notificationUnsubscribeLanding.open();

  expect(await surface.notificationUnsubscribeLanding.signInRequired()).toBeTruthy();
});
