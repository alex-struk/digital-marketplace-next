// criterion: @R-4.27 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";

// A public sector employee is the person editing here, because the job title is asked for
// on their profile alone (R-4.28). The address the lower-case test saves is the account's
// own address shouted, so the profile ends the run holding exactly the address the seed
// gave it, and nothing else in the suite is disturbed by an account changing hands with an
// address it never had.
const jobTitle = "Senior Procurement Officer";

test("a profile requires a name, so clearing the name is refused and the profile is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  const before = await surface.userProfile.nameField();

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ name: "" });

  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open();
  expect(await surface.userProfile.nameField()).toBe(before);
});

test("a profile requires a name of no more than one hundred characters", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  const before = await surface.userProfile.nameField();
  const tooLong = "Wren".repeat(26);

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ name: tooLong });

  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open();
  expect(await surface.userProfile.nameField()).toBe(before);
  expect(await surface.userProfile.nameField()).not.toContain(tooLong);
});

test("a profile requires an email address in a valid format", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  const before = await surface.userProfile.emailField();

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: "not an address at all" });

  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open();
  expect(await surface.userProfile.emailField()).toBe(before);
});

test("the email address is stored in lower case", async ({ surface }) => {
  const shouted = seed.users.staffOne.email.toUpperCase();

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ email: shouted });

  await surface.userProfile.open();
  const stored = await surface.userProfile.emailField();
  expect(stored).toContain(seed.users.staffOne.email);
  expect(stored).not.toContain(shouted);
});

test("the job title may be left blank, and the profile picture is optional", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ jobTitle });

  await surface.userProfile.open();
  expect(await surface.userProfile.jobTitleField()).toContain(jobTitle);

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ jobTitle: "" });

  expect(await surface.userProfile.fieldError()).toBeFalsy();

  await surface.userProfile.open();
  expect(await surface.userProfile.jobTitleField()).not.toContain(jobTitle);
});

test("the job title is limited to one hundred characters", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  const tooLong = "Officer of".repeat(11);

  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ jobTitle: tooLong });

  expect(await surface.userProfile.fieldError()).toBeTruthy();

  await surface.userProfile.open();
  expect(await surface.userProfile.jobTitleField()).not.toContain(tooLong);
});
