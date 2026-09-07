// criterion: @R-4.8 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seed names the service's capabilities only as the ones particular people hold, so
// two of those stand in for "capabilities from the service's own list" here.
const firstCapability = seed.users.organizationOwner.capabilities[0];
const secondCapability = seed.users.organizationOwner.capabilities[1];

test("a vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileCapabilities.open({ userId: "me" });
  await surface.userProfileCapabilities.toggleCapability({ capability: firstCapability });
  await surface.userProfileCapabilities.toggleCapability({ capability: secondCapability });

  await surface.userProfileCapabilities.open({ userId: "me" });
  const held = await surface.userProfileCapabilities.capabilityChecked();
  expect(held).toContain(firstCapability);
  expect(held).toContain(secondCapability);

  // Leave the account as the seed describes it: a vendor holding no capabilities.
  await surface.userProfileCapabilities.toggleCapability({ capability: firstCapability });
  await surface.userProfileCapabilities.toggleCapability({ capability: secondCapability });
});

test("only they may change them: an administrator viewing that vendor's profile is offered no working control", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });

  expect(await surface.userProfile.capabilitiesTab()).toBeFalsy();
});
