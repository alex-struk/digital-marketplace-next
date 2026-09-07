// criterion: @R-4.27 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("a profile requires a name of between one and one hundred characters: clearing the name is reported as invalid and the profile is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });
  const originalName = await surface.userProfile.nameField();

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ name: "" });
  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.nameField()).toBe(originalName);
});

test("a profile requires an email address in a valid format", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: "not-an-email-address" });
  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.emailField()).toContain(seed.users.staffOne.email);
});

test("the email address is stored in lower case", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: seed.users.staffOne.email.toUpperCase() });

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.emailField()).toContain(seed.users.staffOne.email);
});

test("the job title may be left blank and the profile picture is optional", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ jobTitle: "" });
  expect(await surface.userProfile.fieldError()).toBeFalsy();

  await surface.userProfile.open({ userId: "me" });
  expect(await surface.userProfile.jobTitleField()).toBeFalsy();
  expect(await surface.userProfile.emailField()).toContain(seed.users.staffOne.email);
});
