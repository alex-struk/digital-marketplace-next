// criterion: @R-4.14 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userList.open();

  expect(await surface.userList.userRow()).toBeTruthy();
  expect(await surface.userList.statusBadge()).toBeTruthy();
  expect(await surface.userList.accountType()).toBeTruthy();
  expect(await surface.userList.adminCheck()).toBeTruthy();
});

test("an administrator can narrow the list by typing part of a name", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  // The seed carries no names, so the two names to search on and to be excluded are read
  // off the profiles of the people the seed does name.
  await surface.userProfile.open({ userId: seed.users.vendorOne.id });
  const vendorName = await surface.userProfile.nameField();
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const staffName = await surface.userProfile.nameField();

  await surface.userList.open();
  await surface.userList.searchByName({ query: vendorName });

  const rows = await surface.userList.userRow();
  expect(rows).toContain(vendorName);
  expect(rows).not.toContain(staffName);
});
