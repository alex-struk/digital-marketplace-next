import type { AccountKind, AccountStatus } from "../rules/users";

/**
 * A person's account, as the service answers with it (decision record 0011). The fields are
 * the kept `users` table's, less the identity provider's own identifier, which nothing
 * outside the sign-in needs.
 */
export interface User {
  readonly id: string;
  readonly type: AccountKind;
  readonly status: AccountStatus;
  readonly name: string;
  readonly email: string | null;
  readonly jobTitle: string | null;
  readonly avatarImageFile: string | null;
  /** When new-opportunity notices were asked for, or null while they are off (R-6.20, R-4.24). */
  readonly notificationsOn: string | null;
  /** The agreement to the terms that stands now (R-4.3). */
  readonly acceptedTermsAt: string | null;
  /** When the terms were last agreed to at all; it outlives a withdrawal (R-4.16). */
  readonly lastAcceptedTermsAt: string | null;
  /** The sign-in username, shown read-only on the profile (R-4.27). */
  readonly idpUsername: string;
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
  readonly capabilities: readonly string[];
}

/** What the service knows about a person from the identity provider, at sign-in. */
export interface NewAccount {
  readonly type: "VENDOR" | "GOV";
  readonly name: string;
  readonly email: string | null;
  readonly idpUsername: string;
  readonly idpId: string;
}

export interface ProfileChange {
  readonly name: string;
  readonly email: string;
  readonly jobTitle: string;
}

/** The store's report that a change would give two accounts of one kind the same address (R-4.6). */
export class DuplicateAccountError extends Error {}

/**
 * Where accounts are kept. The service is written against this rather than against Prisma,
 * so the rules about who is let in and what is recorded can be tested without a database.
 */
export interface UserStore {
  findById(id: string): Promise<User | null>;
  /** The account one identity signs in as, among the kinds it may be. */
  findByIdentity(idpId: string, kinds: readonly AccountKind[]): Promise<User | null>;
  /** Throws DuplicateAccountError when the kind already has the identity or the address. */
  create(account: NewAccount, at: Date): Promise<User>;
  /** Throws DuplicateAccountError when another account of the kind holds the address. */
  updateProfile(id: string, change: ProfileChange, at: Date): Promise<User>;
  acceptTerms(id: string, at: Date): Promise<User>;
  setNotifications(id: string, since: Date | null, at: Date): Promise<User>;
}

export const USER_STORE = Symbol("UserStore");
