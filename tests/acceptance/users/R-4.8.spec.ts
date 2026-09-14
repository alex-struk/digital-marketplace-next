// criterion: @R-4.8 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The seed records capabilities on three of its vendors, so these are the service's own
// listed capabilities named as the seed names them rather than values invented here.
// seed.users.vendorOne carries none, which is the criterion's given.
const capabilities = seed.users.organizationMember.capabilities;

test("a vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfCapabilities.open();

  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[0] });
  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[1] });

  await surface.userProfileSelfCapabilities.open();
  const held = await surface.userProfileSelfCapabilities.capabilityChecked();
  expect(held).toContain(capabilities[0]);
  expect(held).toContain(capabilities[1]);
  expect(held).not.toContain(capabilities[2]);

  // Turning one off again removes it; turning the second off too leaves the account as it
  // was found.
  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[0] });
  await surface.userProfileSelfCapabilities.open();
  expect(await surface.userProfileSelfCapabilities.capabilityChecked()).not.toContain(capabilities[0]);

  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[1] });
});

// The administrator's half is asserted as the absence of the control rather than by
// pressing it: an administrator looking at somebody else's account is shown the profile
// section alone (R-4.34), so there is no capability control to press, and a test that
// pressed one would fail on the very behaviour the criterion describes. The vendor's
// holdings are then read back unchanged.
test("only the vendor may change their capabilities, so an administrator viewing that vendor's profile is offered no working control", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfileSelfCapabilities.open();
  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[0] });
  await surface.userProfileSelfCapabilities.open();
  const held = await surface.userProfileSelfCapabilities.capabilityChecked();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfile.capabilitiesTab()).toBeFalsy();

  await surface.userProfileCapabilities.open({ userId: seed.users.vendorOne.id });
  expect(await surface.userProfileCapabilities.capabilityRow()).toBeFalsy();

  await surface.signIn(persona.vendor);
  await surface.userProfileSelfCapabilities.open();
  expect(await surface.userProfileSelfCapabilities.capabilityChecked()).toBe(held);

  await surface.userProfileSelfCapabilities.toggleCapability({ capability: capabilities[0] });
});
