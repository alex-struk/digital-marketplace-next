// criterion: @R-6.7 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona } from "../../fixtures";

// A message addressed to one person and forwarded to another. The offer carries nothing of
// the addressee, so "forwarding" it is simply a second person opening the same offer while
// signed in as themselves. The reader is the account the seed records with new-opportunity
// notices off, so it turns them on first and the unsubscribe has something of its own to stop.
test("the unsubscribe offer in a message is not tied to the person it was addressed to: it acts on whoever is signed in when it is opened", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.userProfileSelfNotifications.open();
  const addresseeChoice = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();
  await surface.signOut();

  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileSelfNotifications.open();
  await surface.userProfileSelfNotifications.toggleNewOpportunityNotifications();
  const readerChoice = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();

  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.confirmationNamesSignedInAddress()).toBeTruthy();
  await surface.notificationUnsubscribeLanding.confirmUnsubscribe();

  // The reader's own notices are stopped...
  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).not.toBe(readerChoice);
  await surface.signOut();

  // ...and the person the message was addressed to is untouched.
  await surface.signIn(persona.organizationOwner);
  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).toBe(addresseeChoice);
});

test("the unsubscribe offer cannot be used without signing in", async ({ surface }) => {
  await surface.notificationUnsubscribeLanding.open();

  expect(await surface.notificationUnsubscribeLanding.signInRequired()).toBeTruthy();
});
