/**
 * A message the service sends, before it is turned into mail.
 *
 * Every message is written once, as this document, and both of its forms come from it: the
 * formatted form and the plain-text form carry the same words and the same links because
 * they are two renderings of one thing, and nothing anywhere writes plain-text copy of its
 * own (R-6.5, decision record 0013).
 */

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
