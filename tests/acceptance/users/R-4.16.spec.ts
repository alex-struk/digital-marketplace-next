// criterion: @R-4.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A vendor who accepted the terms some time ago is established rather than assumed: the
// terms are announced as changed, the vendor agrees, and only then is the announcement the
// criterion is about made. That the date terms were last accepted at all survives the
// withdrawal is not asserted — the legal section carries one accepted-on notice, and
// nothing separates the acceptance that currently stands from the older date behind it.
async function announceChangedTerms(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();
  await surface.signOut();
}

test("when an administrator announces that the terms have changed, every vendor's standing acceptance is withdrawn and each of them is asked to read and agree to the new terms before continuing", async ({
  surface,
}) => {
  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileLegal.open();
  await surface.userProfileLegal.acceptUpdatedTerms();
  await surface.userProfileLegal.confirmAcceptUpdatedTerms();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();

  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();

  await surface.userProfileLegal.acceptUpdatedTerms();
  expect(await surface.userProfileLegal.acceptUpdatedTermsModal()).toBeTruthy();

  // Every vendor, not only the one that was watched through the announcement.
  await surface.signIn(persona.vendor);
  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeTruthy();
});

test("agreeing to the new terms records a fresh acceptance", async ({ surface }) => {
  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileLegal.open();
  await surface.userProfileLegal.acceptUpdatedTerms();
  await surface.userProfileLegal.confirmAcceptUpdatedTerms();

  await surface.userProfileLegal.open();
  expect(await surface.userProfileLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileLegal.termsUpdatedWarning()).toBeFalsy();
});
