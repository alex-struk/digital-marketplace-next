// criterion: @R-4.24 v1
// provenance: blind, spec@0518dccea59a1ad5bce1f3b3ed4a00d0c8c61c73, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";

// seed.users.vendorCompletingProfile has an account but has never completed the profile or
// agreed to the terms, and has made no choice about notices, so the completion form is
// offered to them and their account starts with no moment recorded. The form being shown
// is checked before anything is done on it, so a run that never reaches it fails there
// rather than on the account record. Agreeing to the terms is only what completing the
// profile needs; the choice under test is the notices box.
//
// The moment is set by the service's clock, not this runner's, so it is held to the window
// around the completion with room for drift between the two.

const CLOCK_DRIFT_MS = 5 * 60 * 1000;

test("While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorCompletingProfile);

  await surface.userAccountSelfRequest.open();
  expect(await surface.userAccountSelfRequest.newOpportunityNoticesSince()).toBe("");

  await surface.userSignUpComplete.open();
  expect(await surface.userSignUpComplete.termsCheckbox()).toBeTruthy();

  const before = Date.now();
  await surface.userSignUpComplete.toggleNewOpportunityNotifications();
  await surface.userSignUpComplete.acceptAppTerms();
  await surface.userSignUpComplete.completeProfile();
  const after = Date.now();

  await surface.userAccountSelfRequest.open();
  const since = await surface.userAccountSelfRequest.newOpportunityNoticesSince();
  expect(since).not.toBe("");
  const recorded = Date.parse(since);
  expect(Number.isNaN(recorded)).toBe(false);
  expect(recorded).toBeGreaterThanOrEqual(before - CLOCK_DRIFT_MS);
  expect(recorded).toBeLessThanOrEqual(after + CLOCK_DRIFT_MS);
});
