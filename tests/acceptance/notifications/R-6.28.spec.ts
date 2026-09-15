// criterion: @R-6.28 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The criterion makes three claims, and only one of them can be read from outside the service.
//
// Asserted: a broadcast continues past a recipient it cannot address. The broadcast used is the
// announcement of changed terms, which goes to every active vendor at each one's own visible
// address, so each arrival can be found in the catcher. seed.users.vendorWithoutEmail holds no
// address, and it has to be among the active vendors when the broadcast runs, or the broadcast
// would have no such recipient to continue past. Whether a vendor is active is read through the
// surface rather than assumed from the seed; the signed-in administrator's own record is the
// reference, and a vendor whose status badge reads the same is active. Every addressable active
// vendor is checked on each attempt, and the ones not reached are reported together. The order
// the service sends in cannot be seen, so this holds as evidence only while at least one
// addressable vendor comes after the one without an address. With several addressable vendors
// around it, a run that stopped at that recipient would leave somebody unreached.
//
// Not asserted: that the service skips the recipient rather than composing a message addressed
// to nobody. A message with no recipient cannot arrive in the catcher either way, and the
// service shows the difference on no page, so the two leave the same trace.
//
// Not asserted: that a broadcast continues past a recipient it can address but cannot reach.
// Every seeded address is one the catcher accepts, and nothing in the surface, the seed or
// `mail` makes one delivery fail while the others succeed.
test("a broadcast to many people always continues past a recipient it cannot address", async ({ surface, mail }) => {
  const vendors = Object.values(seed.users).filter((user) => user.account_type === "VENDOR");
  expect(seed.users.vendorWithoutEmail.email).toBeNull();

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
  expect(addressable.length).toBeGreaterThan(1);
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
