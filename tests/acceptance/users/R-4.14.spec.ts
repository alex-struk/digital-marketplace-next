// criterion: @R-4.14 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The seed names no account's name, and a name may be set only by the person whose account
// it is (R-4.18), so each test writes the names it then looks for through the profile of
// the person who holds it. Two active vendors are used, because among accounts of the same
// status and the same kind the order is the order of the names, which is the only part of
// "status, then account kind, then name" a test can settle: the deactivated account cannot
// sign in to be given a name, and nothing returns the name standing on a row otherwise.
const firstByName = "Aldous Quillfeather";
const lastByName = "Zinnia Quillfeather";

async function nameThemselves(surface: Surface, who: Persona, name: string): Promise<void> {
  await surface.signIn(who);
  await surface.userProfile.open();
  await surface.userProfile.editProfile();
  await surface.userProfile.saveChanges({ name });
}

test("an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator", async ({
  surface,
}) => {
  await nameThemselves(surface, persona.vendor, firstByName);
  await nameThemselves(surface, persona.fileUploader, lastByName);

  await surface.signIn(persona.administrator);
  await surface.userList.open();

  const rows = await surface.userList.userRow();
  expect(rows).toContain(firstByName);
  expect(rows).toContain(lastByName);

  expect(await surface.userList.statusBadge()).toBeTruthy();
  expect(await surface.userList.accountType()).toBeTruthy();
  expect(await surface.userList.adminCheck()).toBeTruthy();
});

test("everyone registered is listed by status, then account kind, then name", async ({ surface }) => {
  await nameThemselves(surface, persona.vendor, firstByName);
  await nameThemselves(surface, persona.fileUploader, lastByName);

  await surface.signIn(persona.administrator);
  await surface.userList.open();

  const rows = await surface.userList.userRow();
  expect(rows.indexOf(firstByName)).toBeLessThan(rows.indexOf(lastByName));
});

test("an administrator can narrow the list by typing part of a name", async ({ surface }) => {
  await nameThemselves(surface, persona.vendor, firstByName);
  await nameThemselves(surface, persona.fileUploader, lastByName);

  await surface.signIn(persona.administrator);
  await surface.userList.open();
  await surface.userList.searchByName({ text: "Aldous" });

  const narrowed = await surface.userList.userRow();
  expect(narrowed).toContain(firstByName);
  expect(narrowed).not.toContain(lastByName);
});
