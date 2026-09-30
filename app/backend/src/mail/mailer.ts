import { Envelope } from "./message";
import { render } from "./render";
import { MailSettings } from "./settings";

/** One piece of mail, ready for a mail server. */
export interface OutgoingMail {
  readonly from: string;
  readonly to: readonly string[];
  readonly bcc: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/** Where mail is handed to be delivered. */
export interface MailTransport {
  deliver(mail: OutgoingMail): Promise<void>;
}

export const MAIL_TRANSPORT = Symbol("MailTransport");
export const MAIL_SETTINGS = Symbol("MailSettings");

/** What happened to one message, for the operational log and for tests. */
export type Outcome = "sent" | "switched-off" | "no-recipient" | "not-delivered";

/**
 * A line for the operational log. It names the kind of message and what happened to it, and
 * never an address, a name or a body (constitution P3).
 */
export type MailLog = (entry: {
  level: "info" | "error";
  event: string;
  kind: string;
  reason?: string;
}) => void;

function addressesIn(list: readonly (string | null | undefined)[] | undefined): string[] {
  return (list ?? [])
    .map((address) => (address ?? "").trim())
    .filter((address) => address.length > 0);
}

/**
 * The one way the service sends mail. Every message goes through it, and it:
 *
 * - sends from the one configured sender and sets no reply-to of its own (R-6.4);
 * - sends both a formatted and a plain-text form, and marks a test environment's mail (R-6.3,
 *   R-6.5);
 * - sends nothing at all when notifications are switched off for the environment (R-6.1);
 * - skips a recipient that holds no email address, and sends nothing when that leaves nobody
 *   (R-6.28, R-4.2);
 * - never makes the action it follows wait or fail: `send` hands the message over and returns
 *   at once, a failure to compose or deliver is written to the operational log only, and
 *   nothing is tried again (R-6.2).
 */
export class Mailer {
  constructor(
    private readonly settings: MailSettings,
    private readonly transport: MailTransport,
    private readonly log: MailLog,
  ) {}

  /**
   * Hand a message over to be sent, and return at once. Call it after the action the message
   * follows has been saved: the message goes out afterwards, on its own, and whatever happens
   * to it happens to nobody but the log.
   */
  send(envelope: Envelope): void {
    setImmediate(() => {
      void this.deliver(envelope);
    });
  }

  /**
   * Hand several messages over, one after another. A message that cannot be addressed or
   * delivered is passed over and the rest still go (R-6.28).
   */
  sendEach(envelopes: readonly Envelope[]): void {
    setImmediate(() => {
      void (async () => {
        for (const envelope of envelopes) await this.deliver(envelope);
      })();
    });
  }

  /** Compose and deliver one message now. It never throws. */
  async deliver(envelope: Envelope): Promise<Outcome> {
    const kind = envelope.message.kind;
    try {
      if (this.settings.disabled) return "switched-off";

      const to = addressesIn(envelope.to);
      const bcc = addressesIn(envelope.bcc);
      if (to.length === 0 && bcc.length === 0) {
        this.log({ level: "info", event: "mail-skipped-no-address", kind });
        return "no-recipient";
      }

      const rendered = render(envelope.message, this.settings);
      await this.transport.deliver({
        from: this.settings.from,
        // A batch that is all blind copies is visibly addressed to the service itself, so
        // nobody sees who else it reached.
        to: to.length > 0 ? to : [this.settings.fromAddress],
        bcc,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      this.log({ level: "info", event: "mail-sent", kind });
      return "sent";
    } catch (error) {
      this.log({
        level: "error",
        event: "mail-not-delivered",
        kind,
        reason: reasonFor(error),
      });
      return "not-delivered";
    }
  }
}

/** Why delivery failed, in words that carry no address: the error's code, or its class. */
function reasonFor(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as { code?: unknown; responseCode?: unknown; name?: unknown };
    if (typeof record.responseCode === "number") return `smtp-${record.responseCode}`;
    if (typeof record.code === "string") return record.code;
    if (typeof record.name === "string") return record.name;
  }
  return "unknown";
}
