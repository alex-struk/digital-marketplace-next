/**
 * A message the service sends, before it is turned into mail.
 *
 * Every message is written once, as this document, and both of its forms come from it: the
 * formatted form and the plain-text form carry the same words and the same links because
 * they are two renderings of one thing, and nothing anywhere writes plain-text copy of its
 * own (R-6.5, decision record 0013).
 */

import { DEFAULT_BATCH_SIZE } from "./settings";

/** A run of words, or a link with its label. */
export type Inline = string | { readonly text: string; readonly href: string };

export type Block =
  /** A paragraph of words and links. */
  | { readonly kind: "paragraph"; readonly content: readonly Inline[] }
  /** The one thing the message asks the reader to do, as a prominent link. */
  | { readonly kind: "action"; readonly label: string; readonly href: string };

export interface Message {
  /** Which message this is, for the operational log. Never shown to anyone. */
  readonly kind: string;
  readonly subject: string;
  /** The heading at the top of the body. */
  readonly title: string;
  readonly body: readonly Block[];
  /**
   * Whether the reader's new-opportunity notice choice governs this message. Only the
   * announcement of a newly published opportunity is (spec/contract/observables.yaml,
   * governed_by_notification_setting); only such a message ends with an offer to unsubscribe
   * (R-6.6, R-6.16, decision record 0022).
   */
  readonly governedByNoticeChoice?: boolean;
}

/**
 * A message and who it is for. `to` is who the message is visibly addressed to and `bcc` who
 * receives it as a blind copy. An entry with no address — an account whose identity provider
 * shared none — is skipped rather than sent to (R-6.28).
 */
export interface Envelope {
  readonly to: readonly (string | null | undefined)[];
  readonly bcc?: readonly (string | null | undefined)[];
  readonly message: Message;
}

/**
 * One message to many people: split into batches of at most `size`, each carrying its batch as
 * blind copies and nobody in the visible address line, which the mailer fills with the service's
 * own address. No recipient can see who else received it (R-6.8, R-6.15). A recipient with no
 * address keeps its place in a batch and is skipped when the batch is sent (R-6.28).
 */
export function blindCopiedBatches(
  recipients: readonly (string | null | undefined)[],
  message: Message,
  size: number,
): Envelope[] {
  const batchSize = Math.max(1, Math.floor(size));
  const batches: Envelope[] = [];
  for (let start = 0; start < recipients.length; start += batchSize) {
    batches.push({ to: [], bcc: recipients.slice(start, start + batchSize), message });
  }
  return batches;
}

/**
 * One notice to a small, named group of staff — a panel's evaluators, its chair and the
 * opportunity's owner, the administrators — carried exactly as every other multi-recipient notice
 * is: the group as blind copies, the service's own address the only visible recipient, so nobody
 * sees who else was told (R-6.15; decision record 0063). A recipient with no address is left out
 * (R-6.28), and one named twice is told once.
 */
export function blindCopiedToStaff(
  recipients: readonly (string | null | undefined)[],
  message: Message,
  size: number = DEFAULT_BATCH_SIZE,
): Envelope[] {
  const seen = new Set<string>();
  const distinct: string[] = [];
  for (const recipient of recipients) {
    const address = (recipient ?? "").trim();
    if (!address || seen.has(address.toLowerCase())) continue;
    seen.add(address.toLowerCase());
    distinct.push(address);
  }
  return blindCopiedBatches(distinct, message, size);
}
