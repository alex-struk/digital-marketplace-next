import { describe, expect, it } from "vitest";
import {
  Contact,
  accountKindsExported,
  compareListedAccounts,
  contactListCsv,
  contactListFileName,
  kindWithAdministratorRights,
  mayListAccounts,
  nameMatchesSearch,
  offersReactivation,
  reactivationRefusal,
  readContactListRequest,
  splitName,
} from "../src/rules/users";

describe("who may read the list of users (R-4.21)", () => {
  it("is an administrator alone", () => {
    expect(mayListAccounts({ id: "a", type: "ADMIN" })).toBe(true);
    expect(mayListAccounts({ id: "g", type: "GOV" })).toBe(false);
    expect(mayListAccounts({ id: "v", type: "VENDOR" })).toBe(false);
    expect(mayListAccounts(null)).toBe(false);
  });
});

describe("the order of the list of users (R-4.14)", () => {
  it("puts active accounts first, then orders by account kind and name", () => {
    const people = [
      { type: "VENDOR" as const, status: "INACTIVE_ADMIN" as const, name: "Ada Deactivated" },
      { type: "VENDOR" as const, status: "ACTIVE" as const, name: "zed Vendor" },
      { type: "GOV" as const, status: "ACTIVE" as const, name: "Sam Staff" },
      { type: "VENDOR" as const, status: "ACTIVE" as const, name: "Amy Vendor" },
      { type: "ADMIN" as const, status: "ACTIVE" as const, name: "Robin Admin" },
    ];
    expect([...people].sort(compareListedAccounts).map((person) => person.name)).toEqual([
      "Robin Admin",
      "Sam Staff",
      "Amy Vendor",
      "zed Vendor",
      "Ada Deactivated",
    ]);
  });
});

describe("searching the list by name (R-4.14)", () => {
  it("matches every word typed, in any order and any case, within the name alone", () => {
    expect(nameMatchesSearch("Blake Placeholder", "blake")).toBe(true);
    expect(nameMatchesSearch("Blake Placeholder", "holder bla")).toBe(true);
    expect(nameMatchesSearch("Blake Placeholder", "Blake Smith")).toBe(false);
    expect(nameMatchesSearch("Blake Placeholder", "   ")).toBe(true);
  });
});

describe("administrator rights (R-4.12)", () => {
  it("are granted to and withdrawn from a public sector employee, and never given to a vendor", () => {
    expect(kindWithAdministratorRights("GOV", true)).toEqual({ ok: true, kind: "ADMIN" });
    expect(kindWithAdministratorRights("ADMIN", false)).toEqual({ ok: true, kind: "GOV" });
    expect(kindWithAdministratorRights("VENDOR", true)).toEqual({
      ok: false,
      reason: "Vendors cannot be granted administrator permissions.",
    });
  });
});

describe("reactivation by an administrator (R-4.19)", () => {
  it("is offered for, and allowed on, only an account an administrator deactivated", () => {
    expect(offersReactivation("INACTIVE_ADMIN")).toBe(true);
    expect(offersReactivation("INACTIVE_USER")).toBe(false);
    expect(offersReactivation("ACTIVE")).toBe(false);
    expect(reactivationRefusal("INACTIVE_USER")).toMatch(/signing in again/);
  });
});

describe("what a contact-list export asks for (R-4.32)", () => {
  it("reads the two lists, whatever their case or order", () => {
    expect(readContactListRequest("vendor,GOV", "email,FirstName")).toEqual({
      ok: true,
      request: { kinds: ["GOV", "VENDOR"], fields: ["firstName", "email"] },
    });
  });

  it("refuses a request choosing no kind or no field, or naming one it does not know", () => {
    expect(readContactListRequest("", "email").ok).toBe(false);
    expect(readContactListRequest("VENDOR", "").ok).toBe(false);
    expect(readContactListRequest("ROBOT", "email").ok).toBe(false);
    expect(readContactListRequest("VENDOR", "shoeSize").ok).toBe(false);
  });

  it("exports administrators with public sector employees", () => {
    expect(accountKindsExported(["GOV"])).toEqual(["GOV", "ADMIN"]);
    expect(accountKindsExported(["VENDOR"])).toEqual(["VENDOR"]);
  });
});

describe("the exported file (R-4.32)", () => {
  const contacts: Contact[] = [
    { type: "ADMIN", name: "Robin Placeholder", email: "admin.one@example.test", organizationNames: [] },
    {
      type: "VENDOR",
      name: "Blake Q. Placeholder",
      email: "org.owner@example.test",
      organizationNames: ["Northern Pines, Ltd.", "Second Org"],
    },
    { type: "VENDOR", name: "Cher", email: null, organizationNames: [] },
  ];

  it("splits a name at its first space", () => {
    expect(splitName("Cher")).toEqual({ firstName: "Cher", lastName: "" });
    expect(splitName("Blake Q. Placeholder")).toEqual({ firstName: "Blake", lastName: "Q. Placeholder" });
  });

  it("labels each person's kind when both kinds were chosen, an administrator as one, and joins organizations", () => {
    const csv = contactListCsv(
      { kinds: ["GOV", "VENDOR"], fields: ["firstName", "lastName", "email", "organizationName"] },
      contacts,
    );
    expect(csv.split("\r\n")).toEqual([
      "Account Type,First Name,Last Name,Email,Organization Name",
      "Administrator,Robin,Placeholder,admin.one@example.test,",
      'Vendor,Blake,Q. Placeholder,org.owner@example.test,"Northern Pines, Ltd.; Second Org"',
      "Vendor,Cher,,,",
      "",
    ]);
  });

  it("leaves out the kind column when only one kind was chosen", () => {
    const csv = contactListCsv({ kinds: ["VENDOR"], fields: ["email"] }, contacts.slice(1, 2));
    expect(csv).toBe("Email\r\norg.owner@example.test\r\n");
  });

  it("is named for the day it was made", () => {
    expect(contactListFileName(new Date("2026-09-30T12:00:00Z"))).toBe("dm-contacts-2026-09-30.csv");
  });
});
