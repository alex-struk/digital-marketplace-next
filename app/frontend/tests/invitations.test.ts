import { beforeEach, describe, expect, it } from "vitest";
import { addressesIn, addressesToInvite, fieldProblem, forgetOutcome, keepOutcome, keptOutcome } from "../src/lib/invitations";

const ORG = "00000000-0000-4000-8000-000000000304";
const outcome = { refused: [], unregistered: ["nobody.yet@example.test"], invalidType: false };

beforeEach(() => window.sessionStorage.clear());

describe("the addresses the invite dialog's fields hold", () => {
  it("reads one address, or several separated by commas, semicolons or spaces", () => {
    expect(addressesIn("  one@example.test ")).toEqual(["one@example.test"]);
    expect(addressesIn("one@example.test, two@example.test;three@example.test\nfour@example.test")).toEqual([
      "one@example.test",
      "two@example.test",
      "three@example.test",
      "four@example.test",
    ]);
    expect(addressesIn(" , ")).toEqual([]);
  });

  it("invites each address once, in the order given, and leaves out empty fields", () => {
    expect(addressesToInvite(["one@example.test", "", "two@example.test, one@example.test"])).toEqual(["one@example.test", "two@example.test"]);
  });

  it("asks for an address only when none is given, and refuses a field holding one that is not valid", () => {
    expect(fieldProblem("", true)).toBe("Enter an email address");
    expect(fieldProblem("", false)).toBe("");
    expect(fieldProblem("one@example.test", true)).toBe("");
    expect(fieldProblem("one@example.test, not-an-email", false)).toBe("Enter an email address in a valid format, like name@example.com");
  });
});

describe("the last invitations' outcome, kept across a reload", () => {
  it("is given back for the same organization until forgotten", () => {
    keepOutcome(ORG, outcome, 1_000);
    expect(keptOutcome(ORG, 2_000)).toEqual(outcome);
    expect(keptOutcome("another", 2_000)).toBeNull();
    forgetOutcome(ORG);
    expect(keptOutcome(ORG, 2_000)).toBeNull();
  });

  it("is not given back once it belongs to an earlier visit, or when what is kept is not an outcome", () => {
    keepOutcome(ORG, outcome, 0);
    expect(keptOutcome(ORG, 11 * 60 * 1000)).toBeNull();
    window.sessionStorage.setItem(`invitation-outcome:${ORG}`, JSON.stringify({ at: 0, outcome: { unregistered: "x" } }));
    expect(keptOutcome(ORG, 1)).toBeNull();
    window.sessionStorage.setItem(`invitation-outcome:${ORG}`, "not json");
    expect(keptOutcome(ORG, 1)).toBeNull();
  });
});
