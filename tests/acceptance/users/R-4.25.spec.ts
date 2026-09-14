// criterion: @R-4.25 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// That the service itself refuses the record, rather than the interface merely hiding it, is
// not separable here: the criterion says the interface answers the refusal with a missing
// page, and a missing page is what user-profile reports.
test("a person's account record may not be read by anyone but that person or an administrator, and in the interface anyone else is shown a missing-page instead of a refusal", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeTruthy();
  expect(await surface.userProfile.emailField()).not.toContain(seed.users.organizationOwner.email);
});

test("an administrator may read another person's account record", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});

test("a person may read their own account record", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.userProfile.open({ userId: seed.users.organizationOwner.id });

  expect(await surface.userProfile.notFoundPage()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.organizationOwner.email);
});
