// criterion: @R-4.6 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's other half — a second vendor signing in for the first time carrying an
// email address an existing vendor already holds — needs an identity the service has not
// yet registered. No persona denotes one, so only the profile-edit half is derived here.
test("two accounts of the same kind may not share an email address: an existing vendor editing their profile to another vendor's address is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: seed.users.organizationOwner.email });

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.emailField()).toContain(seed.users.vendorOne.email);
});
