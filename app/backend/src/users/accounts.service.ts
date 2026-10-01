import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Identity } from "../auth/identity";
import { Mailer, MAIL_SETTINGS } from "../mail/mailer";
import { MailSettings } from "../mail/settings";
import { welcome } from "../mail/notifications/welcome";
import { deactivatedOwnAccount, reactivatedOwnAccount } from "../mail/notifications/own-account";
import {
  deactivatedByAdministrator,
  reactivatedByAdministrator,
} from "../mail/notifications/administrator";
import { isIdentifier } from "../rules/files";
import {
  ALREADY_INACTIVE,
  Contact,
  ContactListRequest,
  accountKindForIdentity,
  accountKindsExported,
  accountKindsFor,
  administers,
  compareListedAccounts,
  kindWithAdministratorRights,
  mayListAccounts,
  reactivationRefusal,
  readContactListRequest,
  mayAgreeToTerms,
  mayReadAccount,
  mayRecordCapabilities,
  validCapabilities,
  validateProfile,
} from "../rules/users";
import {
  ACCOUNT_STORE,
  Account,
  AccountStore,
  DuplicateAccount,
  PICTURE_ACCESS,
  PictureAccess,
} from "./account";

/**
 * Sign-in failed. Deliberately says nothing about why — an unrecognised identity, an account
 * an administrator deactivated and an email address another account already holds all look
 * the same from outside (R-4.1, R-4.6; design/DESIGN.md, user-notice).
 */
export class SignInRefused extends ForbiddenException {
  constructor() {
    super("We could not sign you in.");
  }
}

/** The one refusal a failed profile save gets, whatever the cause (R-4.6). */
const PROFILE_NOT_SAVED = "Your profile could not be saved.";

/** The refusal of a request to read somebody else's account (R-4.25). */
export const NOT_PERMITTED_TO_READ_ACCOUNT = "You are not permitted to read that account.";

/** The refusal of the list of users, or of the contact list, to anyone but an administrator (R-4.21, R-4.32). */
export const ADMINISTRATORS_ONLY = "Only an administrator may do that.";

/** Until a file store is wired in, no picture can be named. */
const NO_PICTURES: PictureAccess = { mayRead: async () => false };

/**
 * Finding, making and changing accounts.
 *
 * Who a request comes from is the token's business; what they may do is the account's, as the
 * kept `users` table records its kind and status (decision record 0001, departure 2).
 */
@Injectable()
export class AccountsService {
  constructor(
    @Inject(ACCOUNT_STORE) private readonly accounts: AccountStore,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "contactEmail">,
    @Inject(PICTURE_ACCESS) private readonly pictures: PictureAccess = NO_PICTURES,
  ) {}

  /**
   * Signing in: the account this identity belongs to, made now if this is the person's first
   * sign-in (R-4.1).
   *
   * The kind of account is decided by the identity the person signed in with, and signing in
   * the same way again finds the same account rather than making another. A new account is
   * welcomed by email once it is saved, unless no address is known for it (R-4.2). An account
   * an administrator deactivated is refused (R-4.4); one its owner deactivated is let back in
   * and made active again (R-4.5).
   */
  async signIn(identity: Identity): Promise<{ account: Account; created: boolean }> {
    const kind = accountKindForIdentity(identity.identityProvider);
    if (!kind) throw new SignInRefused();

    const existing = await this.accounts.findBySignIn(identity.username, accountKindsFor(kind));
    if (existing) return { account: await this.usable(existing), created: false };

    let account: Account;
    try {
      account = await this.accounts.create({
        type: kind,
        name: identity.name,
        email: identity.email,
        idpUsername: identity.username,
      });
    } catch (error) {
      if (!(error instanceof DuplicateAccount)) throw error;
      // Either the same person's first sign-in was answered a moment ago, and that account is
      // theirs, or another account of this kind already holds their email address, and none
      // can be made (R-4.6).
      const madeMeanwhile = await this.accounts.findBySignIn(
        identity.username,
        accountKindsFor(kind),
      );
      if (madeMeanwhile) return { account: await this.usable(madeMeanwhile), created: false };
      throw new SignInRefused();
    }

    this.mailer.send(welcome(account, this.mail.serviceOrigin));
    return { account, created: true };
  }

  /**
   * The account a request acts as: the signed-in person's own, found and not made, and only
   * while it is active. A visitor, or a person whose account is not in use, may not act.
   */
  async actingAccount(identity: Identity | null | undefined): Promise<Account> {
    const account = await this.readingAccount(identity);
    if (!account) throw new UnauthorizedException("Sign in to do that.");
    return account;
  }

  /**
   * The account a request reads as: the signed-in person's own while it is active, or null for a
   * visitor and for a person whose account is not in use.
   */
  async readingAccount(identity: Identity | null | undefined): Promise<Account | null> {
    if (!identity) return null;
    const kind = accountKindForIdentity(identity.identityProvider);
    const account = kind
      ? await this.accounts.findBySignIn(identity.username, accountKindsFor(kind))
      : null;
    return account && account.status === "ACTIVE" ? account : null;
  }

  /**
   * Somebody's account, for that person or an administrator; anyone else is refused (R-4.25).
   * An administrator asking for an account that does not exist is told so.
   */
  async read(viewer: Account, accountId: string): Promise<Account> {
    if (!mayReadAccount(viewer, accountId)) {
      throw new UnauthorizedException(NOT_PERMITTED_TO_READ_ACCOUNT);
    }
    const account = await this.accounts.findById(accountId);
    if (!account) throw new NotFoundException("No account is held at that address.");
    return account;
  }

  /**
   * Everyone registered, for an administrator only, in the order the list is read in (R-4.14).
   * Anyone else — a public sector employee who is not an administrator, a vendor, a visitor — is
   * refused, and told nothing about any account (R-4.21).
   */
  async list(viewer: Account | null): Promise<Account[]> {
    if (!mayListAccounts(viewer)) throw new UnauthorizedException(ADMINISTRATORS_ONLY);
    return (await this.accounts.list()).sort(compareListedAccounts);
  }

  /**
   * What an administrator's export asks for, read from the address's two lists, and the
   * contacts it lists: the active accounts of the kinds asked for, administrators with public
   * sector employees, each with the organizations they belong to (R-4.32). Anyone else is
   * refused, and a request choosing no kind or no field is the requester's error.
   */
  async contactList(
    viewer: Account | null,
    userTypes: unknown,
    fields: unknown,
  ): Promise<{ readonly asked: ContactListRequest; readonly contacts: Contact[] }> {
    // Who is asking is settled first, so a refusal says nothing about how the request was made.
    if (!administers(viewer)) throw new UnauthorizedException(ADMINISTRATORS_ONLY);
    const read = readContactListRequest(userTypes, fields);
    if (!read.ok) throw new BadRequestException(read.errors);
    const contacts = await this.accounts.activeContacts(accountKindsExported(read.request.kinds));
    return { asked: read.request, contacts };
  }

  /**
   * One change to an account, named by its tag as every update is (the contract's
   * TaggedRequestBody).
   *
   * Reactivating an account and granting or withdrawing administrator rights are an
   * administrator's, over anybody's account (R-4.12, R-4.19). Every other change is to one's own
   * account only; a change of that kind submitted against anybody else's is refused, an
   * administrator's included (R-4.18).
   */
  async change(actor: Account, accountId: string, tag: string, value: unknown): Promise<Account> {
    if (tag === "reactivateUser" || tag === "updateAdminPermissions") {
      if (!administers(actor)) {
        throw new ForbiddenException("Only an administrator may do that.");
      }
      const target = await this.accounts.findById(accountId);
      if (!target) throw new NotFoundException("No account is held at that address.");
      return tag === "reactivateUser"
        ? this.reactivate(target)
        : this.updateAdministratorRights(target, value);
    }
    return this.changeOwn(actor, accountId, tag, value);
  }

  private async changeOwn(
    actor: Account,
    accountId: string,
    tag: string,
    value: unknown,
  ): Promise<Account> {
    if (actor.id !== accountId) {
      throw new ForbiddenException("You may change only your own account.");
    }
    switch (tag) {
      case "updateProfile":
        return this.updateProfile(actor, value);
      case "updateCapabilities":
        return this.updateCapabilities(actor, value);
      case "acceptTerms":
        return this.acceptTerms(actor);
      case "updateNotifications":
        return this.updateNotifications(actor, value);
      default:
        throw new BadRequestException("That change cannot be made here.");
    }
  }

  /**
   * Deactivating an account, kept rather than erased, with the date and who did it.
   *
   * A person deactivating their own is marked as having done it themselves and told by email
   * how to come back (R-4.9); ending their session is the caller's, since that is where the
   * session is known, and `own` says it is to be ended. An administrator is offered no control
   * for their own account, but the service accepts the request (R-4.31).
   *
   * An administrator deactivating somebody else's marks it as deactivated by an administrator,
   * and the person is told by email that their access has been removed (R-4.30). An account
   * already inactive is refused (R-4.31). Nobody else may deactivate another's account.
   */
  async deactivate(
    actor: Account,
    accountId: string,
  ): Promise<{ readonly account: Account; readonly own: boolean }> {
    if (actor.id === accountId) {
      const account = await this.accounts.update(actor.id, {
        status: "INACTIVE_USER",
        deactivatedOn: new Date(),
        deactivatedBy: actor.id,
      });
      this.mailer.send(deactivatedOwnAccount(account, this.mail.serviceOrigin));
      return { account, own: true };
    }
    if (!administers(actor)) {
      throw new ForbiddenException("You may deactivate only your own account.");
    }
    const target = await this.accounts.findById(accountId);
    if (!target) throw new NotFoundException("No account is held at that address.");
    if (target.status !== "ACTIVE") throw new BadRequestException(ALREADY_INACTIVE);
    const account = await this.accounts.update(target.id, {
      status: "INACTIVE_ADMIN",
      deactivatedOn: new Date(),
      deactivatedBy: actor.id,
    });
    this.mailer.send(deactivatedByAdministrator(account, this.mail));
    return { account, own: false };
  }

  /**
   * An administrator reactivating an account. Only one an administrator deactivated may be; one
   * its owner deactivated comes back by its owner signing in again (R-4.19). The person is told
   * an administrator reactivated it (R-4.20). The record of when it was deactivated is kept, as
   * it is when a person comes back by signing in.
   */
  private async reactivate(target: Account): Promise<Account> {
    const refusal = reactivationRefusal(target.status);
    if (refusal) throw new BadRequestException(refusal);
    const account = await this.accounts.update(target.id, { status: "ACTIVE" });
    this.mailer.send(reactivatedByAdministrator(account, this.mail));
    return account;
  }

  /**
   * Granting or withdrawing administrator rights, which takes effect at once. Only a public
   * sector employee's account may hold them, and withdrawing them makes it an ordinary public
   * sector employee's again; a vendor is refused, in the words the profile shows (R-4.12).
   */
  private async updateAdministratorRights(target: Account, value: unknown): Promise<Account> {
    if (typeof value !== "boolean") {
      throw new BadRequestException("Say whether the person is to be an administrator.");
    }
    const outcome = kindWithAdministratorRights(target.type, value);
    if (!outcome.ok) throw new BadRequestException(outcome.reason);
    if (outcome.kind === target.type) return target;
    try {
      return await this.accounts.update(target.id, { type: outcome.kind });
    } catch (error) {
      // Another account of the new kind already holds the person's sign-in or address (R-4.6).
      if (error instanceof DuplicateAccount) {
        throw new BadRequestException("The person's administrator permissions could not be changed.");
      }
      throw error;
    }
  }

  /**
   * The profile's name, email address, job title and picture (R-4.27). A job title the request
   * does not carry is left as it is, so a vendor, who is never asked for one, keeps whatever is
   * stored (R-4.28). A picture must be a stored file the person may read; one the request does
   * not name is left as it is, and `null` takes it away.
   */
  private async updateProfile(actor: Account, value: unknown): Promise<Account> {
    const input = (value ?? {}) as Record<string, unknown>;
    const validation = validateProfile({
      name: typeof input.name === "string" ? input.name : "",
      email: typeof input.email === "string" ? input.email : "",
      jobTitle: typeof input.jobTitle === "string" ? input.jobTitle : undefined,
    });
    if (!validation.ok) {
      throw new BadRequestException(Object.values(validation.errors));
    }

    let avatarImageFile: string | null | undefined;
    if (input.avatarImageFile === null) {
      avatarImageFile = null;
    } else if (input.avatarImageFile !== undefined) {
      const named = input.avatarImageFile;
      if (!isIdentifier(named) || !(await this.pictures.mayRead(named.toLowerCase(), actor))) {
        throw new BadRequestException(PROFILE_NOT_SAVED);
      }
      avatarImageFile = named.toLowerCase();
    }

    const { name, email, jobTitle } = validation.profile;
    try {
      return await this.accounts.update(actor.id, {
        name,
        email,
        ...(jobTitle === undefined ? {} : { jobTitle }),
        ...(avatarImageFile === undefined ? {} : { avatarImageFile }),
      });
    } catch (error) {
      // An address another account of the same kind holds is refused like any other failure
      // to save, and not explained (R-4.6).
      if (error instanceof DuplicateAccount) throw new BadRequestException(PROFILE_NOT_SAVED);
      throw error;
    }
  }

  /**
   * The capabilities a vendor holds, from the service's own list; an empty set is allowed
   * (R-4.8).
   */
  private async updateCapabilities(actor: Account, value: unknown): Promise<Account> {
    if (!mayRecordCapabilities(actor.type)) {
      throw new ForbiddenException("Only a vendor records capabilities.");
    }
    const capabilities = validCapabilities(value);
    if (!capabilities) {
      throw new BadRequestException("Choose capabilities only from the service's own list.");
    }
    return this.accounts.update(actor.id, { capabilities });
  }

  /**
   * Agreeing to the service's terms and conditions and its privacy policy, which only a vendor
   * does (R-4.3). Both the standing acceptance and the date terms were last accepted at all
   * are recorded.
   */
  private async acceptTerms(actor: Account): Promise<Account> {
    if (!mayAgreeToTerms(actor.type)) {
      throw new ForbiddenException("Only a vendor agrees to the terms and conditions.");
    }
    const now = new Date();
    return this.accounts.update(actor.id, {
      acceptedTermsAt: now,
      lastAcceptedTermsAt: now,
    });
  }

  /**
   * Turning new-opportunity notices on records the moment they were asked for; turning them off
   * empties the record, so no date is kept for that (R-4.24, R-4.29).
   */
  private async updateNotifications(actor: Account, value: unknown): Promise<Account> {
    if (typeof value !== "boolean") {
      throw new BadRequestException("Say whether notices are to be on or off.");
    }
    return this.accounts.update(actor.id, { notificationsOn: value ? new Date() : null });
  }

  /**
   * An account that may sign in. One an administrator deactivated may not (R-4.4). One its owner
   * deactivated is made active again, and its owner told so by email (R-4.5); the record of when
   * it was deactivated is kept.
   */
  private async usable(account: Account): Promise<Account> {
    if (account.status === "ACTIVE") return account;
    if (account.status !== "INACTIVE_USER") throw new SignInRefused();
    const reactivated = await this.accounts.update(account.id, { status: "ACTIVE" });
    this.mailer.send(reactivatedOwnAccount(reactivated, this.mail.serviceOrigin));
    return reactivated;
  }
}
