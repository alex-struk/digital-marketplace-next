// criterion: @R-3.27 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is an organization whose Sprint With Us terms have not been accepted: the seed's
// unqualified organization, owned by seed.users.vendorOne. Each test accepts the terms itself,
// and establishes first that they stand unaccepted, rather than relying on another test.
const organization = seed.organizations.unqualified;

// The owner is established as active rather than assumed. The signed-in administrator is active
// by being signed in at all, so their own status badge is what "active" reads as.
async function establishActive(surface: Surface, userId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();
  await surface.userProfile.open({ userId });
  if ((await surface.userProfile.statusBadge()) !== active) {
    await surface.userProfile.reactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await surface.userProfile.open({ userId });
  }
  expect(await surface.userProfile.statusBadge()).toBe(active);
}

// The owner reads the terms, which stand unaccepted, and accepts them. Returns the notice of the
// acceptance, which carries its date.
async function ownerAcceptsSprintWithUsTerms(surface: Surface): Promise<string> {
  await surface.signIn(persona.vendor);
  await surface.organizationSwuTerms.open({ orgId: organization.id });
  expect(await surface.organizationSwuTerms.acceptedOnNotice()).toBeFalsy();
  expect(await surface.organizationSwuTerms.termsBody()).toBeTruthy();

  await surface.organizationSwuTerms.acceptTerms();

  await surface.organizationSwuTerms.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationSwuTerms.acceptedOnNotice()).toMatch(/\d/);
  return surface.organizationSwuTerms.acceptedOnNotice();
}

test("accepting an organization's Sprint With Us terms records the date of acceptance, and the acceptance is shown on the qualification page", async ({
  surface,
}) => {
  await establishActive(surface, seed.users.vendorOne.id);

  // Read on the qualification page while the terms stand unaccepted, so the reading after
  // acceptance is told apart from this one; what the page calls either state is its own business.
  await surface.signIn(persona.vendor);
  await surface.organizationEdit.open({ orgId: organization.id });
  const termsUnaccepted = await surface.organizationEdit.swuRequirementTermsAccepted();

  await ownerAcceptsSprintWithUsTerms(surface);

  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.swuRequirementTermsAccepted()).not.toBe(termsUnaccepted);
});

test("a second attempt to accept the same terms for the same organization is refused", async ({ surface }) => {
  await establishActive(surface, seed.users.vendorOne.id);
  const firstAcceptance = await ownerAcceptsSprintWithUsTerms(surface);

  // The terms page offering no acceptance any more is as much a refusal as an acceptance that
  // is turned away, so an accept control that cannot be used is not a failure here. The page
  // names no observation of the "already accepted" message, so what is asserted is that no
  // second acceptance was recorded: the notice still carries the first acceptance's date.
  await surface.organizationSwuTerms.open({ orgId: organization.id });
  try {
    await surface.organizationSwuTerms.acceptTerms();
  } catch {
    // no acceptance offered
  }

  await surface.organizationSwuTerms.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationSwuTerms.acceptedOnNotice()).toBeTruthy();
  expect(await surface.organizationSwuTerms.acceptedOnNotice()).toBe(firstAcceptance);
});
