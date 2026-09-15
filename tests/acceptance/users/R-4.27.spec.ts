// criterion: @R-4.27 v2
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// A public sector employee is the person editing here, because the job title is asked for on
// their profile alone (R-4.28). No test here chooses a picture, so every save below is one
// made without one.
//
// A refused profile is either one whose save the screen withholds or one whose save the
// service turns down. Both count as the refusal: an attempt to save that finds nothing to
// press is caught, and what is asserted is the invalid field being marked — given time to
// appear — and the stored profile being unchanged when the page is opened again.

const jobTitle = "Senior Procurement Officer";

async function attemptSave(surface: Surface, input: { name?: string; email?: string; jobTitle?: string }) {
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  try {
    await surface.userProfileSelf.saveChanges(input);
  } catch {
    // The save was withheld.
  }
}

async function expectMarkedInvalid(surface: Surface): Promise<void> {
  await expect.poll(() => surface.userProfileSelf.fieldError()).toBeTruthy();
}

test("a profile requires a name, so a cleared name is reported as invalid and the profile is not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const before = await surface.userProfileSelf.nameField();

  await attemptSave(surface, { name: "" });

  await expectMarkedInvalid(surface);
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).toBe(before);
});

test("a profile requires a name of between one and one hundred characters", async ({ surface }) => {
  const oneHundred = "Wren".repeat(25);
  const oneHundredAndOne = `${oneHundred}s`;

  await surface.signIn(persona.publicSectorStaff);

  await attemptSave(surface, { name: oneHundred });
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).toContain(oneHundred);

  await attemptSave(surface, { name: oneHundredAndOne });
  await expectMarkedInvalid(surface);
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).toContain(oneHundred);
  expect(await surface.userProfileSelf.nameField()).not.toContain(oneHundredAndOne);

  await attemptSave(surface, { name: "W" });
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.nameField()).not.toContain(oneHundred);
  expect(await surface.userProfileSelf.nameField()).toContain("W");
});

test("a profile requires an email address in a valid format, so an invalid one is reported and not saved", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const before = await surface.userProfileSelf.emailField();

  await attemptSave(surface, { email: "not an address at all" });

  await expectMarkedInvalid(surface);
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.emailField()).toBe(before);
});

// The address saved is the account's own address in capitals, so the only way to read it
// back in lower case is for the service to have stored it so.
test("the email address is stored in lower case", async ({ surface }) => {
  const capitalised = seed.users.staffOne.email.toUpperCase();

  await surface.signIn(persona.publicSectorStaff);
  await attemptSave(surface, { email: capitalised });

  await surface.userProfileSelf.open();
  const stored = await surface.userProfileSelf.emailField();
  expect(stored).toContain(seed.users.staffOne.email);
  expect(stored).not.toContain(capitalised);
});

// A job title is saved first so that leaving it blank is a change the profile has to save.
test("the profile saves with the job title left blank and no profile picture", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);

  await attemptSave(surface, { jobTitle });
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).toContain(jobTitle);

  await attemptSave(surface, { jobTitle: "" });

  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).not.toContain(jobTitle);
  expect(await surface.userProfileSelf.fieldError()).toBeFalsy();
});

test("the job title is limited to one hundred characters", async ({ surface }) => {
  const oneHundred = "Officer of".repeat(10);
  const oneHundredAndOne = `${oneHundred}s`;

  await surface.signIn(persona.publicSectorStaff);

  await attemptSave(surface, { jobTitle: oneHundred });
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).toContain(oneHundred);

  await attemptSave(surface, { jobTitle: oneHundredAndOne });
  await expectMarkedInvalid(surface);
  await surface.userProfileSelf.open();
  expect(await surface.userProfileSelf.jobTitleField()).toContain(oneHundred);
  expect(await surface.userProfileSelf.jobTitleField()).not.toContain(oneHundredAndOne);
});
