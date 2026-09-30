import { describe, expect, it } from "vitest";
import {
  accountKindForIdentity,
  accountKindsFor,
  asksForJobTitle,
  needsProfileCompletion,
  validateProfile,
} from "../src/rules/users";
import {
  landingAfterSignIn,
  openBeforeProfileCompletion,
  returnPathFrom,
  signInReturningTo,
  startSignInAddress,
} from "../src/rules/sign-in";

const vendor = { type: "VENDOR" as const, acceptedTermsAt: null, lastAcceptedTermsAt: null };
const agreedVendor = {
  type: "VENDOR" as const,
  acceptedTermsAt: "2026-01-05T17:00:00.000Z",
  lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
};
const staff = { type: "GOV" as const, acceptedTermsAt: null, lastAcceptedTermsAt: null };

describe("the kind of account a first sign-in makes (R-4.1)", () => {
  it("is a public sector employee for a government identity", () => {
    expect(accountKindForIdentity("idir")).toBe("GOV");
    expect(accountKindForIdentity("IDIR")).toBe("GOV");
  });

  it("is a vendor for a code-hosting or business identity", () => {
    expect(accountKindForIdentity("github")).toBe("VENDOR");
    expect(accountKindForIdentity("bceid")).toBe("VENDOR");
    expect(accountKindForIdentity("bceidbusiness")).toBe("VENDOR");
  });

  it("is nothing for an identity the service does not recognise", () => {
    expect(accountKindForIdentity("somewhere-else")).toBeNull();
    expect(accountKindForIdentity(null)).toBeNull();
    expect(accountKindForIdentity("")).toBeNull();
  });

  it("finds a promoted administrator by the same government identity", () => {
    expect(accountKindsFor("GOV")).toEqual(["GOV", "ADMIN"]);
    expect(accountKindsFor("VENDOR")).toEqual(["VENDOR"]);
  });
});

describe("a profile's details (R-4.27)", () => {
  it("needs a name and an email address in a valid format, and stores the address in lower case", () => {
    const result = validateProfile({ name: "  Tatum Placeholder ", email: "Tatum@Example.TEST" });

    expect(result).toEqual({
      ok: true,
      profile: { name: "Tatum Placeholder", email: "tatum@example.test" },
    });
  });

  it("reports an empty name and a malformed address, each against its own field", () => {
    const result = validateProfile({ name: "   ", email: "vendor1-at-example" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe("Enter your name");
    expect(result.errors.email).toMatch(/valid format/);
  });

  it("limits the name and the job title to one hundred characters", () => {
    expect(validateProfile({ name: "a".repeat(100), email: "a@b.cd" }).ok).toBe(true);
    const tooLong = validateProfile({
      name: "a".repeat(101),
      email: "a@b.cd",
      jobTitle: "b".repeat(101),
    });
    expect(tooLong.ok).toBe(false);
    if (tooLong.ok) return;
    expect(Object.keys(tooLong.errors).sort()).toEqual(["jobTitle", "name"]);
  });

  it("allows a blank job title", () => {
    expect(validateProfile({ name: "Casey", email: "c@example.test", jobTitle: "" })).toEqual({
      ok: true,
      profile: { name: "Casey", email: "c@example.test", jobTitle: "" },
    });
  });

  it("asks only a public sector employee for a job title (R-4.28)", () => {
    expect(asksForJobTitle("GOV")).toBe(true);
    expect(asksForJobTitle("ADMIN")).toBe(true);
    expect(asksForJobTitle("VENDOR")).toBe(false);
  });
});

describe("who is offered the profile-completion page (R-4.23)", () => {
  it("is a vendor who has never agreed to the terms", () => {
    expect(needsProfileCompletion(vendor)).toBe(true);
  });

  it("is not a vendor who agreed before, even if that acceptance was later withdrawn", () => {
    expect(needsProfileCompletion(agreedVendor)).toBe(false);
    expect(
      needsProfileCompletion({ ...agreedVendor, acceptedTermsAt: null }),
    ).toBe(false);
  });

  it("is never a public sector employee", () => {
    expect(needsProfileCompletion(staff)).toBe(false);
    expect(needsProfileCompletion({ ...staff, type: "ADMIN" })).toBe(false);
  });
});

describe("where sign-in lands (R-4.22)", () => {
  it("is the dashboard for a returning person", () => {
    expect(landingAfterSignIn(agreedVendor, null)).toBe("/dashboard");
    expect(landingAfterSignIn(staff, null)).toBe("/dashboard");
  });

  it("is the profile-completion page for a new vendor", () => {
    expect(landingAfterSignIn(vendor, null)).toBe("/sign-up/complete");
  });

  it("is the profile-completion page for any account just made, which moves a non-vendor on", () => {
    expect(landingAfterSignIn(staff, null, true)).toBe("/sign-up/complete");
    expect(landingAfterSignIn(staff, "/users/me", true)).toBe("/users/me");
  });

  it("is the page sign-in began from, when there was one", () => {
    expect(landingAfterSignIn(agreedVendor, "/users/me?tab=notifications")).toBe(
      "/users/me?tab=notifications",
    );
    expect(landingAfterSignIn(vendor, "/dashboard")).toBe("/dashboard");
  });

  it("never leads off the service", () => {
    for (const elsewhere of [
      "https://elsewhere.example/",
      "//elsewhere.example/",
      "/\\elsewhere.example",
      "javascript:alert(1)",
      "dashboard",
    ]) {
      expect(returnPathFrom(elsewhere), elsewhere).toBeNull();
      expect(landingAfterSignIn(agreedVendor, elsewhere)).toBe("/dashboard");
    }
  });

  it("never returns a person to the sign-in or sign-out screens", () => {
    expect(returnPathFrom("/sign-in")).toBeNull();
    expect(returnPathFrom("/auth/callback?code=x")).toBeNull();
    expect(returnPathFrom("/sign-out")).toBeNull();
  });

  it("is carried on the sign-in address a page sends a visitor to", () => {
    expect(signInReturningTo("/dashboard")).toBe("/sign-in?redirectOnSuccess=%2Fdashboard");
    expect(signInReturningTo("//elsewhere")).toBe("/sign-in");
  });

  it("is carried to the service, with the way in, when sign-in begins (decision record 0015)", () => {
    expect(startSignInAddress("vendor", "/content/about")).toBe(
      "/auth/sign-in?provider=vendor&redirectOnSuccess=%2Fcontent%2Fabout",
    );
    expect(startSignInAddress("public-sector", "https://elsewhere.example")).toBe(
      "/auth/sign-in?provider=public-sector",
    );
    expect(startSignInAddress(null, null)).toBe("/auth/sign-in");
  });
});

describe("what a vendor who has not completed their profile may still open", () => {
  it("is the completion page, signing out, the notices and the service's own pages", () => {
    expect(openBeforeProfileCompletion("/sign-up/complete")).toBe(true);
    expect(openBeforeProfileCompletion("/sign-out")).toBe(true);
    expect(openBeforeProfileCompletion("/auth/callback")).toBe(true);
    expect(openBeforeProfileCompletion("/content/terms-and-conditions")).toBe(true);
    expect(openBeforeProfileCompletion("/notice/authFailure")).toBe(true);
  });

  it("includes their own profile, by the address that stands for them or by their own identifier", () => {
    expect(openBeforeProfileCompletion("/users/me")).toBe(true);
    expect(openBeforeProfileCompletion("/users/me/")).toBe(true);
    expect(openBeforeProfileCompletion("/users/abc-123", "abc-123")).toBe(true);
  });

  it("is nothing else", () => {
    expect(openBeforeProfileCompletion("/dashboard")).toBe(false);
    expect(openBeforeProfileCompletion("/")).toBe(false);
    expect(openBeforeProfileCompletion("/opportunities")).toBe(false);
    expect(openBeforeProfileCompletion("/users/somebody-else", "abc-123")).toBe(false);
    expect(openBeforeProfileCompletion("/users/", "")).toBe(false);
  });
});
