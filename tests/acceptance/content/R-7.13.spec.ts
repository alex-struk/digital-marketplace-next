// criterion: @R-7.13 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The announcement is cancelled rather than confirmed: what belongs to this criterion is
// that the action is offered on the terms page and warns before it acts. Who is notified
// and what they are told sits with the notifications domain, and confirming here would
// send real messages that another domain's tests read.
//
// The second half of the criterion — that no other page carries the action — is not
// asserted: the surface reaches the announcement only through the terms page's own
// managing screen, and the managing screen of any other page names no observation
// reporting the action's absence.
test("the service's own terms and conditions page carries, for an administrator, the action that announces changed terms to vendors, and warns first that vendors will have to accept the new terms", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationTermsBroadcast.open();

  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();

  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();

  await surface.notificationTermsBroadcast.cancelNotifyVendors();
});
