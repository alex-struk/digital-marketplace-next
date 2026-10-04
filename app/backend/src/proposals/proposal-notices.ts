import { Inject, Injectable, Logger } from "@nestjs/common";
import { MAIL_SETTINGS, Mailer } from "../mail/mailer";
import { Envelope, blindCopiedToStaff } from "../mail/message";
import {
  ProposalSubject,
  proposalAwarded,
  proposalNotAwarded,
  proposalSubmitted,
  proposalWithdrawnToAdministrators,
  proposalWithdrawnToVendor,
} from "../mail/notifications/proposal";
import { MailSettings } from "../mail/settings";
import { PrismaService } from "../prisma/prisma.service";

/** Who is told about a proposal: an account's address while it is active, and the administrators'. */
export interface ProposalRecipients {
  /** An account's address, if the account is active (R-6.17). */
  address(accountId: string): Promise<string | null>;
  /** Every active administrator's address. */
  administrators(): Promise<(string | null)[]>;
}

export const PROPOSAL_RECIPIENTS = Symbol("ProposalRecipients");

@Injectable()
export class PrismaProposalRecipients implements ProposalRecipients {
  constructor(private readonly prisma: PrismaService) {}

  async address(accountId: string): Promise<string | null> {
    const found = await this.prisma.users.findUnique({ where: { id: accountId }, select: { email: true, status: true } });
    return found && found.status === "ACTIVE" ? found.email : null;
  }

  async administrators(): Promise<(string | null)[]> {
    const found = await this.prisma.users.findMany({
      where: { type: "ADMIN", status: "ACTIVE" },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });
    return found.map((account) => account.email);
  }
}

/** A proposal a notice is about, and the vendor who wrote it. */
export interface NoticeProposal {
  readonly subject: ProposalSubject;
  readonly vendor: string | null;
}

/**
 * The notices that follow what happens to a proposal, in every program (R-2.36): a confirmation to
 * the vendor who submits, an award notice to the winner and a decision notice naming the winner to
 * each proponent passed over (R-6.25), and a withdrawal notice to the vendor and to every
 * administrator. Each is composed after the change is saved and handed to the mail path; nothing
 * about it reaches the person who acted (R-6.2).
 */
@Injectable()
export class ProposalNotices {
  private readonly log = new Logger(ProposalNotices.name);

  constructor(
    @Inject(PROPOSAL_RECIPIENTS) private readonly recipients: ProposalRecipients,
    private readonly mailer: Mailer,
    @Inject(MAIL_SETTINGS) private readonly mail: Pick<MailSettings, "serviceOrigin" | "batchSize">,
  ) {}

  submitted(proposal: NoticeProposal): void {
    this.afterwards(async (origin) => {
      const address = await this.addressOf(proposal.vendor);
      return address ? [{ to: [address], message: proposalSubmitted(proposal.subject, origin) }] : [];
    });
  }

  withdrawn(proposal: NoticeProposal, proponent: string): void {
    this.afterwards(async (origin) => {
      const [address, administrators] = await Promise.all([this.addressOf(proposal.vendor), this.recipients.administrators()]);
      return [
        ...(address ? [{ to: [address], message: proposalWithdrawnToVendor(proposal.subject, origin) }] : []),
        ...blindCopiedToStaff(administrators, proposalWithdrawnToAdministrators(proposal.subject, proponent, origin), this.mail.batchSize),
      ];
    });
  }

  awarded(winner: NoticeProposal, winnerName: string | null, passedOver: readonly NoticeProposal[]): void {
    this.afterwards(async (origin) => {
      const envelopes: Envelope[] = [];
      const address = await this.addressOf(winner.vendor);
      if (address) envelopes.push({ to: [address], message: proposalAwarded(winner.subject, origin) });
      for (const other of passedOver) {
        const otherAddress = await this.addressOf(other.vendor);
        if (otherAddress) envelopes.push({ to: [otherAddress], message: proposalNotAwarded(other.subject, winnerName, origin) });
      }
      return envelopes;
    });
  }

  private addressOf(accountId: string | null): Promise<string | null> {
    return accountId ? this.recipients.address(accountId) : Promise.resolve(null);
  }

  /** After the answer; a failure to look anybody up is the operational log's alone (R-6.2). */
  private afterwards(compose: (origin: string) => Promise<Envelope[]>): void {
    setImmediate(() => {
      compose(this.mail.serviceOrigin)
        .then((envelopes) => this.mailer.sendEach(envelopes))
        .catch((error: unknown) =>
          this.log.error(`The people to tell could not be read: ${error instanceof Error ? error.name : "fault"}.`),
        );
    });
  }
}
