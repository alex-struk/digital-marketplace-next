// criterion: @R-4.1 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The two first-time personas are identities the sandbox identity provider carries and the
// seed does not, so the account read back here is the one the service made at this sign-in,
// never one the seed gave a kind. Everything is read from the signed-in person's own profile,
// which needs no identifier. The name and email address the identity provider supplies are not
// stated anywhere in the contract, so the test holds them to being present rather than to a
// value; the username is the persona's own sandbox identity.
//
// Signing in the same way again is checked by the account's identifier: the profile reached
// after the second sign-in must be the one reached after the first.
//
// The note about an identity recognised as neither kind has no persona to sign in as, and is a
// note rather than an outcome the criterion states, so it has no test here.

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function ownProfile(surface: Surface) {
  await surface.userProfileSelf.open();
  expect(await readOrEmpty(() => surface.userProfileSelf.signInRequired())).toBeFalsy();
  return {
    id: await surface.userProfileSelf.userIdentifier(),
    kind: await surface.userProfileSelf.accountType(),
    status: await surface.userProfileSelf.statusBadge(),
    username: await surface.userProfileSelf.idpUsernameReadonly(),
    name: await surface.userProfileSelf.nameField(),
    email: await surface.userProfileSelf.emailField(),
  };
}

async function signInTwice(surface: Surface, who: Persona, username: string) {
  await surface.signIn(who);
  const first = await ownProfile(surface);
  expect(first.id).toBeTruthy();
  expect(first.status).toMatch(/active/i);
  expect(first.status).not.toMatch(/inactive|deactivated/i);
  expect(first.username).toContain(username);
  expect(first.name).toBeTruthy();
  expect(first.email).toBeTruthy();

  await surface.signOut();
  await surface.signIn(who);
  const second = await ownProfile(surface);
  expect(second.id).toBe(first.id);

  return first;
}

test("the first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a government identity makes a public sector employee", async ({
  surface,
}) => {
  const account = await signInTwice(surface, persona.firstTimePublicSectorEmployee, "first-time-gov");

  expect(account.kind).toMatch(/public sector/i);
  expect(account.kind).not.toMatch(/vendor/i);
});

test("the first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a code-hosting identity makes a vendor", async ({
  surface,
}) => {
  const account = await signInTwice(surface, persona.firstTimeVendor, "first-time-vendor");

  expect(account.kind).toMatch(/vendor/i);
  expect(account.kind).not.toMatch(/public sector/i);
});
