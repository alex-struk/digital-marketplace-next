import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
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
 * change when they come back — and the answer is given the moment that is committed, with
 * nothing else in between (R-4.16, R-6.23, R-6.24). Only after the answer are the active
 * vendors looked up and each sent a message of their own, one after another: the mailer passes
 * over a vendor with no address and goes on past one it cannot reach, and nothing reports how
 * delivery went (R-6.2, R-6.28).
 */
@Injectable()
export class TermsAnnouncement {
  private readonly log = new Logger(TermsAnnouncement.name);

  constructor(
    @Inject(TERMS_STORE) private readonly store: TermsStore,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin">,
  ) {}

  async announce(viewer: Viewer | null): Promise<Announced> {
    if (!administers(viewer)) throw new BadRequestException(ONLY_ADMINISTRATORS_ANNOUNCE);
    const withdrawn = await this.store.withdrawVendorAcceptances();
    setImmediate(() => void this.tellActiveVendors());
    return { tag: "updateTerms", withdrawn };
  }

  /** After the answer: every active vendor, told. A failure here is the log's alone (R-6.2). */
  private async tellActiveVendors(): Promise<void> {
    try {
      const vendors = await this.store.activeVendors();
      this.mailer.sendEach(vendors.map((vendor) => termsUpdated(vendor, this.mail.serviceOrigin)));
    } catch (error) {
      this.log.error(`The vendors to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`);
    }
  }
}
