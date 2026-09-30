import { createTransport } from "nodemailer";
import type { MailConfig } from "../common/config";
import type { Envelope, Transport } from "./mailer";

/**
 * Delivery over SMTP, one fresh connection per message, as the old service sent them. A mail
 * server that has not greeted the service within five seconds is given up on, so a slow one
 * delays delivery and an unresponsive one fails it.
 */
export class SmtpTransport implements Transport {
  constructor(private readonly smtp: MailConfig["smtp"]) {}

  async deliver(envelope: Envelope): Promise<void> {
    const transport = createTransport({
      host: this.smtp.host,
      port: this.smtp.port,
      secure: false,
      ignoreTLS: true,
      greetingTimeout: 5_000,
      connectionTimeout: 10_000,
      socketTimeout: 60_000,
    });
    try {
      await transport.sendMail({
        from: envelope.from,
        to: envelope.to,
        bcc: envelope.bcc.length > 0 ? [...envelope.bcc] : undefined,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
      });
    } finally {
      transport.close();
    }
  }
}
