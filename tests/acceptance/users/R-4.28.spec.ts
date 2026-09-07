// criterion: @R-4.28 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("the job title is asked for and shown on a public sector employee's profile", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.editProfile();

  expect(await surface.userProfile.jobTitleField()).toBeTruthy();
});

test("a vendor is never asked for a job title", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.userProfile.open({ userId: "me" });
  await surface.userProfile.editProfile();

  expect(await surface.userProfile.jobTitleField()).toBeFalsy();
});
