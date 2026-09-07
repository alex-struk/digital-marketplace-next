// criterion: @R-6.21 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// seed.users.vendorWithNoticesOff starts with the choice turned off, so the first toggle
// on the list is the person asking for notices and the second is them stopping again. The
// third part of the criterion's outcome — that the change takes effect for the next
// opportunity published — is not asserted: that announcement is a batch of blind copies
// the mail fixture cannot read.
test("a signed-in person can turn new-opportunity notices on and off from the list of opportunities itself, without opening their settings", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorWithNoticesOff);

  await surface.notificationOptinOpportunityList.open();
  const before = await surface.notificationOptinOpportunityList.notificationControlState();

  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  const afterAskingForNotices = await surface.notificationOptinOpportunityList.notificationControlState();
  expect(afterAskingForNotices).not.toBe(before);

  // The account records the request, though the choice was never made from the settings.
  await surface.userProfileNotifications.open();
  const recorded = await surface.userProfileNotifications.newOpportunitiesCheckbox();

  await surface.notificationOptinOpportunityList.open();
  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  expect(await surface.notificationOptinOpportunityList.notificationControlState()).toBe(before);

  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).not.toBe(recorded);
});
