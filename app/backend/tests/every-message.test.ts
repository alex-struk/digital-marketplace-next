import { describe, expect, it, vi } from "vitest";
import { MailLog, Mailer, MailTransport, OutgoingMail } from "../src/mail/mailer";
import { Envelope, Message } from "../src/mail/message";
import { MailSettings } from "../src/mail/settings";
import { deactivatedByAdministrator, reactivatedByAdministrator } from "../src/mail/notifications/administrator";
import {
  newOpportunityPublished,
  publishedToAuthor,
  submittedForReview,
  submittedForReviewToAuthor,
} from "../src/mail/notifications/code-with-us-opportunity";
import { organizationArchivedByAdministrator } from "../src/mail/notifications/organization";
import {
  addedToEvaluationPanel,
  otherOpportunityPublished,
  otherPublishedToAuthor,
  otherSubmittedForReview,
  otherSubmittedForReviewToAuthor,
} from "../src/mail/notifications/other-program-opportunity";
import { deactivatedOwnAccount, reactivatedOwnAccount } from "../src/mail/notifications/own-account";
import { cancelledToAuthor, opportunityCancelled, opportunityUpdated } from "../src/mail/notifications/running-opportunity";
import {
  invitationAcceptedToMember,
  invitationAcceptedToOwner,
  invitationDeclinedToOwner,
  invitedToRegister,
  invitedToTeam,
} from "../src/mail/notifications/team";
import { termsUpdated } from "../src/mail/notifications/terms-updated";
import { readyForEvaluationToAuthor, readyForEvaluationToEvaluators } from "../src/mail/notifications/closing";
import { readyForConsensus } from "../src/mail/notifications/evaluation";
import {
  proposalAwarded,
  proposalNotAwarded,
  proposalSubmitted,
  proposalWithdrawnToAdministrators,
  proposalWithdrawnToVendor,
} from "../src/mail/notifications/proposal";
import { welcome } from "../src/mail/notifications/welcome";

/**
 * The service-wide rules for mail (R-6.2, R-6.3, R-6.4, R-6.5), checked against every message a
 * screen can cause to be sent by now — signing up, accounts, changed terms, opportunities in all
 * three programs and their running, organizations and their teams — rather than against a sample:
 * each comes from the one configured sender with no reply-to of its own, is marked as a test in a
 * test environment with the test logo, carries a plain-text form rendered from the formatted one,
 * and, when it cannot be delivered, fails quietly and once.
 */
const settings: MailSettings = {
  from: "Digital Marketplace <donotreply@example.test>",
  fromAddress: "donotreply@example.test",
  disabled: false,
  testEnvironment: true,
  serviceOrigin: "http://localhost:4300",
  contactEmail: "digitalmarketplace@example.test",
  smtp: { host: "mail", port: 1025 },
};
const origin = settings.serviceOrigin;
const look = { serviceOrigin: origin, contactEmail: settings.contactEmail };
const person = { name: "Alex Placeholder", email: "alex@example.test" };
const organization = { id: "00000000-0000-4000-8000-000000000301", legalName: "Northern Pines Digital Ltd." };
const cwu = { id: "00000000-0000-4000-8000-000000000601", title: "Build a tracker", reward: 5000, proposalDeadline: "2030-06-01" };
const swu = { program: "sprint-with-us" as const, id: "00000000-0000-4000-8000-000000000701", title: "A sprint", budget: 500000, proposalDeadline: "2030-06-01" };
const running = { program: "code-with-us" as const, id: cwu.id, title: cwu.title };
const to = (message: Message): Envelope => ({ to: [person.email], message });
const proposalSubject = {
  program: "code-with-us" as const,
  opportunityId: cwu.id,
  opportunityTitle: cwu.title,
  proposalId: "00000000-0000-4000-a006-000000000101",
};

const EVERY_MESSAGE: readonly Envelope[] = [
  welcome(person, origin),
  deactivatedOwnAccount(person, origin),
  reactivatedOwnAccount(person, origin),
  deactivatedByAdministrator(person, look),
  reactivatedByAdministrator(person, look),
  termsUpdated(person, origin),
  to(submittedForReview(cwu, origin)),
  submittedForReviewToAuthor(person, cwu, origin),
  to(newOpportunityPublished(cwu, origin)),
  publishedToAuthor(person, cwu, origin),
  to(otherSubmittedForReview(swu, origin)),
  otherSubmittedForReviewToAuthor(person, swu, origin),
  to(otherOpportunityPublished(swu, origin)),
  otherPublishedToAuthor(person, swu, origin),
  to(addedToEvaluationPanel(swu, origin)),
  to(opportunityUpdated(running, { kind: "addendum", addendum: "The meeting is by video." }, origin)),
  to(opportunityUpdated(running, { kind: "edited" }, origin)),
  to(opportunityCancelled(running, origin)),
  cancelledToAuthor(person, running, origin),
  organizationArchivedByAdministrator(person, organization, look),
  invitedToTeam(person, organization, "00000000-0000-4000-8000-000000000407", look),
  invitedToRegister(person.email, organization, look),
  invitationAcceptedToOwner(person, person, organization, look),
  invitationAcceptedToMember(person, organization, look),
  invitationDeclinedToOwner(person, person, organization, look),
  to(readyForEvaluationToAuthor(running, origin)),
  to(readyForEvaluationToEvaluators({ program: "sprint-with-us", id: swu.id, title: swu.title }, origin)),
  to(readyForConsensus({ program: "sprint-with-us", id: swu.id, title: swu.title }, origin)),
  to(readyForConsensus({ program: "team-with-us", id: "00000000-0000-4000-8000-000000000801", title: "A team" }, origin)),
  to(proposalSubmitted(proposalSubject, origin)),
  to(proposalWithdrawnToVendor(proposalSubject, origin)),
  to(proposalWithdrawnToAdministrators(proposalSubject, organization.legalName, origin)),
  to(proposalAwarded(proposalSubject, origin)),
  to(proposalNotAwarded(proposalSubject, organization.legalName, origin)),
];

class RecordingTransport implements MailTransport {
  readonly sent: OutgoingMail[] = [];
  failing = false;
  async deliver(mail: OutgoingMail): Promise<void> {
    if (this.failing) throw Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    this.sent.push(mail);
  }
}

const linksIn = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!.replace(/&amp;/g, "&"));

describe("every message the service sends", () => {
  it("covers each kind once", () => {
    const kinds = EVERY_MESSAGE.map((envelope) => envelope.message.kind);
    expect(new Set(kinds).size).toBe(kinds.length - 1); // the edited and the addendum notices share a kind
  });

  for (const envelope of EVERY_MESSAGE) {
    it(`${envelope.message.kind}: comes from the one sender, marked as a test, in two forms (R-6.3, R-6.4, R-6.5)`, async () => {
      const transport = new RecordingTransport();
      const mailer = new Mailer(settings, transport, vi.fn<MailLog>());
      expect(await mailer.deliver(envelope)).toBe("sent");

      const [mail] = transport.sent;
      expect(mail!.from).toBe("Digital Marketplace <donotreply@example.test>");
      expect(Object.keys(mail!)).not.toContain("replyTo");
      expect(mail!.subject.startsWith("[TEST] ")).toBe(true);
      expect(mail!.html).toContain(`${origin}/images/logo_test.png`);
      // The plain text is the formatted form rendered: the same heading, and every link.
      expect(mail!.text).toContain(envelope.message.title);
      for (const link of linksIn(mail!.html)) {
        if (link.startsWith("mailto:")) expect(mail!.text).toContain(link.slice("mailto:".length));
        else expect(mail!.text).toContain(link);
      }
    });

    it(`${envelope.message.kind}: when it cannot be delivered, fails quietly and is tried once (R-6.2)`, async () => {
      const transport = new RecordingTransport();
      transport.failing = true;
      const deliver = vi.spyOn(transport, "deliver");
      const log = vi.fn<MailLog>();
      const mailer = new Mailer(settings, transport, log);
      await expect(mailer.deliver(envelope)).resolves.toBe("not-delivered");
      expect(deliver).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(expect.objectContaining({ level: "error", event: "mail-not-delivered", reason: "ECONNREFUSED" }));
      expect(JSON.stringify(log.mock.calls)).not.toContain(person.email);
    });
  }
});
