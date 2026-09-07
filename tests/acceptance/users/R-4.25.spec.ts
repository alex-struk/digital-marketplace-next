// criterion: @R-4.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("anyone but that person or an administrator is refused a person's account record and, in the interface, is shown a missing-page instead of a refusal", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeTruthy();
  expect(await surface.userProfile.emailField()).not.toContain(seed.users.organizationOwner.email);
});

test("a person's account record may be read by an administrator", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});

test("a person's account record may be read by that person", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});
