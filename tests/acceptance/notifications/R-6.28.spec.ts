// criterion: @R-6.28 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The broadcast of changed terms goes to every active vendor. Which vendors are active is read
// through the surface just before the broadcast, never assumed from the seed: another test in
// the suite leaves seed.users.vendorOne deactivated. The signed-in administrator's own record
// is the reference, since it is the account doing the broadcasting; a vendor whose status
// badge reads the same is active. seed.users.vendorWithoutEmail, which holds no address, must
// be among them, or the broadcast would have no recipient it cannot address to continue past.
//
// Every addressable active vendor is looked at on each attempt, and the ones not reached are
// reported together, so one vendor missing does not hide whether the rest were reached.
//
// Two parts are not asserted. Whether the service skips that recipient or composes a message
// addressed to nobody leaves the same trace in the catcher either way, since a message with no
// recipient cannot arrive there; the difference shows only inside the service. And a recipient
// the service can address but cannot reach cannot be produced: every seeded address is one
// the catcher accepts, and nothing in the surface makes one delivery fail.
test("the service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach", async ({
  surface,
  mail,
}) => {
  const vendors = Object.values(seed.users).filter((user) => user.account_type === "VENDOR");

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const activeBadge = await surface.userProfile.statusBadge();

  const active: (typeof vendors)[number][] = [];
  for (const vendor of vendors) {
    await surface.userProfile.open({ userId: vendor.id });
    if ((await surface.userProfile.statusBadge()) === activeBadge) active.push(vendor);
  }
  expect(active.map((vendor) => vendor.id)).toContain(seed.users.vendorWithoutEmail.id);

  const addressable = active.flatMap((vendor) => (vendor.email ? [vendor.email] : []));
  expect(addressable.length).toBeGreaterThan(0);
  const before = new Map(
    await Promise.all(addressable.map(async (address) => [address, (await mail.messagesTo(address)).length] as const)),
  );

  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await expect
    .poll(
      async () => {
        const unreached: string[] = [];
        for (const address of addressable) {
          if ((await mail.messagesTo(address)).length <= (before.get(address) ?? 0)) unreached.push(address);
        }
        return unreached;
      },
      { message: "active vendors with an address who received no message", timeout: 30000 },
    )
    .toEqual([]);
});
