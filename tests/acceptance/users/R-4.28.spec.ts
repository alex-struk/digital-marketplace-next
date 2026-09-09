// criterion: @R-4.28 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";

// The public sector employee is given a job title before the field is read, so that the
// field being offered is not confused with an account that simply holds no job title; the
// vendor is offered no field to put one in, which is what the criterion turns on.
const jobTitle = "Procurement Lead";

test("the job title is asked for and shown on a public sector employee's profile", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open();
  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ jobTitle });

  await surface.userProfile.open();
  expect(await surface.userProfile.jobTitleField()).toContain(jobTitle);

  await surface.userProfile.editProfile();
  expect(await surface.userProfile.jobTitleField()).toContain(jobTitle);
  await surface.userProfile.cancelEditing();
});

test("a vendor is never asked for a job title", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open();
  await surface.userProfile.editProfile();

  expect(await surface.userProfile.nameField()).toBeTruthy();
  expect(await surface.userProfile.jobTitleField()).toBeFalsy();

  await surface.userProfile.cancelEditing();
});
