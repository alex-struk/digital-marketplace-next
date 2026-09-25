// criterion: @R-4.20 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The part of the mail fixture this test reads.
type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

// The two messages differ only in their wording, so each is read whole from the catcher. The
// administrator's reactivation is made on seed.users.vendorDeactivated, whom an administrator
// deactivated. The self-reactivation is made by persona.selfReactivatingVendor
// (seed.users.vendorReturning) deactivating their own account and signing in again through the
// identity provider. The self-reactivation message is recognised by the words R-4.5 gives it,
// "successfully reactivated"; the administrator's by naming an administrator.

const reactivatedByAdministrator = seed.users.vendorDeactivated;
const returning = seed.users.vendorReturning;

async function bodiesTo(surface: Surface, mail: Mail, address: string): Promise<string[]> {
  await expect
    .poll(async () => (await mail.messagesTo(address)).length, { timeout: 10000, message: `no message reached ${address}` })
    .toBeGreaterThan(0);
  const bodies: string[] = [];
  for (const message of await mail.messagesTo(address)) {
    await surface.caughtMessage.open({ messageId: message.ID });
    bodies.push(await surface.caughtMessage.plainTextBody());
  }
  return bodies;
}

async function administratorReactivates(surface: Surface, mail: Mail): Promise<string[]> {
  await mail.clear();
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: reactivatedByAdministrator.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
  expect(await surface.userProfile.statusBadge()).not.toMatch(/inactive|deactivated/i);
  return bodiesTo(surface, mail, reactivatedByAdministrator.email!);
}

test("a person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions", async ({
  surface,
  mail,
}) => {
  const bodies = await administratorReactivates(surface, mail);

  const told = bodies.find((body) => /administrator/i.test(body) && /reactivated/i.test(body));
  expect(told, "no message says an administrator reactivated the account").toBeTruthy();
  expect(told).toMatch(/Digital Marketplace/);
  expect(told).toMatch(/contact/i);
});

test("the message telling a person they reactivated the account themselves is not sent when an administrator reactivates it", async ({
  surface,
  mail,
}) => {
  const bodies = await administratorReactivates(surface, mail);

  for (const body of bodies) expect(body).not.toMatch(/successfully reactivated/i);
});

test("the message telling a person they reactivated the account themselves is sent when they did so by signing in again", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.selfReactivatingVendor);
  await surface.userProfileSelf.open();
  await surface.userProfileSelf.deactivateAccount();
  await surface.userProfileSelf.confirmActivationChange();

  await mail.clear();
  await surface.signIn(persona.selfReactivatingVendor);

  const bodies = await bodiesTo(surface, mail, returning.email!);
  expect(bodies.some((body) => /successfully reactivated/i.test(body))).toBe(true);
});
