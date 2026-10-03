// criterion: @R-3.2 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-03
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const STATEMENT =
  "Only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization; a request from anyone else is refused.";

// A complete, valid registration, so that a refusal is about who sent it and never about a
// missing or malformed field.
function registration(legalName: string) {
  return {
    legalName,
    streetAddress: "1 Marine Way",
    addressLineTwo: "",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V1V1",
    country: "Canada",
    contactName: "Registration Contact",
    contactTitle: "",
    contactEmail: "registration.contact@example.test",
    contactPhone: "",
    website: "",
  };
}

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

// The request page addresses the organization collection for a registration and ignores the
// organization it is opened on; a seeded organization is given only because open() asks for one.
async function registerByRequest(surface: Surface, legalName: string): Promise<void> {
  await surface.organizationRequest.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationRequest.registerByRequest(registration(legalName));
}

async function expectRefusedAsNotPermitted(surface: Surface): Promise<void> {
  const request = surface.organizationRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the registration should be refused").toBe(false);
  expect(await readOrEmpty(() => request.refusalStatus()), "a refused registration carries a status").toBeTruthy();
  expect(await readOrEmpty(() => request.refusalReason())).toMatch(/permission/i);
  expect(await readOrEmpty(() => request.organizationIdentifier()), "no organization should be created").toBe("");
}

test(`${STATEMENT} — a vendor who has accepted the terms registers an organization through the create screen`, async ({
  surface,
}) => {
  const byVendor = registration("Aspen Ridge Registered By Vendor Ltd.");
  await surface.signIn(persona.vendor);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(byVendor);

  await surface.organizationUserMemberships.open({ userId: seed.users.vendorOne.id });
  expect(await surface.organizationUserMemberships.ownedOrganizationsTable()).toContain(byVendor.legalName);
});

test(`${STATEMENT} — a registration sent by a vendor who has accepted the terms is accepted`, async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await registerByRequest(surface, "Birch Hollow Registered By Request Ltd.");

  const request = surface.organizationRequest;
  expect(isYes(await readOrEmpty(() => request.requestAccepted())), "the registration should be accepted").toBe(true);
  expect(await readOrEmpty(() => request.organizationIdentifier())).toBeTruthy();
});

test(`${STATEMENT} — a registration sent by a signed-in member of public sector staff is refused`, async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await registerByRequest(surface, "Cedar Flats Registered By Staff Ltd.");
  await expectRefusedAsNotPermitted(surface);
});

test(`${STATEMENT} — a registration sent by a signed-in vendor who has never accepted the terms is refused`, async ({
  surface,
}) => {
  await surface.signIn(persona.vendorCompletingProfile);
  await registerByRequest(surface, "Dogwood Bay Registered Without Terms Ltd.");
  await expectRefusedAsNotPermitted(surface);
});

test(`${STATEMENT} — a registration sent by a visitor who is not signed in is refused`, async ({ surface }) => {
  // persona.anonymousVisitor has no sign-in: the request goes with no session at all.
  expect(persona.anonymousVisitor.signIn).toBeNull();
  await registerByRequest(surface, "Elm Crossing Registered Signed Out Ltd.");
  await expectRefusedAsNotPermitted(surface);
});
