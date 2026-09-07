// criterion: @R-4.16 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("when an administrator announces that the terms and conditions have changed, every vendor's standing acceptance is withdrawn and each of them is asked to read and agree to the new terms before continuing", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  expect(await surface.notificationTermsBroadcast.notifyVendorsSuccess()).toBeTruthy();

  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open({ userId: "me" });
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();
  expect(await surface.userProfileLegal.appTermsLink()).toBeTruthy();
});

test("agreeing to the new terms records a fresh acceptance date", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open({ userId: "me" });
  await surface.userProfileLegal.acceptUpdatedTerms();
  await surface.userProfileLegal.confirmAcceptUpdatedTerms();

  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();
});
