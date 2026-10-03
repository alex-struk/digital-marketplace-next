// criterion: @R-3.18 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-03
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const STATEMENT =
  "The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.";

const organization = seed.organizations.qualified;

// A complete, valid profile, so that a refusal is about who sent it and never about a field.
const changedProfile = {
  legalName: "Northern Pines Renamed By Request Ltd.",
  streetAddress: "1 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Profile Contact",
  contactTitle: "",
  contactEmail: "profile.contact@example.test",
  contactPhone: "",
  website: "",
};

// An observation that is not on the page reads as absent.
async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return ((await read()) ?? "").trim();
  } catch {
    return "";
  }
}

function isYes(value: string): boolean {
  return !["", "false", "no", "0"].includes(value.trim().toLowerCase());
}

async function expectRefused(surface: Surface): Promise<void> {
  const request = surface.organizationRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the request should be refused").toBe(false);
  expect(await readOrEmpty(() => request.refusalStatus()), "a refused request carries a status").toBeTruthy();
  expect(await readOrEmpty(() => request.refusalReason())).toMatch(/permission/i);
}

async function expectUnchanged(surface: Surface): Promise<void> {
  const request = surface.organizationRequest;
  expect(await readOrEmpty(() => request.storedLegalName())).toBe(organization.legal_name);
  expect(isYes(await readOrEmpty(() => request.storedActive())), "the organization should still be active").toBe(true);
}

test(`${STATEMENT} — an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control`, async ({
  surface,
}) => {
  // Read the management page as the owner first, so the two controls are known to be
  // offered on it at all; the administrator's reading is told apart from that one rather
  // than merely being empty of words the page might never use.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  const asOwner = await surface.organizationEdit.organizationTab();

  expect(asOwner).toContain("Edit");
  expect(asOwner).toContain("Archive");

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationEdit.open({ orgId: organization.id });
  const asAdministrator = await surface.organizationEdit.organizationTab();

  expect(asAdministrator).toContain(organization.legal_name);
  expect(asAdministrator).not.toContain("Edit");
  expect(asAdministrator).not.toContain("Archive");
});

test(`${STATEMENT} — the Edit and Archive controls are offered to a service administrator`, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  const asServiceAdministrator = await surface.organizationEdit.organizationTab();

  expect(asServiceAdministrator).toContain("Edit");
  expect(asServiceAdministrator).toContain("Archive");
});

test(`${STATEMENT} — a profile change sent by an organization administrator who is not the owner is refused and the organization is unchanged`, async ({
  surface,
}) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationRequest.open({ orgId: organization.id });
  await surface.organizationRequest.changeProfileByRequest(changedProfile);

  await expectRefused(surface);
  await expectUnchanged(surface);
});

test(`${STATEMENT} — an archive request sent by an organization administrator who is not the owner is refused and the organization stays active`, async ({
  surface,
}) => {
  await surface.signIn(persona.organizationAdmin);
  await surface.organizationRequest.open({ orgId: organization.id });
  await surface.organizationRequest.archiveByRequest();

  await expectRefused(surface);
  await expectUnchanged(surface);
});

// The same requests from the owner and from a service administrator are accepted, which is
// what shows the refusals above are about who asked rather than about what was asked.
test(`${STATEMENT} — a profile change sent by the organization's owner is accepted`, async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationRequest.open({ orgId: organization.id });
  await surface.organizationRequest.changeProfileByRequest(changedProfile);

  const request = surface.organizationRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the change should be accepted").toBe(true);
  expect(await readOrEmpty(() => request.storedLegalName())).toBe(changedProfile.legalName);
});

test(`${STATEMENT} — an archive request sent by a service administrator is accepted`, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await surface.organizationRequest.open({ orgId: organization.id });
  await surface.organizationRequest.archiveByRequest();

  const request = surface.organizationRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the archive should be accepted").toBe(true);
  expect(isYes(await readOrEmpty(() => request.storedActive())), "the organization should be inactive").toBe(false);
});
