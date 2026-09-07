// criterion: @R-6.22 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("the notification control on the list of opportunities is not shown on a narrow screen", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.notificationOptinOpportunityList.open();

  expect(await surface.notificationOptinOpportunityList.notificationControlHiddenOnNarrowScreen()).toBeTruthy();

  // The choice itself is not unreachable: the notification settings on the person's own
  // profile still offer it, which is the only route left to them.
  await surface.userProfileNotifications.open();
  expect(await surface.userProfileNotifications.newOpportunitiesCheckbox()).toBeTruthy();
});
