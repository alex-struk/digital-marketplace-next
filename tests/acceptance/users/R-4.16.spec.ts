// criterion: @R-4.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
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
  await surface.userProfileSelfLegal.open();
  await surface.userProfileSelfLegal.acceptUpdatedTerms();
  await surface.userProfileSelfLegal.confirmAcceptUpdatedTerms();
  await surface.userProfileSelfLegal.open();
  expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeFalsy();

  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileSelfLegal.open();
  expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeTruthy();

  await surface.userProfileSelfLegal.acceptUpdatedTerms();
  expect(await surface.userProfileSelfLegal.acceptUpdatedTermsModal()).toBeTruthy();

  // Every vendor, not only the one watched through the announcement.
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfLegal.open();
  expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeTruthy();
});

test("agreeing to the new terms records a fresh acceptance", async ({ surface }) => {
  await announceChangedTerms(surface);

  await surface.signIn(persona.vendorWithTermsReset);
  await surface.userProfileSelfLegal.open();
  await surface.userProfileSelfLegal.acceptUpdatedTerms();
  await surface.userProfileSelfLegal.confirmAcceptUpdatedTerms();

  await surface.userProfileSelfLegal.open();
  expect(await surface.userProfileSelfLegal.acceptedOnNotice()).toBeTruthy();
  expect(await surface.userProfileSelfLegal.termsUpdatedWarning()).toBeFalsy();
});
