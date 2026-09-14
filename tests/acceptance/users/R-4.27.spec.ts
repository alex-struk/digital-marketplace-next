// criterion: @R-4.27 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// A public sector employee is the person editing here, because the job title is asked for on
// their profile alone (R-4.28). The address the lower-case test saves is the account's own
// address in capitals, so the profile ends the run holding exactly the address the seed gave
// it. No test here chooses a picture, so every save below is one made without one.
const jobTitle = "Senior Procurement Officer";

test("a profile requires a name, so clearing the name is refused and the profile is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const before = await surface.userProfileSelf.nameField();

  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ name: "" });

  expect(await surface.userProfileSelf.fieldError()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).toBe(before);
});

test("a profile requires a name of no more than one hundred characters", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const before = await surface.userProfileSelf.nameField();
  const tooLong = "Wren".repeat(26);

  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ name: tooLong });

  expect(await surface.userProfileSelf.fieldError()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).toBe(before);
  expect(await surface.userProfileSelf.nameField()).not.toContain(tooLong);
});

test("a profile requires an email address in a valid format", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const before = await surface.userProfileSelf.emailField();

  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ email: "not an address at all" });

  expect(await surface.userProfileSelf.fieldError()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.emailField()).toBe(before);
});

test("the email address is stored in lower case", async ({ surface }) => {
  const capitalised = seed.users.staffOne.email.toUpperCase();

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ email: capitalised });

  await surface.userProfileSelf.open();
  const stored = await surface.userProfileSelf.emailField();
  expect(stored).toContain(seed.users.staffOne.email);
  expect(stored).not.toContain(capitalised);
});

test("the job title may be left blank, and the profile picture is optional", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ jobTitle });

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).toContain(jobTitle);

  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ jobTitle: "" });

  expect(await surface.userProfileSelf.fieldError()).toBeFalsy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).not.toContain(jobTitle);
});

test("the job title is limited to one hundred characters", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const tooLong = "Officer of".repeat(11);

  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ jobTitle: tooLong });

  expect(await surface.userProfileSelf.fieldError()).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).not.toContain(tooLong);
});
