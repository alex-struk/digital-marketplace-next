// criterion: @R-6.23 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// Which vendors are active is read through the surface at the moment of the announcement,
// never assumed from the seed: another test in the suite leaves seed.users.vendorOne
// deactivated. The signed-in administrator's own record is the reference, since it is the
// account doing the announcing; a vendor whose status badge reads the same is active, and one
// whose badge reads otherwise is deactivated.
//
// Withdrawal is read, as the administrator sees it, on the legal settings of every vendor who
// held a standing acceptance before the announcement — accepted, with no warning of changed
// terms — so a warning read afterwards belongs to this announcement and not to an earlier one.
// A vendor already warned beforehand is left out of that check, since nothing could attribute
// their warning to this run.
//
// The message is found by each active vendor's own address. That it asks them to read and
// accept the new terms is checked as far as the listing reaches — its subject and the opening
// of its body name the terms — because the mail fixture returns no whole body. An active
// vendor holding no address cannot be looked up in the catcher, so only addressable ones are.
test("an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms", async ({
  surface,
  mail,
}) => {
  test.slow();
  const vendors = Object.values(seed.users).filter((user) => user.account_type === "VENDOR");
  type Vendor = (typeof vendors)[number];

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const activeBadge = await surface.userProfile.statusBadge();

  const active: Vendor[] = [];
  const deactivated: Vendor[] = [];
  const standingAcceptance: Vendor[] = [];
  for (const vendor of vendors) {
    await surface.userProfile.open({ userId: vendor.id });
    ((await surface.userProfile.statusBadge()) === activeBadge ? active : deactivated).push(vendor);

    await surface.userProfileLegal.open({ userId: vendor.id });
    const accepted = await surface.userProfileLegal.acceptedOnNotice();
    const warned = await surface.userProfileLegal.termsUpdatedWarning();
    if (accepted && !warned) standingAcceptance.push(vendor);
  }

  // The given: a mix of active and deactivated vendors, each group holding a standing acceptance.
  expect(standingAcceptance.filter((vendor) => active.includes(vendor)).length).toBeGreaterThan(0);
  expect(standingAcceptance.filter((vendor) => deactivated.includes(vendor)).length).toBeGreaterThan(0);

  const activeAddresses = active.flatMap((vendor) => (vendor.email ? [vendor.email] : []));
  const before = await Promise.all(activeAddresses.map(async (address) => (await mail.messagesTo(address)).length));

  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();

  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  for (const vendor of standingAcceptance) {
    await expect
      .poll(
        async () => {
          await surface.userProfileLegal.open({ userId: vendor.id });
          return await surface.userProfileLegal.termsUpdatedWarning();
        },
        { message: `acceptance withdrawn for ${vendor.id}`, timeout: 15000 },
      )
      .toBeTruthy();
  }

  for (const [i, address] of activeAddresses.entries()) {
    await expect
      .poll(async () => (await mail.messagesTo(address)).length, { timeout: 15000 })
      .toBeGreaterThan(before[i]);
    const message = await mail.latestTo(address);
    expect(`${message?.Subject ?? ""} ${message?.Snippet ?? ""}`).toMatch(/terms/i);
  }
});
