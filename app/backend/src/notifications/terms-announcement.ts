import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Mailer, MAIL_SETTINGS } from "../mail/mailer";
import { MailSettings } from "../mail/settings";
import { termsUpdated } from "../mail/notifications/terms-updated";
import { Viewer, administers } from "../rules/users";

/** A vendor to be told that the terms have changed. */
export interface VendorToTell {
  readonly id: string;
  readonly email: string | null;
}

/**
 * Where vendors' acceptances are kept. The announcement is written against this rather than
 * against Prisma, so what it withdraws and whom it tells can be tested without a database.
 */
export interface TermsStore {
  /**
   * Withdraws the standing acceptance of every vendor, active or not, keeping the date each
   * last accepted any terms (R-4.16). Answers with how many accounts it touched.
   */
  withdrawVendorAcceptances(): Promise<number>;
  /** Every active vendor, in a fixed order (R-6.23). */
  activeVendors(): Promise<VendorToTell[]>;
}

export const TERMS_STORE = Symbol("TermsStore");

/** The refusal of an announcement to anyone but an administrator, signed in or not (R-6.23). */
export const ONLY_ADMINISTRATORS_ANNOUNCE = "Only an administrator may announce changed terms.";

/** What the announcement answers with: done, once the acceptances are withdrawn (R-6.24). */
export interface Announced {
  readonly tag: "updateTerms";
  readonly withdrawn: number;
}

/**
 * An administrator announcing that the service's terms and conditions have changed.
 *
 * Every vendor's standing acceptance is withdrawn — deactivated vendors' too, who find the
 * change when they come back — and that is finished before the answer is given (R-4.16,
 * R-6.23, R-6.24). Each active vendor is then sent a message of their own, one after another,
 * after the answer has gone: the mailer passes over a vendor with no address and goes on past
 * one it cannot reach, and nothing reports how delivery went (R-6.2, R-6.28).
 */
@Injectable()
export class TermsAnnouncement {
  constructor(
    @Inject(TERMS_STORE) private readonly store: TermsStore,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin">,
  ) {}

  async announce(viewer: Viewer | null): Promise<Announced> {
    if (!administers(viewer)) throw new BadRequestException(ONLY_ADMINISTRATORS_ANNOUNCE);
    const withdrawn = await this.store.withdrawVendorAcceptances();
    const vendors = await this.store.activeVendors();
    this.mailer.sendEach(vendors.map((vendor) => termsUpdated(vendor, this.mail.serviceOrigin)));
    return { tag: "updateTerms", withdrawn };
  }
}
