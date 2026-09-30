import { createTransport } from "nodemailer";
import { MailTransport, OutgoingMail } from "./mailer";
import { MailSettings } from "./settings";

/**
 * Delivery over SMTP. Each message goes over a fresh connection, so a mail server that
 * refused or dropped one message has no hold over the next.
 *
 * The timeouts are what make an unreachable server a failure rather than a wait: a server
 * that has not greeted within five seconds is given up on, and that failure is the mailer's
 * to log (R-6.2).
 */
export class SmtpTransport implements MailTransport {
  constructor(private readonly settings: MailSettings) {}

  async deliver(mail: OutgoingMail): Promise<void> {
    const transport = createTransport({
      host: this.settings.smtp.host,
      port: this.settings.smtp.port,
      secure: false,
      // The sandbox's mail catcher speaks plain SMTP; a server that offers encryption is
      // still used with it.
      ignoreTLS: false,
      requireTLS: false,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10_000,
      greetingTimeout: 5_000,
      socketTimeout: 60_000,
    });
    try {
      await transport.sendMail({
        from: mail.from,
        to: [...mail.to],
        bcc: mail.bcc.length > 0 ? [...mail.bcc] : undefined,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } finally {
      transport.close();
    }
  }
}
