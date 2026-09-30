import { describe, expect, it } from "vitest";
import {
  accountKindForIdentity,
  accountKindsForIdentity,
  needsProfileCompletion,
  safeReturnAddress,
  validateProfile,
} from "../src/rules/users";

describe("the kind of account an identity makes (R-4.1)", () => {
  it("makes a public sector employee of a government identity", () => {
    expect(accountKindForIdentity("idir")).toBe("GOV");
    expect(accountKindForIdentity("IDIR")).toBe("GOV");
  });

  it("makes a vendor of a code-hosting identity", () => {
    expect(accountKindForIdentity("github")).toBe("VENDOR");
  });

  it("makes nothing of an identity it does not recognise", () => {
    expect(accountKindForIdentity("bceid")).toBeNull();
    expect(accountKindForIdentity("")).toBeNull();
    expect(accountKindForIdentity(null)).toBeNull();
  });

  it("finds an administrator by a government identity, and never a vendor", () => {
    expect(accountKindsForIdentity("GOV")).toEqual(["GOV", "ADMIN"]);
    expect(accountKindsForIdentity("VENDOR")).toEqual(["VENDOR"]);
  });
});

describe("who still has to finish signing up (R-4.3, R-4.23)", () => {
  it("is a vendor who has never agreed to the terms", () => {
    expect(needsProfileCompletion({ type: "VENDOR", lastAcceptedTermsAt: null })).toBe(true);
  });

  it("is not a vendor who agreed once, even if that agreement has since been withdrawn", () => {
    expect(
      needsProfileCompletion({ type: "VENDOR", lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z" }),
    ).toBe(false);
  });

  it("is never anybody but a vendor", () => {
    expect(needsProfileCompletion({ type: "GOV", lastAcceptedTermsAt: null })).toBe(false);
    expect(needsProfileCompletion({ type: "ADMIN", lastAcceptedTermsAt: null })).toBe(false);
  });
});

describe("a profile's details (R-4.27)", () => {
  it("accepts a name and an address, storing the address in lower case", () => {
    expect(
      validateProfile({ name: "  Tatum Placeholder ", email: "Vendor.Completing@Example.TEST" }),
    ).toEqual({
      valid: true,
      profile: {
        name: "Tatum Placeholder",
        email: "vendor.completing@example.test",
        jobTitle: "",
      },
    });
  });

  it("refuses an empty name and an address in no valid format, naming each", () => {
    const result = validateProfile({ name: "   ", email: "vendor1-at-example" });

    expect(result).toEqual({
      valid: false,
      problems: {
        name: "Enter your name",
        email: "Enter an email address in a valid format, like name@example.com",
      },
    });
  });

  it("allows a name and a job title of one hundred characters and no more", () => {
    const hundred = "a".repeat(100);
    expect(validateProfile({ name: hundred, email: "a@b.co", jobTitle: hundred }).valid).toBe(true);

    const result = validateProfile({ name: hundred + "a", email: "a@b.co", jobTitle: hundred + "a" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.problems).sort()).toEqual(["jobTitle", "name"]);
    }
  });

  it("refuses an empty address", () => {
    const result = validateProfile({ name: "Someone", email: "" });
    expect(result.valid).toBe(false);
  });
});

describe("where sign-in may return a person to (R-4.22)", () => {
  it("is an address inside the service", () => {
    expect(safeReturnAddress("/users/me?tab=legal")).toBe("/users/me?tab=legal");
    expect(safeReturnAddress("/dashboard")).toBe("/dashboard");
  });

  it("is never another site", () => {
    expect(safeReturnAddress("https://elsewhere.example")).toBeNull();
    expect(safeReturnAddress("//elsewhere.example/path")).toBeNull();
    expect(safeReturnAddress("/\\elsewhere.example")).toBeNull();
    expect(safeReturnAddress("javascript:alert(1)")).toBeNull();
  });

  it("is never the sign-in machinery itself", () => {
    expect(safeReturnAddress("/sign-in")).toBeNull();
    expect(safeReturnAddress("/auth/callback?code=x")).toBeNull();
    expect(safeReturnAddress("/sign-out")).toBeNull();
  });

  it("is nothing when nothing was given", () => {
    expect(safeReturnAddress(undefined)).toBeNull();
    expect(safeReturnAddress("")).toBeNull();
  });
});
