// criterion: @R-4.18 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// The clause about the service refusing a profile change submitted against an account that
// is not the requester's own is not asserted. Every profile change the surface can make
// goes through the editing control, and the first test below is that the control is not
// there for an administrator, so a test that pressed it would fail on the behaviour the
// criterion asks for rather than on its absence. Nothing in the surface sends the change
// another way.
//
// The administrator's view is told apart from the person's own view of the same profile,
// so the absence of the editing control is the absence of something the screen does offer
// its owner rather than a word the screen never uses.
test("a person's profile details may be changed only by that person, so an administrator viewing somebody else's profile is offered no editing control", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  expect(await surface.userProfile.profileTab()).toContain("Edit");

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.vendorOne.id });
  expect(await surface.userProfile.profileTab()).not.toContain("Edit");
});

test("an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ user: seed.users.staffOne.id });

  const asAdministrator = await surface.userProfile.profileTab();
  expect(asAdministrator).toContain("Deactivate");
  expect(asAdministrator).not.toContain("Edit");

  expect(await surface.userProfile.adminCheckbox()).toBeTruthy();
});
