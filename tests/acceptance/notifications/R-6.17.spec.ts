// criterion: @R-6.17 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// "No notification of any kind" is checked here against the one notification that reaches
// a named vendor at their own visible address — the announcement of changed terms. The
// notice about a watched opportunity, which is the kind the criterion turns on, is sent as
// a batch of blind copies, and the mail fixture reads only the visible recipient, so
// neither its arrival nor its absence for one account can be seen from here.
test("a deactivated account receives no notification of any kind", async ({ surface, mail }) => {
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  // An active vendor's message proves the run happened and the catcher is reachable, so
  // that the absence asserted next is evidence of what the service decided.
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);

  expect(await mail.messagesTo(seed.users.vendorDeactivated.email)).toHaveLength(0);
});

test("the watch itself is retained so that reactivating the account restores it", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  const whileActive = await surface.opportunityCwuEdit.reportingWatchers();

  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBe(whileActive);
});
