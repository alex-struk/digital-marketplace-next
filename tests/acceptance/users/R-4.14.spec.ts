// criterion: @R-4.14 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The seed names no account's name, and a name may be set only by the person whose account
// it is (R-4.18), so each test writes the names it then looks for through the own profile of
// the person who holds it. The names share a surname and differ in the first name, so their
// order by name is known before the list is read.
const vendorFirstByName = "Aldous Quillfeather";
const vendorLastByName = "Zinnia Quillfeather";
const staffName = "Marlowe Quillfeather";
// First of all by name, so that finding it after every active account can only be the order
// by status.
const inactiveName = "Abner Quillfeather";

// Which accounts are active is established rather than assumed. The signed-in administrator
// is active by being signed in at all, so their own status badge is what "active" reads as;
// any other account whose badge reads otherwise is reactivated before the test relies on it.
async function activeReading(surface: Surface): Promise<string> {
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  return surface.userProfile.statusBadge();
}

async function establishActive(surface: Surface, userId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  const active = await activeReading(surface);
  await surface.userProfile.open({ userId });
  if ((await surface.userProfile.statusBadge()) !== active) {
    await surface.userProfile.reactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await surface.userProfile.open({ userId });
  }
  expect(await surface.userProfile.statusBadge()).toBe(active);
}

async function nameThemselves(surface: Surface, who: Persona, name: string): Promise<void> {
  await surface.signIn(who);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.editProfile();
  await surface.userProfileSelf.saveChanges({ name });
}

async function nameTwoActiveVendors(surface: Surface): Promise<void> {
  await establishActive(surface, seed.users.vendorOne.id);
  await establishActive(surface, seed.users.fileUploader.id);
  await nameThemselves(surface, persona.vendor, vendorFirstByName);
  await nameThemselves(surface, persona.fileUploader, vendorLastByName);
}

test("an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator", async ({
  surface,
}) => {
  await nameTwoActiveVendors(surface);

  await surface.signIn(persona.administrator);
  await surface.userList.open();

  await expect.poll(() => surface.userList.userRow()).toContain(vendorLastByName);
  const rows = await surface.userList.userRow();
  expect(rows).toContain(vendorFirstByName);
  expect(rows).toContain(vendorLastByName);

  expect(await surface.userList.statusBadge()).toBeTruthy();
  expect(await surface.userList.accountType()).toBeTruthy();
  expect(await surface.userList.adminCheck()).toBeTruthy();
});

test("everyone registered is listed by status, then account kind, then name", async ({ surface }) => {
  // The given: two active vendors, a public sector employee, and a deactivated vendor. The
  // deactivated vendor can only name themselves while able to sign in, so they are
  // reactivated, name themselves, and are deactivated again before the list is read.
  await nameTwoActiveVendors(surface);
  await establishActive(surface, seed.users.staffOne.id);
  await nameThemselves(surface, persona.publicSectorStaff, staffName);

  await establishActive(surface, seed.users.vendorDeactivated.id);
  await nameThemselves(surface, persona.deactivatedVendor, inactiveName);
  await surface.signIn(persona.administrator);
  const active = await activeReading(surface);
  await surface.userProfile.open({ userId: seed.users.vendorDeactivated.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
  await surface.userProfile.open({ userId: seed.users.vendorDeactivated.id });
  expect(await surface.userProfile.statusBadge()).not.toBe(active);

  await surface.userList.open();
  await expect.poll(() => surface.userList.userRow()).toContain(inactiveName);
  const rows = await surface.userList.userRow();
  const at = (name: string) => rows.indexOf(name);
  for (const name of [vendorFirstByName, vendorLastByName, staffName]) {
    expect(at(name)).toBeGreaterThanOrEqual(0);
  }

  // Status first: the inactive account comes after every active one, although its name
  // comes first.
  expect(at(inactiveName)).toBeGreaterThan(at(vendorFirstByName));
  expect(at(inactiveName)).toBeGreaterThan(at(vendorLastByName));
  expect(at(inactiveName)).toBeGreaterThan(at(staffName));

  // Then account kind: the public sector employee is not placed between two vendors, which
  // an order by name alone would do. Which kind comes first the criterion does not say.
  const staffBetweenVendors = at(staffName) > at(vendorFirstByName) && at(staffName) < at(vendorLastByName);
  expect(staffBetweenVendors).toBe(false);

  // Then name, among accounts of the same status and kind.
  expect(at(vendorFirstByName)).toBeLessThan(at(vendorLastByName));
});

test("an administrator can narrow the list by typing part of a name", async ({ surface }) => {
  await nameTwoActiveVendors(surface);

  await surface.signIn(persona.administrator);
  await surface.userList.open();
  await expect.poll(() => surface.userList.userRow()).toContain(vendorLastByName);

  await surface.userList.searchByName({ text: "Aldous" });

  await expect.poll(() => surface.userList.userRow()).not.toContain(vendorLastByName);
  expect(await surface.userList.userRow()).toContain(vendorFirstByName);
});
