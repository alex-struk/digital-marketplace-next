import { beforeEach, describe, expect, it, vi } from "vitest";
import { Identity } from "../src/auth/identity";
import { Envelope } from "../src/mail/message";
import { Mailer } from "../src/mail/mailer";
import { AccountKind, Contact } from "../src/rules/users";
import {
  Account,
  AccountChange,
  AccountStore,
  DuplicateAccount,
  NewAccount,
} from "../src/users/account";
import { AccountsService, SignInRefused } from "../src/users/accounts.service";

/** Accounts kept in memory, with the kept schema's uniqueness rules (R-4.6). */
class AccountsInMemory implements AccountStore {
  readonly rows: Account[] = [];
  private next = 1;

  async findBySignIn(username: string, kinds: readonly AccountKind[]) {
    return this.rows.find((row) => row.idpUsername === username && kinds.includes(row.type)) ?? null;
  }

  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async list() {
    return [...this.rows];
  }

  async activeContacts(kinds: readonly AccountKind[]): Promise<Contact[]> {
    return this.rows
      .filter((row) => row.status === "ACTIVE" && kinds.includes(row.type))
      .map((row) => ({ type: row.type, name: row.name, email: row.email, organizationNames: [] }));
  }

  private collides(candidate: Pick<Account, "id" | "type" | "email" | "idpUsername">) {
    return this.rows.some(
      (row) =>
        row.id !== candidate.id &&
        row.type === candidate.type &&
        (row.idpUsername === candidate.idpUsername ||
          (candidate.email !== null && row.email === candidate.email)),
    );
  }

  async create(account: NewAccount): Promise<Account> {
    const row: Account = {
      id: `account-${this.next++}`,
      createdAt: "2026-09-30T00:00:00.000Z",
      updatedAt: "2026-09-30T00:00:00.000Z",
      type: account.type,
      status: "ACTIVE",
      name: account.name,
      email: account.email,
      jobTitle: null,
      avatarImageFile: null,
      notificationsOn: null,
      acceptedTermsAt: null,
      lastAcceptedTermsAt: null,
      idpUsername: account.idpUsername,
      deactivatedOn: null,
      deactivatedBy: null,
      capabilities: [],
    };
    if (this.collides(row)) throw new DuplicateAccount();
    this.rows.push(row);
    return row;
  }

  async update(id: string, change: AccountChange): Promise<Account> {
    const index = this.rows.findIndex((row) => row.id === id);
    const current = this.rows[index] as Account;
    const iso = (value: Date | null | undefined, fallback: string | null) =>
      value === undefined ? fallback : value === null ? null : value.toISOString();
    const next: Account = {
      ...current,
      name: change.name ?? current.name,
      email: change.email ?? current.email,
      jobTitle: change.jobTitle ?? current.jobTitle,
      avatarImageFile:
        change.avatarImageFile === undefined ? current.avatarImageFile : change.avatarImageFile,
      capabilities: change.capabilities ?? current.capabilities,
      notificationsOn: iso(change.notificationsOn, current.notificationsOn),
      acceptedTermsAt: iso(change.acceptedTermsAt, current.acceptedTermsAt),
      lastAcceptedTermsAt: iso(change.lastAcceptedTermsAt, current.lastAcceptedTermsAt),
      status: change.status ?? current.status,
      type: change.type ?? current.type,
      deactivatedOn: iso(change.deactivatedOn, current.deactivatedOn),
      deactivatedBy:
        change.deactivatedBy === undefined ? current.deactivatedBy : change.deactivatedBy,
    };
    if (this.collides(next)) throw new DuplicateAccount();
    this.rows[index] = next;
    return next;
  }
}

const identity = (overrides: Partial<Identity> = {}): Identity => ({
  username: "first-time-vendor",
  name: "Jordan Placeholder",
  email: "first.vendor@example.test",
  identityProvider: "bceid",
  sessionId: "s",
  expiresAt: 0,
  ...overrides,
});

let store: AccountsInMemory;
let sent: Envelope[];
let service: AccountsService;

beforeEach(() => {
  store = new AccountsInMemory();
  sent = [];
  const mailer = {
    send: vi.fn((envelope: Envelope) => sent.push(envelope)),
  } as unknown as Mailer;
  service = new AccountsService(store, mailer, {
    serviceOrigin: "http://localhost:4300",
    contactEmail: "digitalmarketplace@example.test",
  });
});

describe("a first sign-in (R-4.1)", () => {
  it("makes an active vendor account for a code-hosting identity", async () => {
    const { account, created } = await service.signIn(identity());

    expect(created).toBe(true);
    expect(account).toMatchObject({
      type: "VENDOR",
      status: "ACTIVE",
      name: "Jordan Placeholder",
      email: "first.vendor@example.test",
      idpUsername: "first-time-vendor",
      jobTitle: null,
      avatarImageFile: null,
    });
  });

  it("makes an active public sector account for a government identity", async () => {
    const { account } = await service.signIn(
      identity({ username: "first-time-gov", identityProvider: "idir", email: "first.gov@example.test" }),
    );

    expect(account.type).toBe("GOV");
  });

  it("reuses the account on every later sign-in rather than making another", async () => {
    const first = await service.signIn(identity());
    const second = await service.signIn(identity());

    expect(second.created).toBe(false);
    expect(second.account.id).toBe(first.account.id);
    expect(store.rows).toHaveLength(1);
  });

  it("finds a public sector employee an administrator has promoted", async () => {
    await service.signIn(identity({ username: "test-admin", identityProvider: "idir" }));
    (store.rows[0] as { type: AccountKind }).type = "ADMIN";

    const again = await service.signIn(identity({ username: "test-admin", identityProvider: "idir" }));

    expect(again.created).toBe(false);
    expect(again.account.type).toBe("ADMIN");
  });

  it("makes an account with no email address when the identity provider shared none", async () => {
    const { account } = await service.signIn(identity({ email: null }));

    expect(account.email).toBeNull();
  });

  it("starts with new-opportunity notices off (R-6.20)", async () => {
    const { account } = await service.signIn(identity());

    expect(account.notificationsOn).toBeNull();
  });

  it("refuses an identity the service does not recognise", async () => {
    await expect(service.signIn(identity({ identityProvider: "elsewhere" }))).rejects.toBeInstanceOf(
      SignInRefused,
    );
    expect(store.rows).toEqual([]);
  });

  it("refuses a second vendor carrying an email address another vendor holds (R-4.6)", async () => {
    await service.signIn(identity({ username: "test-vendor-1" }));

    await expect(service.signIn(identity({ username: "another" }))).rejects.toBeInstanceOf(SignInRefused);
    expect(store.rows).toHaveLength(1);
  });

  it("does not collide over email addresses between kinds, or between accounts with none", async () => {
    await service.signIn(identity({ username: "a", email: null }));
    await service.signIn(identity({ username: "b", email: null }));
    await service.signIn(identity({ username: "c", identityProvider: "idir" }));

    expect(store.rows).toHaveLength(3);
  });

  it("refuses an account an administrator deactivated (R-4.4)", async () => {
    await service.signIn(identity());
    (store.rows[0] as { status: string }).status = "INACTIVE_ADMIN";

    await expect(service.signIn(identity())).rejects.toBeInstanceOf(SignInRefused);
  });
});

describe("the welcome message (R-4.2)", () => {
  it("is sent once, when the account is made", async () => {
    await service.signIn(identity());
    await service.signIn(identity());

    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["first.vendor@example.test"]);
    expect(sent[0]?.message.kind).toBe("welcome");
  });

  it("is handed over addressed to nobody for an account without an address, which the mailer skips", async () => {
    await service.signIn(identity({ email: null }));

    expect(sent[0]?.to).toEqual([null]);
  });
});

describe("the account a request acts as", () => {
  it("is the signed-in person's own, and is not made by asking", async () => {
    await expect(service.actingAccount(identity())).rejects.toMatchObject({ status: 401 });
    await service.signIn(identity());
    await expect(service.actingAccount(identity())).resolves.toMatchObject({
      idpUsername: "first-time-vendor",
    });
  });

  it("is nobody's for a visitor", async () => {
    await expect(service.actingAccount(null)).rejects.toMatchObject({ status: 401 });
  });

  it("is refused for an account that is not active", async () => {
    await service.signIn(identity());
    (store.rows[0] as { status: string }).status = "INACTIVE_ADMIN";

    await expect(service.actingAccount(identity())).rejects.toMatchObject({ status: 401 });
  });
});

describe("completing a profile", () => {
  let vendor: Account;

  beforeEach(async () => {
    vendor = (await service.signIn(identity())).account;
  });

  it("saves the name and email address, the address in lower case (R-4.27)", async () => {
    const saved = await service.change(vendor, vendor.id, "updateProfile", {
      name: "Jordan P.",
      email: "Jordan@Example.TEST",
    });

    expect(saved).toMatchObject({ name: "Jordan P.", email: "jordan@example.test" });
  });

  it("refuses an empty name or a malformed address, naming the fields", async () => {
    await expect(
      service.change(vendor, vendor.id, "updateProfile", { name: "", email: "nope" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("keeps a job title the request does not carry (R-4.28)", async () => {
    store.rows[0] = { ...(store.rows[0] as Account), jobTitle: "Founder" };

    const saved = await service.change(vendor, vendor.id, "updateProfile", {
      name: "Jordan",
      email: "first.vendor@example.test",
    });

    expect(saved.jobTitle).toBe("Founder");
  });

  it("refuses an address another vendor holds, without saying so (R-4.6)", async () => {
    await service.signIn(identity({ username: "other", email: "taken@example.test" }));

    await expect(
      service.change(vendor, vendor.id, "updateProfile", { name: "J", email: "taken@example.test" }),
    ).rejects.toMatchObject({ status: 400, message: "Your profile could not be saved." });
  });

  it("records when the vendor agreed to the terms, both as standing and as last accepted (R-4.3)", async () => {
    const saved = await service.change(vendor, vendor.id, "acceptTerms", null);

    expect(saved.acceptedTermsAt).not.toBeNull();
    expect(saved.lastAcceptedTermsAt).toBe(saved.acceptedTermsAt);
  });

  it("never asks a public sector employee to agree to the terms (R-4.3)", async () => {
    const staff = (await service.signIn(identity({ username: "g", identityProvider: "idir" }))).account;

    await expect(service.change(staff, staff.id, "acceptTerms", null)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("records the moment new-opportunity notices were asked for, and empties it when they are stopped (R-4.24)", async () => {
    const on = await service.change(vendor, vendor.id, "updateNotifications", true);
    expect(on.notificationsOn).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const off = await service.change(vendor, vendor.id, "updateNotifications", false);
    expect(off.notificationsOn).toBeNull();
  });

  it("changes only the person's own account", async () => {
    const other = (await service.signIn(identity({ username: "other", email: "o@example.test" }))).account;

    await expect(
      service.change(vendor, other.id, "updateNotifications", true),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("refuses a change it does not make", async () => {
    await expect(service.change(vendor, vendor.id, "renameEverything", true)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("refuses an administrator's change to anyone but an administrator (R-4.12, R-4.19)", async () => {
    await expect(service.change(vendor, vendor.id, "updateAdminPermissions", true)).rejects.toMatchObject({
      status: 403,
    });
    await expect(service.change(vendor, vendor.id, "reactivateUser", null)).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe("an administrator's powers over somebody else's account", () => {
  let admin: Account;
  let staff: Account;
  let vendor: Account;

  beforeEach(async () => {
    const promoted = (await service.signIn(identity({ username: "a", identityProvider: "idir", email: "a@example.test" })))
      .account;
    store.rows[0] = { ...promoted, type: "ADMIN" };
    admin = store.rows[0] as Account;
    staff = (await service.signIn(identity({ username: "g", identityProvider: "idir", email: "g@example.test" }))).account;
    vendor = (await service.signIn(identity({ username: "v", email: "v@example.test", name: "Vee Vendor" }))).account;
    sent.length = 0;
  });

  it("grants a public sector employee administrator rights, and withdraws them again (R-4.12)", async () => {
    const granted = await service.change(admin, staff.id, "updateAdminPermissions", true);
    expect(granted.type).toBe("ADMIN");

    const withdrawn = await service.change(admin, staff.id, "updateAdminPermissions", false);
    expect(withdrawn.type).toBe("GOV");
  });

  it("refuses to make a vendor an administrator, saying vendors cannot be (R-4.12)", async () => {
    await expect(service.change(admin, vendor.id, "updateAdminPermissions", true)).rejects.toMatchObject({
      status: 400,
      message: "Vendors cannot be granted administrator permissions.",
    });
    expect((await store.findById(vendor.id))?.type).toBe("VENDOR");
  });

  it("deactivates an active account, recording when and by whom, and tells the person (R-4.30)", async () => {
    const { account, own } = await service.deactivate(admin, vendor.id);

    expect(own).toBe(false);
    expect(account).toMatchObject({ status: "INACTIVE_ADMIN", deactivatedBy: admin.id });
    expect(account.deactivatedOn).not.toBeNull();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["v@example.test"]);
    expect(sent[0]?.message.body.map((block) => JSON.stringify(block)).join(" ")).toMatch(
      /An administrator has deactivated your Digital Marketplace account.*digitalmarketplace@example\.test/,
    );
  });

  it("refuses to deactivate an account that is already inactive (R-4.31)", async () => {
    await service.deactivate(admin, vendor.id);

    await expect(service.deactivate(admin, vendor.id)).rejects.toMatchObject({
      status: 400,
      message: "This account is already inactive.",
    });
  });

  it("accepts an administrator's request to deactivate their own account (R-4.31)", async () => {
    const { account, own } = await service.deactivate(admin, admin.id);

    expect(own).toBe(true);
    expect(account.status).toBe("INACTIVE_USER");
  });

  it("lets nobody else deactivate somebody else's account", async () => {
    await expect(service.deactivate(staff, vendor.id)).rejects.toMatchObject({ status: 403 });
  });

  it("reactivates an account an administrator deactivated, telling the person an administrator did (R-4.19, R-4.20)", async () => {
    await service.deactivate(admin, vendor.id);
    sent.length = 0;

    const reactivated = await service.change(admin, vendor.id, "reactivateUser", null);

    expect(reactivated.status).toBe("ACTIVE");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.message.kind).toBe("reactivated-by-administrator");
    expect(JSON.stringify(sent[0]?.message.body)).toContain("An administrator has reactivated your Digital Marketplace account");
    expect(JSON.stringify(sent[0]?.message.body)).not.toContain("You have successfully reactivated");
  });

  it("refuses to reactivate an account its owner deactivated (R-4.19)", async () => {
    await service.deactivate(vendor, vendor.id);

    await expect(service.change(admin, vendor.id, "reactivateUser", null)).rejects.toMatchObject({ status: 400 });
    expect((await store.findById(vendor.id))?.status).toBe("INACTIVE_USER");
  });

  it("still refuses sign-in to an account an administrator deactivated (R-4.4)", async () => {
    await service.deactivate(admin, vendor.id);

    await expect(service.signIn(identity({ username: "v", email: "v@example.test" }))).rejects.toBeInstanceOf(SignInRefused);
  });

  it("lists everyone, active first, then by kind and name, to an administrator only (R-4.14, R-4.21)", async () => {
    await service.deactivate(admin, staff.id);

    const listed = await service.list(admin);
    expect(listed.map((account) => account.id)).toEqual([admin.id, vendor.id, staff.id]);

    await expect(service.list(vendor)).rejects.toMatchObject({ status: 401 });
    await expect(service.list(null)).rejects.toMatchObject({ status: 401 });
  });

  it("exports active contacts to an administrator only, refusing a request that chooses nothing (R-4.32)", async () => {
    await expect(service.contactList(vendor, "VENDOR", "email")).rejects.toMatchObject({ status: 401 });
    await expect(service.contactList(admin, "", "email")).rejects.toMatchObject({ status: 400 });

    const { asked, contacts } = await service.contactList(admin, "VENDOR", "firstName,email");
    expect(asked).toEqual({ kinds: ["VENDOR"], fields: ["firstName", "email"] });
    expect(contacts.map((contact) => contact.email)).toEqual(["v@example.test"]);
  });
});
