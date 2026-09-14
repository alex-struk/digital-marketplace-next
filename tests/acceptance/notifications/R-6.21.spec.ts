// criterion: @R-6.21 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The account starts with notices off, so the first choice made on the list is the person
// asking for notices and the second is them stopping again. The account's record is read back
// from the person's own settings only after each choice, never used to make one.
//
// The last part of the outcome — that the change takes effect for the next opportunity
// published — is not asserted: that announcement goes out as a batch of blind copies, and the
// mail fixture searches only by visible recipient.
test("a signed-in person can turn new-opportunity notices on and off from the list of opportunities itself, without opening their settings", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);

  await surface.userProfileSelfNotifications.open();
  const recordedOff = await surface.userProfileSelfNotifications.newOpportunitiesCheckbox();

  await surface.notificationOptinOpportunityList.open();
  const offeringOn = await surface.notificationOptinOpportunityList.notificationControlState();
  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  expect(await surface.notificationOptinOpportunityList.notificationControlState()).not.toBe(offeringOn);

  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).not.toBe(recordedOff);

  await surface.notificationOptinOpportunityList.open();
  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  expect(await surface.notificationOptinOpportunityList.notificationControlState()).toBe(offeringOn);

  await surface.userProfileSelfNotifications.open();
  expect(await surface.userProfileSelfNotifications.newOpportunitiesCheckbox()).toBe(recordedOff);
});
