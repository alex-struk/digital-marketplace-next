import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from "@nestjs/common";
import type { Claims } from "../auth/token-verifier";
import { CLOCK, Clock, systemClock } from "../common/clock";
import { SERVICE_CONFIG, ServiceConfig } from "../common/config";
import { MAILER, Mailer } from "../mail/mailer";
import { accountKindForIdentity, validateProfile } from "../rules/users";
import { welcomeMessage } from "./messages";
import { DuplicateAccountError, USER_STORE, User, UserStore } from "./user";

/** The refusal a person meets when sign-in cannot let them in, whatever the reason (R-4.4, R-4.6). */
export const SIGN_IN_REFUSED = "You could not be signed in.";

/** The refusal for a profile the service will not store, whatever the reason (R-4.6). */
export const PROFILE_NOT_SAVED = "Your profile could not be saved.";

/**
 * What happens to an account when its owner signs in and when they finish or change their
 * own profile.
 */
@Injectable()
export class AccountsService {
  constructor(
    @Inject(USER_STORE) private readonly users: UserStore,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(SERVICE_CONFIG) private readonly config: ServiceConfig,
    @Optional() @Inject(CLOCK) private readonly now: Clock = systemClock,
  ) {}

  /**
   * Sign a person in, from what their token says (decision record 0004).
   *
   * - The first time an identity signs in, an account is made for it, of the kind its
   *   identity decides, with the name and address the identity provider shared (R-4.1), and
   *   the person is welcomed (R-4.2). An identity of no kind the service knows is refused.
   * - The same identity signing in again finds the same account (R-4.1).
   * - An account that is not active is not let in (R-4.4). Reactivating an account its
   *   owner deactivated, by signing in again, is R-4.5's and arrives with slice 3.
   * - A new account that would share an address with another of its kind is not made, and
   *   the person is refused like any other failed sign-in (R-4.6).
   */
  async signIn(claims: Claims, existing: User | null): Promise<User> {
    const kind = accountKindForIdentity(claims.identityProvider);
    if (!kind) throw new ForbiddenException(SIGN_IN_REFUSED);

    if (existing) {
      // Slice 3 (R-4.5): an account its owner deactivated (INACTIVE_USER) is let back in
      // here, made active again, and its owner told. Until then it is refused like any
      // inactive account.
      if (existing.status !== "ACTIVE") throw new ForbiddenException(SIGN_IN_REFUSED);
      return existing;
    }

    let created: User;
    try {
      created = await this.users.create(
        {
          type: kind,
          name: claims.name ?? claims.username,
          email: claims.email ? claims.email.toLowerCase() : null,
          idpUsername: claims.username,
          idpId: claims.username,
        },
        this.now(),
      );
    } catch (error) {
      if (error instanceof DuplicateAccountError) {
        throw new ForbiddenException(SIGN_IN_REFUSED);
      }
      throw error;
    }
    this.mailer.send([welcomeMessage(created, this.config.publicOrigin)]);
    return created;
  }

  /**
   * Change one's own name, address and job title (R-4.27). A job title left out of the
   * change keeps the one stored, which is how a vendor — never asked for one (R-4.28) —
   * keeps whatever their account holds.
   */
  async updateProfile(account: User, value: unknown): Promise<User> {
    const input = asRecord(value);
    const validation = validateProfile({
      name: typeof input.name === "string" ? input.name : "",
      email: typeof input.email === "string" ? input.email : "",
      jobTitle:
        typeof input.jobTitle === "string" ? input.jobTitle : (account.jobTitle ?? ""),
    });
    if (!validation.valid) {
      throw new BadRequestException(Object.values(validation.problems));
    }
    try {
      return await this.users.updateProfile(account.id, validation.profile, this.now());
    } catch (error) {
      // A duplicate address is told apart from no other fault (R-4.6).
      if (error instanceof DuplicateAccountError) {
        throw new BadRequestException(PROFILE_NOT_SAVED);
      }
      throw error;
    }
  }

  /**
   * Agree to the service's terms and conditions and its privacy policy (R-4.3). Only a vendor
   * is asked to, and only for their own account; the moment is recorded both as the agreement
   * that stands and as the last agreement ever made.
   */
  async acceptTerms(account: User): Promise<User> {
    if (account.type !== "VENDOR") {
      throw new ForbiddenException("Only a vendor agrees to the terms and conditions.");
    }
    return this.users.acceptTerms(account.id, this.now());
  }

  /**
   * Ask for, or stop, new-opportunity notices (R-4.24). Asking records the moment it was
   * asked; stopping empties the record rather than dating it. Asking again while they are
   * already on keeps the moment they were first asked for.
   */
  async updateNotifications(account: User, value: unknown): Promise<User> {
    if (typeof value !== "boolean") {
      throw new BadRequestException("Say whether new-opportunity notices are wanted.");
    }
    const now = this.now();
    const since = value ? (account.notificationsOn ? new Date(account.notificationsOn) : now) : null;
    return this.users.setNotifications(account.id, since, now);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
