// criterion: @R-6.23 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona } from "../../fixtures";

// A vendor's acceptance of the terms, and the request to accept changed ones, are shown only to
// that vendor, so both are read on their own legal settings while signed in as them. Every vendor
// the seed gives a persona to is looked at; one without a persona cannot be signed in as, so only
// the message it is sent is checked.
//
// Which vendors are active is read, as the administrator sees it, from each vendor's status badge,
// taking the administrator's own badge as what "active" reads. A deactivated vendor cannot be
// relied on to reach their own settings, so for the given the administrator reactivates them just
// long enough to read their acceptance and then deactivates them again before the announcement;
// after it, they are reactivated to read what they find on returning.
//
// A standing acceptance is an accepted-on notice with no warning of changed terms, so a warning
// read afterwards belongs to this announcement. A vendor warned beforehand (the seed holds one)
// has no standing acceptance to withdraw and is left out of that check, though still messaged.
//
// The message is found by each active vendor's own address; that it names the change is checked
// as far as the catcher's listing reaches, its subject and the opening of its body. The link to
// read and accept the new terms is not asserted: the mail fixture returns no whole body. An active
// vendor holding no address cannot be looked up in the catcher, so only addressable ones are.
test("an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms", async ({
  surface,
  mail,
}) => {
  test.slow();

  const vendors = Object.values(seed.users).filter((user) => user.account_type === "VENDOR");
  type Vendor = (typeof vendors)[number];
  const personaOf = (vendor: Vendor): Persona | undefined =>
    "persona" in vendor ? Object.values(persona).find((p) => p.id === vendor.persona && p.signIn !== null) : undefined;

  let signedIn = false;
  const actAs = async (who: Persona) => {
    if (signedIn) await surface.signOut();
    await surface.signIn(who);
    signedIn = true;
  };

  await actAs(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const activeBadge = await surface.userProfile.statusBadge();
  expect(activeBadge).toBeTruthy();

  const setActive = async (vendor: Vendor, active: boolean) => {
    await surface.userProfile.open({ userId: vendor.id });
    if (active) await surface.userProfile.reactivateAccount();
    else await surface.userProfile.deactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await expect
      .poll(
        async () => {
          await surface.userProfile.open({ userId: vendor.id });
          return (await surface.userProfile.statusBadge()) === activeBadge;
        },
        { message: `${vendor.id} ${active ? "reactivated" : "deactivated"}`, timeout: 15000 },
      )
      .toBe(active);
  };

  const active: Vendor[] = [];
  const deactivated: Vendor[] = [];
  for (const vendor of vendors) {
    await surface.userProfile.open({ userId: vendor.id });
    ((await surface.userProfile.statusBadge()) === activeBadge ? active : deactivated).push(vendor);
  }

  const readOwnLegal = async (vendor: Vendor) => {
    await actAs(personaOf(vendor)!);
    await surface.userProfileSelfLegal.open();
    return {
      accepted: await surface.userProfileSelfLegal.acceptedOnNotice(),
      warned: await surface.userProfileSelfLegal.termsUpdatedWarning(),
    };
  };

  const standingAcceptance: Vendor[] = [];
  for (const vendor of active.filter((v) => personaOf(v))) {
    const { accepted, warned } = await readOwnLegal(vendor);
    if (accepted && !warned) standingAcceptance.push(vendor);
  }
  for (const vendor of deactivated.filter((v) => personaOf(v))) {
    await actAs(persona.administrator);
    await setActive(vendor, true);
    const { accepted, warned } = await readOwnLegal(vendor);
    await actAs(persona.administrator);
    await setActive(vendor, false);
    if (accepted && !warned) standingAcceptance.push(vendor);
  }

  // The given: a mix of active and deactivated vendors, each group holding a standing acceptance.
  const standingActive = standingAcceptance.filter((vendor) => active.includes(vendor));
  const standingDeactivated = standingAcceptance.filter((vendor) => deactivated.includes(vendor));
  expect(standingActive.length, "an active vendor holding a standing acceptance").toBeGreaterThan(0);
  expect(standingDeactivated.length, "a deactivated vendor holding a standing acceptance").toBeGreaterThan(0);

  const activeAddresses = active.flatMap((vendor) => (vendor.email ? [vendor.email] : []));
  expect(activeAddresses.length).toBeGreaterThan(0);
  const before = await Promise.all(activeAddresses.map(async (address) => (await mail.messagesTo(address)).length));

  // The when: on the terms and conditions page, the administrator chooses to notify vendors and confirms.
  await actAs(persona.administrator);
  await surface.notificationTermsBroadcast.open();
  expect(await surface.notificationTermsBroadcast.notifyVendorsControl()).toBeTruthy();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  expect(await surface.notificationTermsBroadcast.notifyVendorsConfirmation()).toBeTruthy();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  // Each active vendor receives a message naming the change.
  const unreached: string[] = [];
  for (const [i, address] of activeAddresses.entries()) {
    let count = before[i];
    const deadline = Date.now() + 15000;
    while (count <= before[i] && Date.now() < deadline) {
      count = (await mail.messagesTo(address)).length;
      if (count <= before[i]) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (count <= before[i]) {
      unreached.push(address);
      continue;
    }
    const message = await mail.latestTo(address);
    expect.soft(`${message?.Subject ?? ""} ${message?.Snippet ?? ""}`, `message to ${address} names the terms`).toMatch(/terms/i);
  }
  expect(unreached, "active vendors sent no message about the changed terms").toEqual([]);

  // Every vendor's acceptance is withdrawn — the deactivated ones find it so on returning.
  for (const vendor of standingDeactivated) {
    await actAs(persona.administrator);
    await setActive(vendor, true);
  }
  const stillAccepted: string[] = [];
  for (const vendor of standingAcceptance) {
    await actAs(personaOf(vendor)!);
    let warned = "";
    const deadline = Date.now() + 15000;
    while (!warned && Date.now() < deadline) {
      await surface.userProfileSelfLegal.open();
      warned = await surface.userProfileSelfLegal.termsUpdatedWarning();
      if (!warned) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!warned) stillAccepted.push(vendor.id);
  }
  expect(stillAccepted, "vendors whose acceptance was not withdrawn").toEqual([]);
});
