// criterion: @R-4.29 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The setting is read relative to itself rather than against a word for "on" or "off":
// observations return free text, and what the criterion claims is that the choice changes
// when it is made and only then.
test("a person may turn the notice of new opportunities on or off at any time from their profile", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfNotifications.open();
  const before = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();

  await surface.userProfileSelfNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).not.toBe(before);

  await surface.userProfileSelfNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).toBe(before);
});

// Following the unsubscribe link is notification-unsubscribe-landing, the address the
// message offers. The person being told about new opportunities is the account the seed
// records with notices off, turned on first, so the unsubscribe has something to stop and
// the account ends the test the way the seed describes it.
test("following the unsubscribe link in such a message opens their profile and asks them to confirm before stopping", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileSelfNotifications.open();
  await surface.userProfileSelfNotifications.toggleNewOpportunityNotifications();

  await surface.userProfileSelfNotifications.open();
  const whileBeingTold = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();

  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.resolvesToSignedInPerson()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.unsubscribeConfirmation()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.confirmationNamesSignedInAddress()).toBeTruthy();

  // Nothing changes until they confirm.
  await surface.notificationUnsubscribeLanding.cancelUnsubscribe();
  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).toBe(whileBeingTold);

  await surface.notificationUnsubscribeLanding.open();
  await surface.notificationUnsubscribeLanding.confirmUnsubscribe();

  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).not.toBe(whileBeingTold);
});
