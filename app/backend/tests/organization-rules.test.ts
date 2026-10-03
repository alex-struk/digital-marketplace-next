import { describe, expect, it } from "vitest";
import {
  ORGANIZATIONS_PER_PAGE,
  compareByLegalName,
  isPhoneNumber,
  isWebsiteAddress,
  listOffersDetailColumns,
  mayActFor,
  mayAskWhomToActFor,
  mayChangeOrganization,
  mayReadOrganization,
  mayRegisterOrganization,
  pageOf,
  profileErrorLines,
  qualifiesForSprintWithUs,
  qualifiesForTeamWithUs,
  validateOrganizationProfile,
} from "../src/rules/organizations";
import { CAPABILITIES } from "../src/rules/users";

const complete = {
  legalName: "Northwind Digital Co-operative",
  streetAddress1: "100 Example Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V0V 0V0",
  country: "Canada",
  contactName: "Test Vendor One",
  contactEmail: "vendor1@example.com",
};

const owner = { membershipType: "OWNER", membershipStatus: "ACTIVE" } as const;
const orgAdmin = { membershipType: "ADMIN", membershipStatus: "ACTIVE" } as const;
const member = { membershipType: "MEMBER", membershipStatus: "ACTIVE" } as const;
const pendingAdmin = { membershipType: "ADMIN", membershipStatus: "PENDING" } as const;
const vendor = { id: "v", type: "VENDOR" } as const;
const admin = { id: "a", type: "ADMIN" } as const;
const staff = { id: "s", type: "GOV" } as const;

describe("registering an organization (R-3.2)", () => {
  it("is a vendor's who has accepted the terms, and nobody else's", () => {
    expect(mayRegisterOrganization({ type: "VENDOR", acceptedTermsAt: "2026-01-01T00:00:00Z" })).toBe(true);
    expect(mayRegisterOrganization({ type: "VENDOR", acceptedTermsAt: null })).toBe(false);
    expect(mayRegisterOrganization({ type: "GOV", acceptedTermsAt: "2026-01-01T00:00:00Z" })).toBe(false);
    expect(mayRegisterOrganization({ type: "ADMIN", acceptedTermsAt: null })).toBe(false);
    expect(mayRegisterOrganization(null)).toBe(false);
  });
});

describe("the profile's fields (R-3.22)", () => {
  it("accepts the required fields alone, storing every optional one left empty as nothing", () => {
    const result = validateOrganizationProfile({ ...complete, websiteUrl: "", streetAddress2: " ", contactTitle: "", contactPhone: "" });
    expect(result).toEqual({
      ok: true,
      profile: { ...complete, websiteUrl: null, streetAddress2: null, contactTitle: null, contactPhone: null },
    });
  });

  it("reports a blank legal name and a malformed contact email against their fields", () => {
    const result = validateOrganizationProfile({ ...complete, legalName: "", contactEmail: "not-an-email" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["contactEmail", "legalName"]);
    expect(profileErrorLines(result.errors)).toEqual([
      "Legal name: Enter the organization’s legal name",
      "Contact email address: Enter an email address in a valid format, like name@example.com",
    ]);
  });

  it("holds each required field and the second address line and title to a hundred characters", () => {
    for (const field of ["legalName", "streetAddress1", "city", "region", "mailCode", "country", "contactName", "streetAddress2", "contactTitle"]) {
      expect(validateOrganizationProfile({ ...complete, [field]: "x".repeat(100) }).ok).toBe(true);
      const refused = validateOrganizationProfile({ ...complete, [field]: "x".repeat(101) });
      expect(refused.ok ? [] : Object.keys(refused.errors)).toEqual([field]);
    }
  });

  it("takes a contact email of any length", () => {
    expect(validateOrganizationProfile({ ...complete, contactEmail: `${"a".repeat(200)}@example.com` }).ok).toBe(true);
  });

  it("checks a website, address line, title and phone only when they are given", () => {
    const refused = validateOrganizationProfile({ ...complete, websiteUrl: "northwind", contactPhone: "call me" });
    expect(refused.ok ? [] : Object.keys(refused.errors).sort()).toEqual(["contactPhone", "websiteUrl"]);
  });

  it("knows a full web address and a phone number", () => {
    expect(isWebsiteAddress("https://northwind.example.com")).toBe(true);
    expect(isWebsiteAddress("http://example.test/about")).toBe(true);
    expect(isWebsiteAddress("northwind")).toBe(false);
    expect(isWebsiteAddress("ftp://example.com")).toBe(false);
    expect(isWebsiteAddress("https://exa mple.com")).toBe(false);
    for (const valid of ["250-555-0100", "(250) 555-0100", "+1 250 555 0100", "2505550100", "250.555.0100 ext. 12"]) {
      expect(isPhoneNumber(valid)).toBe(true);
    }
    for (const invalid of ["call me", "555", "250-555-01OO", "1234567890123456"]) {
      expect(isPhoneNumber(invalid)).toBe(false);
    }
  });
});

describe("who may read, change and archive an organization (R-3.3, R-3.6, R-3.18)", () => {
  it("lets an administrator, the owner and an organization administrator read it, and nobody else", () => {
    expect(mayReadOrganization(admin, null)).toBe(true);
    expect(mayReadOrganization(vendor, owner)).toBe(true);
    expect(mayReadOrganization(vendor, orgAdmin)).toBe(true);
    expect(mayReadOrganization(vendor, member)).toBe(false);
    expect(mayReadOrganization(vendor, pendingAdmin)).toBe(false);
    expect(mayReadOrganization(staff, null)).toBe(false);
    expect(mayReadOrganization(null, null)).toBe(false);
  });

  it("lets only the owner and an administrator change or archive it", () => {
    expect(mayChangeOrganization(admin, null)).toBe(true);
    expect(mayChangeOrganization(vendor, owner)).toBe(true);
    expect(mayChangeOrganization(vendor, orgAdmin)).toBe(false);
    expect(mayChangeOrganization(vendor, member)).toBe(false);
    expect(mayChangeOrganization(staff, null)).toBe(false);
  });
});

describe("the organizations one may act for (R-3.15, R-3.20)", () => {
  it("is asked by a vendor alone", () => {
    expect(mayAskWhomToActFor(vendor)).toBe(true);
    expect(mayAskWhomToActFor(admin)).toBe(false);
    expect(mayAskWhomToActFor(staff)).toBe(false);
    expect(mayAskWhomToActFor(null)).toBe(false);
  });

  it("holds the active organizations they own or administer", () => {
    expect(mayActFor({ active: true }, owner)).toBe(true);
    expect(mayActFor({ active: true }, orgAdmin)).toBe(true);
    expect(mayActFor({ active: true }, member)).toBe(false);
    expect(mayActFor({ active: false }, owner)).toBe(false);
    expect(mayActFor({ active: true }, pendingAdmin)).toBe(false);
  });
});

describe("the list (R-3.1, R-3.21)", () => {
  it("offers the detail columns to vendors and administrators only", () => {
    expect(listOffersDetailColumns(vendor)).toBe(true);
    expect(listOffersDetailColumns(admin)).toBe(true);
    expect(listOffersDetailColumns(staff)).toBe(false);
    expect(listOffersDetailColumns(null)).toBe(false);
  });

  it("is ordered by legal name", () => {
    const names = [
      { id: "1", legalName: "tidewater" },
      { id: "2", legalName: "Aurora" },
      { id: "3", legalName: "Northwind" },
    ].sort(compareByLegalName);
    expect(names.map((entry) => entry.legalName)).toEqual(["Aurora", "Northwind", "tidewater"]);
  });

  it("is fifty to a page, and a page past the last is the first", () => {
    const items = Array.from({ length: 120 }, (_, index) => index);
    expect(ORGANIZATIONS_PER_PAGE).toBe(50);
    expect(pageOf(items, "2")).toMatchObject({ page: 2, pageCount: 3, items: items.slice(50, 100) });
    expect(pageOf(items, 3).items).toHaveLength(20);
    expect(pageOf(items, "4")).toMatchObject({ page: 1, items: items.slice(0, 50) });
    expect(pageOf(items, "x").page).toBe(1);
    expect(pageOf([], undefined)).toEqual({ page: 1, pageCount: 1, items: [] });
  });
});

describe("qualification (R-3.25, R-3.26), as the list's marks show it", () => {
  const all = CAPABILITIES.map((capability) => capability.name);
  it("asks two members holding every capability between them, and the terms, for Sprint With Us", () => {
    expect(qualifiesForSprintWithUs([all.slice(0, 5), all.slice(5)], "2026-01-01")).toBe(true);
    expect(qualifiesForSprintWithUs([all.slice(0, 5), all.slice(5)], null)).toBe(false);
    expect(qualifiesForSprintWithUs([all], "2026-01-01")).toBe(false);
    expect(qualifiesForSprintWithUs([all.slice(0, 5), all.slice(5, 8)], "2026-01-01")).toBe(false);
  });

  it("asks a service area and the terms for Team With Us", () => {
    expect(qualifiesForTeamWithUs(1, "2026-01-01")).toBe(true);
    expect(qualifiesForTeamWithUs(0, "2026-01-01")).toBe(false);
    expect(qualifiesForTeamWithUs(2, null)).toBe(false);
  });
});
