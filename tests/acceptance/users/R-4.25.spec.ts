// criterion: @R-4.25 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

test("a person's account record may not be read by anyone but that person or an administrator, and in the interface the other person is shown a missing-page instead of a refusal", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ user: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeTruthy();
  expect(await surface.userProfile.emailField()).not.toContain(seed.users.organizationOwner.email);
});

test("an administrator may read another person's account record", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});

test("a person may read their own account record", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.userProfile.open({ user: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});
