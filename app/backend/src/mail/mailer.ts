import type { MailConfig } from "../common/config";
import { htmlToText } from "./html-to-text";
import { MessageContent, renderMessage } from "./templates";

/**
 * One message to send: a visible recipient, anyone blind-copied, and what it says. A message
 * to many people is addressed to one of them with the rest blind-copied, so no recipient sees
 * who else it reached.
 */
export interface Outgoing {
  readonly to: string | null;
  readonly bcc?: readonly (string | null)[];
  /** Composed when it is sent, so a message that cannot be composed fails the send and nothing else. */
  readonly compose: () => MessageContent;
}

/** What actually goes over the wire, in every form it takes. */
export interface Envelope {
  readonly from: string;
  readonly to: string;
  readonly bcc: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/** Hands one finished message to a mail server; resolves when the server has taken it. */
export interface Transport {
  deliver(envelope: Envelope): Promise<void>;
}

export interface MailLog {
  failed(event: string, detail: string): void;
}

export const MAILER = Symbol("Mailer");

/**
 * The one way the service sends mail, used by every message any slice adds.
 *
 * - Every message comes from the one configured sender and names no separate reply-to
 *   address (R-6.4).
 * - Every message goes in a formatted form and a plain-text form rendered from it (R-6.5).
 * - A test environment's messages are marked as tests in the subject and the logo (R-6.3).
 * - When notifications are switched off for the environment, nothing is sent (R-6.1).
 * - A recipient with no address is left out, and a message left with nobody to go to is not
 *   composed at all (R-6.28).
 * - Sending never holds up or fails the action that asked for it: `send` returns at once,
 *   and a message that cannot be composed or delivered is written to the operational log and
 *   given up on, with no retry, while the rest carry on (R-6.2, R-6.28).
 */
export class Mailer {
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly config: MailConfig,
    private readonly publicOrigin: string,
    private readonly transport: Transport,
    private readonly log: MailLog,
  ) {}

  /** Send some messages, after the caller has had its answer. Never throws. */
  send(messages: readonly Outgoing[]): void {
    if (this.config.disabled) return;
    const addressed = messages.map(addressable).filter(isPresent);
    if (addressed.length === 0) return;
    const run = this.deliverAll(addressed).finally(() => this.pending.delete(run));
    this.pending.add(run);
  }

  /** Resolves once everything handed to `send` so far has been attempted. For tests and shutdown. */
  async settled(): Promise<void> {
    while (this.pending.size > 0) await Promise.all([...this.pending]);
  }

  /** A message as it would be sent, in every form. Exposed so its composition can be checked. */
  envelope(to: string, bcc: readonly string[], content: MessageContent): Envelope {
    const html = renderMessage(content, {
      publicOrigin: this.publicOrigin,
      markAsTest: this.config.markAsTest,
    });
    const { name, address } = this.config.from;
    return {
      from: `"${name.replace(/["\\]/g, "")}" <${address}>`,
      to,
      bcc,
      subject: this.config.markAsTest ? `[TEST] ${content.subject}` : content.subject,
      html,
      text: htmlToText(html),
    };
  }

  private async deliverAll(messages: readonly Addressed[]): Promise<void> {
    // Off the caller's path entirely: the action that asked has already been answered.
    await new Promise<void>((next) => setImmediate(next));
    for (const message of messages) {
      try {
        const envelope = this.envelope(message.to, message.bcc, message.compose());
        await this.transport.deliver(envelope);
      } catch (error) {
        // The operational log only, and no address in it (constitution P3). Nobody is told,
        // nothing is retried, and the next message is still sent.
        this.log.failed("mail-not-sent", reasonOf(error));
      }
    }
  }
}

interface Addressed {
  readonly to: string;
  readonly bcc: readonly string[];
  readonly compose: () => MessageContent;
}

/**
 * Why a send failed, in words that carry no address: a mail server's refusal can quote the
 * recipient back, so only its code is kept.
 */
export function reasonOf(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const { code, responseCode, name } = error as {
      code?: unknown;
      responseCode?: unknown;
      name?: unknown;
    };
    const parts = [code, responseCode].filter(
      (part) => typeof part === "string" || typeof part === "number",
    );
    if (parts.length > 0) return parts.join(" ");
    if (typeof name === "string") return name;
  }
  return "unknown";
}

function hasAddress(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function addressable(message: Outgoing): Addressed | null {
  const everyone = [message.to, ...(message.bcc ?? [])].filter(hasAddress);
  const [to, ...bcc] = everyone;
  if (!to) return null;
  return { to, bcc, compose: message.compose };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
