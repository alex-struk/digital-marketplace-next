import { AccountKind, AccountStatus } from "../rules/users";

/**
 * A person's account, as the kept `users` table holds it and as the service answers with it
 * (decision record 0011). Dates are ISO 8601 instants; a date that was never set is null.
 */
export interface Account {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly type: AccountKind;
  readonly status: AccountStatus;
  readonly name: string;
  readonly email: string | null;
  readonly jobTitle: string | null;
  readonly avatarImageFile: string | null;
  /** When new-opportunity notices were turned on, or null while they are off (R-4.24, R-6.20). */
  readonly notificationsOn: string | null;
  /** The acceptance of the terms that currently stands (R-4.3). */
  readonly acceptedTermsAt: string | null;
  /** When terms were last accepted at all; survives a withdrawal of the standing acceptance. */
  readonly lastAcceptedTermsAt: string | null;
  /** The sign-in username, shown read-only on the profile (R-4.27). */
  readonly idpUsername: string;
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
  readonly capabilities: readonly string[];
}

/** What a first sign-in records about a person (R-4.1, R-6.20). */
export interface NewAccount {
  readonly type: "GOV" | "VENDOR";
  readonly name: string;
  readonly email: string | null;
  readonly idpUsername: string;
}

/** A change to one's own account. Only the fields named are changed. */
export interface AccountChange {
  readonly name?: string;
  readonly email?: string;
  readonly jobTitle?: string;
  readonly notificationsOn?: Date | null;
  readonly acceptedTermsAt?: Date;
  readonly lastAcceptedTermsAt?: Date;
}

/**
 * Where accounts are kept. The service is written against this rather than against Prisma, so
 * the rules about finding, making and changing an account can be tested without a database.
 */
export interface AccountStore {
  /** The account signed in with this username, among accounts of the given kinds. */
  findBySignIn(username: string, kinds: readonly AccountKind[]): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  /** Makes the account, or throws `DuplicateAccount` when one would collide with another. */
  create(account: NewAccount): Promise<Account>;
  /** Changes the account, or throws `DuplicateAccount` when the change would collide. */
  update(id: string, change: AccountChange): Promise<Account>;
}

export const ACCOUNT_STORE = Symbol("AccountStore");

/**
 * An account that cannot be saved because another of the same kind already holds its
 * sign-in or its email address (R-4.6).
 */
export class DuplicateAccount extends Error {
  constructor() {
    super("Another account of the same kind already holds that sign-in or email address.");
    this.name = "DuplicateAccount";
  }
}
