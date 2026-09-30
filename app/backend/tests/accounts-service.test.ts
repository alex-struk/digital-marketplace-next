import { beforeEach, describe, expect, it, vi } from "vitest";
import { Identity } from "../src/auth/identity";
import { Envelope } from "../src/mail/message";
import { Mailer } from "../src/mail/mailer";
import { AccountKind } from "../src/rules/users";
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
      notificationsOn: iso(change.notificationsOn, current.notificationsOn),
      acceptedTermsAt: iso(change.acceptedTermsAt, current.acceptedTermsAt),
      lastAcceptedTermsAt: iso(change.lastAcceptedTermsAt, current.lastAcceptedTermsAt),
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
  const mailer = { send: vi.fn((envelope: Envelope) => sent.push(envelope)) } as unknown as Mailer;
  service = new AccountsService(store, mailer, { serviceOrigin: "http://localhost:4300" });
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
    const saved = await service.changeOwn(vendor, vendor.id, "updateProfile", {
      name: "Jordan P.",
      email: "Jordan@Example.TEST",
    });

    expect(saved).toMatchObject({ name: "Jordan P.", email: "jordan@example.test" });
  });

  it("refuses an empty name or a malformed address, naming the fields", async () => {
    await expect(
      service.changeOwn(vendor, vendor.id, "updateProfile", { name: "", email: "nope" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("keeps a job title the request does not carry (R-4.28)", async () => {
    store.rows[0] = { ...(store.rows[0] as Account), jobTitle: "Founder" };

    const saved = await service.changeOwn(vendor, vendor.id, "updateProfile", {
      name: "Jordan",
      email: "first.vendor@example.test",
    });

    expect(saved.jobTitle).toBe("Founder");
  });

  it("refuses an address another vendor holds, without saying so (R-4.6)", async () => {
    await service.signIn(identity({ username: "other", email: "taken@example.test" }));

    await expect(
      service.changeOwn(vendor, vendor.id, "updateProfile", { name: "J", email: "taken@example.test" }),
    ).rejects.toMatchObject({ status: 400, message: "Your profile could not be saved." });
  });

  it("records when the vendor agreed to the terms, both as standing and as last accepted (R-4.3)", async () => {
    const saved = await service.changeOwn(vendor, vendor.id, "acceptTerms", null);

    expect(saved.acceptedTermsAt).not.toBeNull();
    expect(saved.lastAcceptedTermsAt).toBe(saved.acceptedTermsAt);
  });

  it("never asks a public sector employee to agree to the terms (R-4.3)", async () => {
    const staff = (await service.signIn(identity({ username: "g", identityProvider: "idir" }))).account;

    await expect(service.changeOwn(staff, staff.id, "acceptTerms", null)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("records the moment new-opportunity notices were asked for, and empties it when they are stopped (R-4.24)", async () => {
    const on = await service.changeOwn(vendor, vendor.id, "updateNotifications", true);
    expect(on.notificationsOn).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const off = await service.changeOwn(vendor, vendor.id, "updateNotifications", false);
    expect(off.notificationsOn).toBeNull();
  });

  it("changes only the person's own account", async () => {
    const other = (await service.signIn(identity({ username: "other", email: "o@example.test" }))).account;

    await expect(
      service.changeOwn(vendor, other.id, "updateNotifications", true),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("refuses a change it does not make here", async () => {
    await expect(service.changeOwn(vendor, vendor.id, "updateAdminPermissions", true)).rejects.toMatchObject({
      status: 400,
    });
  });
});
