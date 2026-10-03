import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Envelope } from "../src/mail/message";
import { Mailer } from "../src/mail/mailer";
import { Member, StoredOrganization } from "../src/organizations/organization";
import { OrganizationsService, Requester } from "../src/organizations/organizations.service";
import { CAPABILITIES } from "../src/rules/users";
import { OrganizationsInMemory, person } from "./organizations-in-memory";
import { refusalFor } from "../src/common/refusals";

/** A permission refusal of registering, changing or archiving, as the boundary answers it. */
const PERMISSION_REFUSAL = { reason: "permissions", messages: [expect.any(String)] };

it("answers a permission refusal at 401 under permissions, and a validation refusal under errors", async () => {
  const service = new OrganizationsService(
    new OrganizationsInMemory(),
    { usable: async () => true } as never,
    { send: () => undefined } as never,
    { serviceOrigin: "http://localhost", contactEmail: "help@example.test" },
  );
  const refused = await service.create(null, {}).catch((error: unknown) => error);
  expect(refusalFor(refused)).toEqual({ status: 401, body: { permissions: [expect.any(String)] } });
  const invalid = await service
    .create({ id: "v", type: "VENDOR", acceptedTermsAt: "2026-01-01T00:00:00.000Z" } as Requester, { legalName: "" })
    .catch((error: unknown) => error);
  expect(refusalFor(invalid)).toEqual({ status: 400, body: { errors: expect.any(Array) } });
});

const profile = {
  legalName: "Northwind Digital Co-operative",
  websiteUrl: "https://northwind.example.com",
  streetAddress1: "100 Example Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V0V 0V0",
  country: "Canada",
  contactName: "Owner Person",
  contactEmail: "owner@example.test",
  contactPhone: "250-555-0100",
};

const vendor = (id: string): Requester => ({ id, type: "VENDOR", acceptedTermsAt: "2026-01-01T00:00:00.000Z" });
const administrator: Requester = { id: "admin", type: "ADMIN", acceptedTermsAt: null };
const staff: Requester = { id: "staff", type: "GOV", acceptedTermsAt: null };

let store: OrganizationsInMemory;
let sent: Envelope[];
let readableLogos: Set<string>;
let service: OrganizationsService;

beforeEach(() => {
  store = new OrganizationsInMemory();
  sent = [];
  readableLogos = new Set(["5b2e0c3a-8d41-4f6e-a1c2-000000000811"]);
  const mailer = { send: vi.fn((envelope: Envelope) => sent.push(envelope)) } as unknown as Mailer;
  service = new OrganizationsService(
    store,
    { mayRead: async (id) => readableLogos.has(id) },
    mailer,
    { serviceOrigin: "http://localhost:4300", contactEmail: "help@example.test" },
  );
});

/** An organization with an owner, an organization administrator, a member and a pending invitee. */
async function team(name = profile.legalName): Promise<StoredOrganization> {
  const created = await service.create(vendor("owner"), { ...profile, legalName: name });
  const index = store.rows.findIndex((entry) => entry.id === created.id);
  const row = store.rows[index] as StoredOrganization;
  store.rows[index] = {
    ...row,
    members: [...row.members, person("orgAdmin", "ADMIN"), person("member", "MEMBER"), person("invited", "MEMBER", "PENDING")],
  };
  return store.rows[index] as StoredOrganization;
}

describe("registering (R-3.2, R-3.22, R-3.23)", () => {
  it("makes the registering vendor the active owner of an active organization of one", async () => {
    const created = await service.create(vendor("owner"), profile);
    expect(created).toMatchObject({
      legalName: profile.legalName,
      active: true,
      owner: { id: "owner", name: "Owner Person" },
      numTeamMembers: 1,
      viewerMembership: { membershipType: "OWNER", membershipStatus: "ACTIVE" },
      contactTitle: null,
      streetAddress2: null,
    });
    expect((await service.ownMemberships({ id: "owner", type: "VENDOR" })).map((m) => [m.organization.id, m.membershipType])).toEqual([
      [created.id, "OWNER"],
    ]);
  });

  it("refuses public sector staff, an administrator, a visitor and a vendor who has not accepted the terms", async () => {
    for (const requester of [staff, administrator, null, { ...vendor("v"), acceptedTermsAt: null }]) {
      await expect(service.create(requester, profile)).rejects.toMatchObject(PERMISSION_REFUSAL);
    }
    expect(store.rows).toHaveLength(0);
  });

  it("refuses an invalid profile, naming each field, and creates nothing", async () => {
    const refusal = service.create(vendor("owner"), { ...profile, legalName: "", contactEmail: "not-an-email" });
    await expect(refusal).rejects.toBeInstanceOf(BadRequestException);
    await refusal.catch((error: BadRequestException) => {
      expect((error.getResponse() as { message: string[] }).message).toEqual([
        "Legal name: Enter the organization’s legal name",
        "Contact email address: Enter an email address in a valid format, like name@example.com",
      ]);
    });
    expect(store.rows).toHaveLength(0);
  });

  it("takes a logo only when it is a stored picture the vendor may read (R-8.28)", async () => {
    const withLogo = await service.create(vendor("owner"), { ...profile, logoImageFile: "5B2E0C3A-8D41-4F6E-A1C2-000000000811" });
    expect(withLogo.logoImageFile).toBe("5b2e0c3a-8d41-4f6e-a1c2-000000000811");
    await expect(
      service.create(vendor("owner"), { ...profile, logoImageFile: "00000000-0000-4000-8000-000000000999" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("reading in full (R-3.3)", () => {
  it("answers the owner, an organization administrator and a service administrator, and refuses the rest", async () => {
    const organization = await team();
    for (const reader of [vendor("owner"), vendor("orgAdmin"), administrator]) {
      expect((await service.read(reader, organization.id)).id).toBe(organization.id);
    }
    for (const reader of [vendor("member"), vendor("invited"), vendor("stranger"), staff, null]) {
      await expect(service.read(reader, organization.id)).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });

  it("counts active members only, and tells an administrator when there is no such organization", async () => {
    const organization = await team();
    expect((await service.read(administrator, organization.id)).numTeamMembers).toBe(3);
    await expect(service.read(administrator, "00000000-0000-4000-8000-000000000399")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.read(vendor("owner"), "00000000-0000-4000-8000-000000000399")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe("changing the profile (R-3.18, R-3.19)", () => {
  it("saves the contact phone number with every other field, and clearing it removes it", async () => {
    const organization = await team();
    const changed = await service.change(vendor("owner"), organization.id, "updateProfile", {
      ...profile,
      legalName: "Northwind Renamed",
      contactPhone: "250-555-0199",
    });
    expect(changed).toMatchObject({ legalName: "Northwind Renamed", contactPhone: "250-555-0199" });
    const cleared = await service.change(administrator, organization.id, "updateProfile", { ...profile, contactPhone: "" });
    expect(cleared.contactPhone).toBeNull();
    expect((await store.find(organization.id))?.contactPhone).toBeNull();
  });

  it("refuses an organization administrator who is not the owner, and anyone else", async () => {
    const organization = await team();
    for (const requester of [vendor("orgAdmin"), vendor("member"), staff, null]) {
      await expect(
        service.change(requester, organization.id, "updateProfile", { ...profile, legalName: "Taken over" }),
      ).rejects.toMatchObject(PERMISSION_REFUSAL);
    }
    expect((await store.find(organization.id))?.legalName).toBe(profile.legalName);
  });

  it("keeps a logo the change does not name, and takes it away for null", async () => {
    const created = await service.create(vendor("owner"), { ...profile, logoImageFile: "5b2e0c3a-8d41-4f6e-a1c2-000000000811" });
    const kept = await service.change(vendor("owner"), created.id, "updateProfile", profile);
    expect(kept.logoImageFile).toBe("5b2e0c3a-8d41-4f6e-a1c2-000000000811");
    const removed = await service.change(vendor("owner"), created.id, "updateProfile", { ...profile, logoImageFile: null });
    expect(removed.logoImageFile).toBeNull();
  });

  it("refuses an invalid profile, and a change it does not offer", async () => {
    const organization = await team();
    await expect(service.change(vendor("owner"), organization.id, "updateProfile", { ...profile, city: "" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.change(vendor("owner"), organization.id, "somethingElse", {})).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("archiving (R-3.6, R-3.24)", () => {
  it("by the owner: kept, marked with the date and who did it, gone from the list and from its members' lists, and nobody emailed", async () => {
    const organization = await team();
    const archived = await service.archive(vendor("owner"), organization.id);
    expect(archived).toMatchObject({ active: false, deactivatedBy: "owner" });
    expect(archived.deactivatedOn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect((await service.list(null)).map((entry) => entry.id)).not.toContain(organization.id);
    expect(await service.ownMemberships({ id: "member", type: "VENDOR" })).toEqual([]);
    expect(await service.actingFor({ id: "owner", type: "VENDOR" })).toEqual([]);
    expect(sent).toEqual([]);
  });

  it("by an administrator: the owner is told by email", async () => {
    const organization = await team();
    await service.archive(administrator, organization.id);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["owner@example.test"]);
    expect(sent[0]?.message.subject).toContain("has been archived");
    expect(JSON.stringify(sent[0]?.message.body)).toContain("An administrator has archived your organization");
  });

  it("is refused to an organization administrator, a member, and a second time", async () => {
    const organization = await team();
    for (const requester of [vendor("orgAdmin"), vendor("member"), staff, null]) {
      await expect(service.archive(requester, organization.id)).rejects.toMatchObject(PERMISSION_REFUSAL);
    }
    await service.archive(vendor("owner"), organization.id);
    await expect(service.archive(administrator, organization.id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.change(vendor("owner"), organization.id, "updateProfile", profile),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("the list's columns (R-3.1, R-3.21)", () => {
  it("tells the owner, team size and qualification only to an administrator and the organization's owners and administrators", async () => {
    const organization = await team("Zed Organization");
    await service.create(vendor("stranger"), { ...profile, legalName: "Aardvark Ltd." });
    const detail = { owner: { id: "owner", name: "Owner Person" }, numTeamMembers: 3, swuQualified: false, twuQualified: false };
    for (const viewer of [administrator, vendor("owner"), vendor("orgAdmin")]) {
      expect((await service.list(viewer)).find((entry) => entry.id === organization.id)).toMatchObject(detail);
    }
    for (const viewer of [vendor("member"), vendor("stranger"), staff, null]) {
      const row = (await service.list(viewer)).find((entry) => entry.id === organization.id);
      expect(row).toEqual({ id: organization.id, legalName: "Zed Organization", logoImageFile: null, active: true, serviceAreas: [] });
    }
    expect((await service.list(null)).map((entry) => entry.legalName)).toEqual(["Aardvark Ltd.", "Zed Organization"]);
  });
});

describe("the organizations one may act for (R-3.15, R-3.20)", () => {
  it("are the ones a vendor owns or administers, and not one they are an ordinary member of or an archived one", async () => {
    const owned = await team("Owned");
    const administered = await service.create(vendor("someone"), { ...profile, legalName: "Administered" });
    const memberOf = await service.create(vendor("someone"), { ...profile, legalName: "Member of" });
    const archived = await service.create(vendor("orgAdmin"), { ...profile, legalName: "Archived" });
    for (const [id, membership] of [
      [administered.id, person("orgAdmin", "ADMIN")],
      [memberOf.id, person("orgAdmin", "MEMBER")],
    ] as const) {
      const index = store.rows.findIndex((row) => row.id === id);
      const row = store.rows[index] as StoredOrganization;
      store.rows[index] = { ...row, members: [...row.members, membership] };
    }
    await service.archive(vendor("orgAdmin"), archived.id);
    const offered = await service.actingFor({ id: "orgAdmin", type: "VENDOR" });
    expect(offered.map((entry) => entry.legalName)).toEqual(["Administered", "Owned"]);
    expect(offered.map((entry) => entry.id)).toEqual([administered.id, owned.id]);
  });

  it("are refused, not answered empty, to anyone but a signed-in vendor", async () => {
    for (const viewer of [staff, administrator, null]) {
      await expect(service.actingFor(viewer)).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });
});
