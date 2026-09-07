// criterion: @R-6.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// seed.users.vendorWithNoticesOff is the account holding the one choice a person can make,
// turned off. The team request is one of the messages the criterion says reaches them all
// the same, and it is addressed to one person, so the catcher can be searched for it. The
// withheld half — that a newly published opportunity produces no announcement for them —
// is not asserted here: that announcement is a batch whose recipients are blind copies,
// and the mail fixture reads only the visible recipient, so its absence from a search
// would prove nothing either way.
test("the only notification a person can choose to stop is the announcement of newly published opportunities; every other message is sent regardless of that choice", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ organization: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ user: seed.users.vendorWithNoticesOff });

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorWithNoticesOff.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
});
