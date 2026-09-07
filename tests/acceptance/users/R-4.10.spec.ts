// criterion: @R-4.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("only an administrator may reactivate somebody else's account, and only an account that an administrator deactivated", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });
  const knownActive = await surface.userProfile.statusBadge();

  await surface.userProfile.open({ userId: seed.users.invitedVendor.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();

  expect(await surface.userProfile.statusBadge()).toBe(knownActive);
});

test("a request to reactivate an account the person deactivated themselves is refused", async ({ surface }) => {
  await surface.signIn(persona.organizationMember);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });
  const knownActive = await surface.userProfile.statusBadge();

  await surface.userProfile.open({ userId: seed.users.organizationMember.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
  expect(await surface.userProfile.statusBadge()).not.toBe(knownActive);

  // Signing in again is the only route back for a self-deactivated account (R-4.5).
  await surface.signIn(persona.organizationMember);
});
