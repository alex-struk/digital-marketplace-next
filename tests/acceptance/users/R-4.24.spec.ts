// criterion: @R-4.24 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona } from "../../fixtures";

// The seeded vendor has an account but has never completed the profile and has made no
// choice about notices, so their account starts with no moment recorded. After ticking the
// box and completing the profile, the account record read back as themselves carries the
// moment notices were turned on. That moment is set by the service's clock, not this
// runner's, so it is held to the window around the completion with room for drift between
// the two.

const CLOCK_DRIFT_MS = 5 * 60 * 1000;

test("While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.", async ({
  surface,
}) => {
  await surface.signIn(persona.vendorCompletingProfile);

  await surface.userAccountSelfRequest.open();
  expect(await surface.userAccountSelfRequest.newOpportunityNoticesSince()).toBe("");

  await surface.userSignUpComplete.open();
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
