// criterion: @R-4.29 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// The setting is read relative to itself rather than against a word for "on" or "off":
// observations return free text, and what the criterion claims is that the choice changes
// when it is made and only then. Following the unsubscribe link is the landing address the
// message offers, which is the notification settings with the question already asked.
test("a person may turn the notice of new opportunities on or off at any time from their profile", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileNotifications.open();
  const before = await surface.userProfileNotifications.newOpportunitiesCheckbox();

  await surface.userProfileNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).not.toBe(before);

  await surface.userProfileNotifications.toggleNewOpportunityNotifications();
  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBe(before);
});

// The person being told about new opportunities is the account the seed records as having
// the notices off, turned on first, so that the unsubscribe has something of theirs to stop
// and the account ends the test the way the seed describes it.
test("following the unsubscribe link in such a message opens their profile and asks them to confirm before stopping", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);
  await surface.userProfileNotifications.open();
  await surface.userProfileNotifications.toggleNewOpportunityNotifications();

  await surface.userProfileNotifications.open();
  const whileBeingTold = await surface.userProfileNotifications.newOpportunitiesCheckbox();

  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.unsubscribeConfirmation()).toBeTruthy();
  expect(await surface.userProfileNotifications.notificationEmailAddress()).toContain(
    seed.users.vendorWithNoticesOff.email,
  );

  // Nothing changes until they confirm.
  await surface.notificationUnsubscribeLanding.cancelUnsubscribe();
  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBe(whileBeingTold);

  await surface.notificationUnsubscribeLanding.open();
  await surface.notificationUnsubscribeLanding.confirmUnsubscribe();

  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).not.toBe(whileBeingTold);
});
