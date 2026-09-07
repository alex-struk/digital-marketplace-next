// criterion: @R-3.24 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

const base = {
  streetAddress: "7 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Archive Notice Contact",
  contactTitle: "",
  contactEmail: seed.users.organizationOwner.email,
  contactPhone: "",
  website: "",
};

const archivedByAdministrator = { ...base, legalName: "Gorse Hill Archived By Administrator Ltd." };
const archivedByOwner = { ...base, legalName: "Gorse Hill Archived By Its Owner Ltd." };

test("when an administrator archives an organization they do not own, its owner receives a message telling them it has been archived", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(archivedByAdministrator);

  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: archivedByAdministrator.legalName });
  await surface.organizationEdit.archiveOrganization();

  const messages = await mail.messagesTo(seed.users.organizationOwner.email);
  expect(messages.length).toBeGreaterThan(0);
  const text = messages.map((message) => `${message.Subject} ${message.Snippet}`).join(" ");
  expect(text).toMatch(/archiv/i);
});

test("no such message is sent when the owner archives their own organization", async ({ surface, mail }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(archivedByOwner);

  // The first test in this file proved the catcher is reachable and that an archiving
  // message does arrive when one is sent, so an empty result here is the application's
  // decision rather than a dead mail catcher.
  await mail.clear();

  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: archivedByOwner.legalName });
  await surface.organizationEdit.archiveOrganization();

  const messages = await mail.messagesTo(seed.users.organizationOwner.email);
  const text = messages.map((message) => `${message.Subject} ${message.Snippet}`).join(" ");
  expect(text).not.toMatch(/archiv/i);
});
