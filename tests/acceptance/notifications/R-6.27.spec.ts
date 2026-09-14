// criterion: @R-6.27 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The list is read in a phone-sized window. The same control at the default desktop width is
// what R-6.21 exercises, so reaching it here the same way — on the list, by the same action —
// is what the criterion adds. Choosing twice leaves the person's setting as it was found.
test.use({ viewport: { width: 390, height: 844 } });

test("the choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.notificationOptinOpportunityList.open();
  expect(await surface.notificationOptinOpportunityList.notificationControl()).toBeTruthy();

  const before = await surface.notificationOptinOpportunityList.notificationControlState();
  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  expect(await surface.notificationOptinOpportunityList.notificationControlState()).not.toBe(before);

  await surface.notificationOptinOpportunityList.toggleNewOpportunityNotifications();
  expect(await surface.notificationOptinOpportunityList.notificationControlState()).toBe(before);
});
